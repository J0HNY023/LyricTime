/* ==========================================================================
   main.js — Main application logic, word management, and render loop
   ========================================================================== */

// --- Global State ---
let canvas, ctx;
let isAudioSyncMode = false;
let activeWordsData = [];
let words = [];
let currentTime = 0;
let isPlaying = true;
let lastFrameTime = performance.now();

// UI Elements (assumed to exist in HTML)
let fontScaleInput, fontStyleInput, trackingInput;
let displayModeSelect, effectModeSelect;
let transcriptTextarea, timestampTextarea;
let playPauseBtn, timeSlider, timeDisplay;

// Drag/Transform State
let selectedWord = null;
let isDragging = false;
let dragMode = 'move'; // 'move', 'resize', 'rotate'
let dragStartPos = { x: 0, y: 0 };
let dragStartValues = { x: 0, y: 0, scale: 1, rotation: 0 };
let activePointerId = null;

// Marquee Selection State
let isMarqueeSelecting = false;
let marqueeStartX = 0;
let marqueeStartY = 0;
let marqueeCurrentX = 0;
let marqueeCurrentY = 0;

// Debug
let isDebugMode = false;

// Display Mode (1, 2, or 3 lines)
let currentDisplayMode = 2;
let currentEffectMode = 'none';

// --- Initialization ---
function init() {
  // Canvas already initialized in config.js
  // Get UI elements
  fontScaleInput = document.getElementById('fontScaleInput');
  fontStyleInput = document.getElementById('fontStyleInput');
  trackingInput = document.getElementById('trackingInput');
  displayModeSelect = document.getElementById('displayModeSelect');
  effectModeSelect = document.getElementById('effectModeSelect');
  transcriptTextarea = document.getElementById('transcriptTextarea');
  timestampTextarea = document.getElementById('timestampTextarea');
  playPauseBtn = document.getElementById('playPauseBtn');
  timeSlider = document.getElementById('timeSlider');
  timeDisplay = document.getElementById('timeDisplay');
  
  // Setup event listeners
  setupEventListeners();
  
  // Initial build
  buildWordStructures();
  
  // Start render loop
  resizeCanvas();
  requestAnimationFrame(mainLoop);
}

// --- Event Listeners ---
function setupEventListeners() {
  // Canvas interactions
  canvas.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('dblclick', handleDoubleClick);
  
  // UI controls
  if (displayModeSelect) {
    displayModeSelect.addEventListener('change', (e) => {
      currentDisplayMode = parseInt(e.target.value, 10);
      setDisplayMode(currentDisplayMode);
    });
  }
  
  if (effectModeSelect) {
    effectModeSelect.addEventListener('change', (e) => {
      currentEffectMode = e.target.value;
      drawFrameAtCurrentTime();
    });
  }
  
  if (transcriptTextarea) {
    transcriptTextarea.addEventListener('input', () => {
      parseTranscript(transcriptTextarea.value);
      if (!isAudioSyncMode) {
        buildWordStructures();
        drawFrameAtCurrentTime();
      }
    });
  }
  
  if (timestampTextarea) {
    timestampTextarea.addEventListener('input', () => {
      parseTimestamps(timestampTextarea.value);
      drawFrameAtCurrentTime();
    });
  }
  
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';
    });
  }
  
  if (timeSlider) {
    timeSlider.addEventListener('input', (e) => {
      currentTime = parseFloat(e.target.value);
      drawFrameAtCurrentTime();
    });
  }
  
  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      selectedWord = null;
      drawFrameAtCurrentTime();
    }
    if (e.key === 'd' || e.key === 'D') {
      isDebugMode = !isDebugMode;
      drawFrameAtCurrentTime();
    }
  });
  
  // Resize
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawFrameAtCurrentTime();
  });
}

// --- Word Structure Building ---
function buildWordStructures() {
  if (isAudioSyncMode) {
    buildWordStructuresFromAudio(activeWordsData);
    return;
  }
  
  const lines = parseTranscript(transcriptTextarea ? transcriptTextarea.value : '');
  const timestamps = parseTimestamps(timestampTextarea ? timestampTextarea.value : '');
  
  words = [];
  let globalWordIndex = 0;
  
  lines.forEach((lineText, lineIndex) => {
    const lineWords = lineText.split(/\s+/).filter(Boolean);
    
    lineWords.forEach((wordText, wordIndexInLine) => {
      // Get timestamp for this word if available
      let startTime = 0;
      let endTime = 1;
      
      if (timestamps.length > globalWordIndex) {
        startTime = timestamps[globalWordIndex].start;
        endTime = timestamps[globalWordIndex].end;
      } else {
        // Fallback: calculate synthetic timing
        const wordsPerLine = 5; // Default assumption
        const lineDuration = 3; // 3 seconds per line
        const wordDuration = lineDuration / lineWords.length;
        startTime = (lineIndex * lineDuration) + (wordIndexInLine * wordDuration);
        endTime = startTime + wordDuration;
      }
      
      words.push({
        id: `word_${globalWordIndex}`,
        text: wordText,
        lineIndex: lineIndex,
        wordIndexInLine: wordIndexInLine,
        x: 100, // Will be calculated during render
        y: 100, // Will be calculated during render
        scale: 1.0,
        scaleX: 1.0,
        scaleY: 1.0,
        rotation: 0,
        startTime: startTime,
        endTime: endTime
      });
      
      globalWordIndex++;
    });
  });
}

function buildWordStructuresFromAudio(audioWords) {
  words = audioWords.map((wordData, index) => ({
    id: `word_${index}`,
    text: wordData.text,
    lineIndex: wordData.lineIndex || 0,
    wordIndexInLine: wordData.wordIndexInLine || index,
    x: 100,
    y: 100,
    scale: 1.0,
    scaleX: 1.0,
    scaleY: 1.0,
    rotation: 0,
    startTime: wordData.startTime || 0,
    endTime: wordData.endTime || 1
  }));
}

// --- Render Loop ---
function mainLoop(timestamp) {
  const dt = (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;
  
  if (isPlaying && !selectedWord) {
    currentTime += dt;
    
    if (timeSlider) {
      timeSlider.value = currentTime.toString();
    }
    if (timeDisplay) {
      timeDisplay.textContent = currentTime.toFixed(2) + 's';
    }
  }
  
  drawFrameAtCurrentTime();
  requestAnimationFrame(mainLoop);
}

// Alias for animate function used by other modules
const animate = mainLoop;

function drawFrameAtCurrentTime() {
  if (!ctx) return;
  
  // Clear canvas
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw debug grid if enabled
  drawDebugGrid();
  
  // Get current line based on time
  const lines = parseTranscript(transcriptTextarea ? transcriptTextarea.value : '');
  const currentLineIndex = getCurrentLineFromTimestamp(currentTime, lines);
  
  // Get visible lines based on display mode
  const visibleLineIndices = getVisibleLines(currentLineIndex, lines.length, currentDisplayMode);
  
  // Calculate layout for visible lines
  const fontSize = getComputedFontSize();
  const padding = 20;
  const lineHeight = fontSize * 1.8;
  const totalHeight = lineHeight * visibleLineIndices.length;
  const startY = (canvas.height / 2) - (totalHeight / 2) + (lineHeight / 2);
  
  // Draw each visible line
  visibleLineIndices.forEach((lineIndex, displayIndex) => {
    const y = startY + (displayIndex * lineHeight);
    drawLine(lineIndex, y, fontSize, padding);
  });
  
  // Draw selected word highlight
  if (selectedWord) {
    drawWordHighlight(selectedWord, currentTime, 0, fontSize);
  }
  
  // Draw marquee if selecting
  drawMarquee();
}

function drawLine(lineIndex, y, fontSize, padding) {
  const lines = parseTranscript(transcriptTextarea ? transcriptTextarea.value : '');
  if (lineIndex >= lines.length) return;
  
  const lineText = lines[lineIndex];
  const lineWords = lineText.split(/\s+/).filter(Boolean);
  
  // Calculate total width for centering
  ctx.font = `${fontSize}px ${fontStyleInput ? fontStyleInput.value : 'Arial'}`;
  const tracking = parseInt(trackingInput ? trackingInput.value : '0', 10);
  
  let totalWidth = 0;
  lineWords.forEach(wordText => {
    totalWidth += ctx.measureText(wordText).width + tracking;
  });
  totalWidth -= tracking; // Remove last tracking
  
  // Center the line
  let currentX = (canvas.width / 2) - (totalWidth / 2);
  
  // Find words for this line
  const lineWordObjects = words.filter(w => w.lineIndex === lineIndex);
  
  lineWordObjects.forEach((wordObj, wordIndex) => {
    // Calculate progress for typewriter effect
    let progress = 1;
    if (currentEffectMode === 'typewriter') {
      progress = getWordProgressFromTimestamp(wordObj.id.split('_')[1], currentTime);
      if (progress === null) {
        // Fallback: use time-based progress
        const wordDuration = wordObj.endTime - wordObj.startTime;
        progress = Math.max(0, Math.min(1, (currentTime - wordObj.startTime) / wordDuration));
      }
    }
    
    // Update word position for layout
    wordObj.x = currentX;
    wordObj.y = y;
    
    // Draw the word with effects
    drawWordWithEffects(
      wordObj.text,
      wordObj.x,
      wordObj.y,
      fontSize,
      wordObj.rotation,
      wordObj.scale,
      currentEffectMode,
      progress
    );
    
    // Advance X position
    currentX += ctx.measureText(wordObj.text).width + tracking;
  });
}

// --- Pointer Interaction Handlers ---
function handlePointerDown(e) {
  const pos = getCanvasCoordinates(e);
  
  // Check if Alt key is held for transform modes
  if (e.altKey && e.ctrlKey) {
    dragMode = 'rotate';
  } else if (e.altKey) {
    dragMode = 'resize';
  } else {
    dragMode = 'move';
  }
  
  // Find word at click position
  const fontSize = getComputedFontSize();
  const clickedWord = findWordAtPosition(pos.x, pos.y, fontSize);
  
  if (clickedWord) {
    selectedWord = clickedWord;
    isDragging = true;
    activePointerId = e.pointerId;
    
    dragStartPos = { x: pos.x, y: pos.y };
    dragStartValues = {
      x: clickedWord.x,
      y: clickedWord.y,
      scale: clickedWord.scale,
      rotation: clickedWord.rotation
    };
    
    canvas.setPointerCapture(e.pointerId);
  } else {
    // Start marquee selection if clicking empty space
    if (!e.altKey && !e.ctrlKey) {
      isMarqueeSelecting = true;
      marqueeStartX = pos.x;
      marqueeStartY = pos.y;
      marqueeCurrentX = pos.x;
      marqueeCurrentY = pos.y;
    }
    selectedWord = null;
  }
  
  drawFrameAtCurrentTime();
}

function handlePointerMove(e) {
  const pos = getCanvasCoordinates(e);
  
  if (isMarqueeSelecting) {
    marqueeCurrentX = pos.x;
    marqueeCurrentY = pos.y;
    drawFrameAtCurrentTime();
    return;
  }
  
  if (!isDragging || !selectedWord || e.pointerId !== activePointerId) return;
  
  const dx = pos.x - dragStartPos.x;
  const dy = pos.y - dragStartPos.y;
  
  if (dragMode === 'move') {
    selectedWord.x = dragStartValues.x + dx;
    selectedWord.y = dragStartValues.y + dy;
  } else if (dragMode === 'resize') {
    // Resize based on drag distance
    const scaleChange = (dx + dy) / 200;
    
    if (e.shiftKey) {
      // Uniform scaling
      selectedWord.scale = Math.max(0.2, Math.min(5, dragStartValues.scale + scaleChange));
    } else {
      // Independent X/Y scaling
      selectedWord.scaleX = Math.max(0.2, Math.min(5, (selectedWord.scaleX || 1) + dx / 200));
      selectedWord.scaleY = Math.max(0.2, Math.min(5, (selectedWord.scaleY || 1) + dy / 200));
    }
  } else if (dragMode === 'rotate') {
    // Calculate rotation angle from center
    const centerX = selectedWord.x + 50; // Approximate center
    const centerY = selectedWord.y - 20; // Approximate center
    
    const startAngle = Math.atan2(dragStartPos.y - centerY, dragStartPos.x - centerX);
    const currentAngle = Math.atan2(pos.y - centerY, pos.x - centerX);
    
    let rotation = dragStartValues.rotation + ((currentAngle - startAngle) * 180 / Math.PI);
    
    // Snap to 15 degrees if shift is held
    if (e.shiftKey) {
      rotation = Math.round(rotation / 15) * 15;
    }
    
    selectedWord.rotation = rotation;
  }
  
  drawFrameAtCurrentTime();
}

function handlePointerUp(e) {
  if (e.pointerId === activePointerId) {
    isDragging = false;
    activePointerId = null;
    dragMode = 'move';
  }
  
  if (isMarqueeSelecting) {
    isMarqueeSelecting = false;
    // Could implement multi-word selection here
  }
  
  drawFrameAtCurrentTime();
}

function handleDoubleClick(e) {
  const pos = getCanvasCoordinates(e);
  const fontSize = getComputedFontSize();
  const clickedWord = findWordAtPosition(pos.x, pos.y, fontSize);
  
  if (clickedWord) {
    // Reset word transforms
    clickedWord.scale = 1.0;
    clickedWord.scaleX = 1.0;
    clickedWord.scaleY = 1.0;
    clickedWord.rotation = 0;
    clickedWord.x = 100; // Reset to layout position
    clickedWord.y = 100;
    
    drawFrameAtCurrentTime();
  }
}

function findWordAtPosition(x, y, fontSize) {
  // Check in reverse order (top to bottom visually)
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    if (isPointInWord(x, y, word, currentTime, 0, fontSize)) {
      return word;
    }
  }
  return null;
}

// --- Audio Sync Functions ---
function enableAudioSync(audioElement, wordData) {
  isAudioSyncMode = true;
  activeWordsData = wordData;
  
  audioElement.addEventListener('timeupdate', () => {
    currentTime = audioElement.currentTime;
    if (!isPlaying) {
      drawFrameAtCurrentTime();
    }
  });
  
  buildWordStructuresFromAudio(activeWordsData);
  drawFrameAtCurrentTime();
}

function disableAudioSync() {
  isAudioSyncMode = false;
  activeWordsData = [];
  buildWordStructures();
  drawFrameAtCurrentTime();
}

// --- Utility Functions ---
function resetAllTransforms() {
  words.forEach(word => {
    word.scale = 1.0;
    word.scaleX = 1.0;
    word.scaleY = 1.0;
    word.rotation = 0;
  });
  drawFrameAtCurrentTime();
}

function exportTransforms() {
  const transforms = words.map(w => ({
    id: w.id,
    text: w.text,
    x: w.x,
    y: w.y,
    scale: w.scale,
    scaleX: w.scaleX,
    scaleY: w.scaleY,
    rotation: w.rotation
  }));
  return JSON.stringify(transforms, null, 2);
}

function importTransforms(jsonString) {
  try {
    const transforms = JSON.parse(jsonString);
    transforms.forEach(t => {
      const word = words.find(w => w.id === t.id);
      if (word) {
        word.x = t.x;
        word.y = t.y;
        word.scale = t.scale;
        word.scaleX = t.scaleX;
        word.scaleY = t.scaleY;
        word.rotation = t.rotation;
      }
    });
    drawFrameAtCurrentTime();
  } catch (e) {
    console.error('Failed to import transforms:', e);
  }
}

// --- Start Application ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for external use
window.canvasApp = {
  enableAudioSync,
  disableAudioSync,
  resetAllTransforms,
  exportTransforms,
  importTransforms,
  setDisplayMode,
  buildWordStructures,
  drawFrameAtCurrentTime
};