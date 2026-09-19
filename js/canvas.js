/* ==========================================================================
   canvas.js — Canvas setup, sizing, coordinate math & low-level drawing
   ========================================================================== */

// --- Tooltip Setup ---
const canvasTooltip = document.createElement('div');
canvasTooltip.id = 'canvasTooltip';
document.body.appendChild(canvasTooltip);

// Hide tooltip when mouse leaves canvas
canvas.addEventListener('mouseleave', () => {
  canvasTooltip.style.display = 'none';
});

// --- Fullscreen Toggle Logic ---
const fullscreenBtn = document.getElementById('fullscreenBtn');
const canvasViewport = document.querySelector('.canvas-viewport');

if (fullscreenBtn && canvasViewport) {
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      canvasViewport.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    setTimeout(() => {
      resizeCanvas();
      if (typeof buildWordStructuresFromAudio === 'function' && typeof buildWordStructures === 'function' && typeof drawFrameAtCurrentTime === 'function') {
        if (isAudioSyncMode) {
          buildWordStructuresFromAudio(activeWordsData);
        } else {
          buildWordStructures();
        }
        drawFrameAtCurrentTime();
      }
    }, 100);
  });
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

function getComputedFontSize() {
  const scale = parseFloat(fontScaleInput.value);
  const baseSize = Math.min(canvas.width * 0.032, 22);
  return baseSize * scale;
}

function getCanvasCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function drawDebugGrid() {
  if (!isDebugMode) return;

  ctx.save();
  const padding = 20;
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(padding, padding, canvas.width - (padding * 2), canvas.height - (padding * 2));

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, canvas.height);
  ctx.moveTo(0, centerY);
  ctx.lineTo(canvas.width, centerY);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  for (let x = 0; x <= canvas.width; x += 50) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  for (let y = 0; y <= canvas.height; y += 50) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '10px monospace';
  ctx.fillText(`W: ${canvas.width}px | H: ${canvas.height}px`, 5, 15);
  ctx.fillText(`Center: (${centerX}, ${centerY})`, centerX + 5, centerY - 5);
  ctx.fillText(`Safe Area: ${padding}px padding`, padding + 5, padding + 15);

  ctx.restore();
}

function drawMarquee() {
  if (!isMarqueeSelecting) return;

  const minX = Math.min(marqueeStartX, marqueeCurrentX);
  const maxX = Math.max(marqueeStartX, marqueeCurrentX);
  const minY = Math.min(marqueeStartY, marqueeCurrentY);
  const maxY = Math.max(marqueeStartY, marqueeCurrentY);
  const width = maxX - minX;
  const height = maxY - minY;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
  ctx.fillRect(minX, minY, width, height);
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(minX, minY, width, height);
  ctx.restore();
}

// --- Bounding Box Render Logic (FIXED) ---
function drawWordHighlight(obj, activeTime, driftSpeed, fontSize) {
  const wordScale = obj.scale || 1.0;
  const scaleX = obj.scaleX || wordScale;
  const scaleY = obj.scaleY || wordScale;
  
  const scaledFontSize = fontSize * wordScale;

  ctx.font = `${scaledFontSize}px ${fontStyleInput.value}`;
  const scaledTracking = parseInt(trackingInput.value, 10) * wordScale;

  // Measure text accurately
  let scaledWidth = 0;
  obj.text.split('').forEach(char => {
    scaledWidth += ctx.measureText(char).width + scaledTracking;
  });
  scaledWidth = Math.max(scaledWidth, 1); // Prevent zero width

  const currentDrift = isAudioSyncMode ? (activeTime - obj.startTime) * driftSpeed * 10 : 0;
  const currentY = obj.y - currentDrift;

  const padding = 3;
  
  // Calculate center of the word for rotation
  const centerX = obj.x + (scaledWidth / 2);
  const centerY = currentY - (scaledFontSize / 2);

  const rotation = obj.rotation || 0;
  const rotationRad = rotation * Math.PI / 180;

  ctx.save();
  
  // Rotate around the CENTER of the word, not baseline-left
  ctx.translate(centerX, centerY);
  ctx.rotate(rotationRad);
  ctx.translate(-centerX, -centerY);

  // Draw bounding box
  const boxX = obj.x - padding;
  const boxY = currentY - scaledFontSize - padding;
  const boxWidth = scaledWidth + (padding * 2);
  const boxHeight = scaledFontSize + (padding * 2);

  ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
  
  // Rotation handle - positioned relative to the box, will rotate with it
  const handleSize = 12;
  const handleCenterX = obj.x + (scaledWidth / 2);
  const handleCenterY = boxY - handleSize - 4;
  
  ctx.fillStyle = '#00e5ff';
  ctx.beginPath();
  ctx.arc(handleCenterX, handleCenterY, handleSize / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Curved arrow for rotation indicator
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(handleCenterX, handleCenterY, handleSize * 0.9, -Math.PI * 0.3, Math.PI * 0.8);
  ctx.stroke();
  
  // Arrowhead
  const arrowAngle = Math.PI * 0.8;
  const arrowX = handleCenterX + Math.cos(arrowAngle) * handleSize * 0.9;
  const arrowY = handleCenterY + Math.sin(arrowAngle) * handleSize * 0.9;
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(arrowX - 3 * Math.cos(arrowAngle - Math.PI / 6), arrowY - 3 * Math.sin(arrowAngle - Math.PI / 6));
  ctx.lineTo(arrowX - 3 * Math.cos(arrowAngle + Math.PI / 6), arrowY - 3 * Math.sin(arrowAngle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = '#00e5ff';
  ctx.fill();
  
  ctx.restore();
}

// --- Hit Testing for Rotated/Scaled Words ---
function isPointInWord(pointX, pointY, obj, activeTime, driftSpeed, fontSize) {
  const wordScale = obj.scale || 1.0;
  const scaledFontSize = fontSize * wordScale;
  
  ctx.font = `${scaledFontSize}px ${fontStyleInput.value}`;
  const scaledTracking = parseInt(trackingInput.value, 10) * wordScale;

  let scaledWidth = 0;
  obj.text.split('').forEach(char => {
    scaledWidth += ctx.measureText(char).width + scaledTracking;
  });

  const currentDrift = isAudioSyncMode ? (activeTime - obj.startTime) * driftSpeed * 10 : 0;
  const currentY = obj.y - currentDrift;

  const centerX = obj.x + (scaledWidth / 2);
  const centerY = currentY - (scaledFontSize / 2);
  const rotation = (obj.rotation || 0) * Math.PI / 180;

  // Transform point to word's local coordinate system
  const dx = pointX - centerX;
  const dy = pointY - centerY;
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  
  const localX = centerX + dx * cos - dy * sin;
  const localY = centerY + dx * sin + dy * cos;

  const padding = 5; // Extra padding for easier clicking
  const boxX = obj.x - padding;
  const boxY = currentY - scaledFontSize - padding;
  const boxWidth = scaledWidth + (padding * 2);
  const boxHeight = scaledFontSize + (padding * 2);

  return (
    localX >= boxX &&
    localX <= boxX + boxWidth &&
    localY >= boxY &&
    localY <= boxY + boxHeight
  );
}

// --- Multi-Line Display Mode Support ---
// Add these to your main.js or canvas.js

let displayMode = 1; // 1, 2, or 3 lines
let transcriptLines = [];
let timestampData = [];

function setDisplayMode(mode) {
  displayMode = Math.max(1, Math.min(3, mode));
  if (typeof buildWordStructures === 'function') {
    buildWordStructures();
    drawFrameAtCurrentTime();
  }
}

function parseTranscript(text) {
  transcriptLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return transcriptLines;
}

function parseTimestamps(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      timestampData = parsed
        .map(item => ({
          word: String(item.word || '').trim(),
          start: Number(item.start) || 0,
          end: Number(item.end) || 0
        }))
        .filter(item => item.word && item.end > item.start)
        .sort((a, b) => a.start - b.start);
      return timestampData;
    }
  } catch (e) {
    console.error('Invalid timestamp JSON:', e);
  }
  timestampData = [];
  return [];
}

// --- Text Effects ---
function applyTextEffect(ctx, word, effect, progress) {
  const effects = {
    none: () => {
      ctx.fillStyle = '#ffffff';
      return { scale: 1, color: '#ffffff' };
    },
    typewriter: () => {
      const charsToShow = Math.ceil(progress * word.length);
      return { 
        text: word.substring(0, charsToShow),
        scale: 1, 
        color: '#ffffff' 
      };
    },
    emphasis: () => {
      const pulse = Math.sin(performance.now() / 200) * 0.1 + 1;
      const hue = (performance.now() / 20) % 360;
      return { 
        scale: pulse, 
        color: `hsl(${hue}, 70%, 60%)` 
      };
    },
    glitch: () => {
      const shouldGlitch = Math.random() > 0.92;
      if (shouldGlitch) {
        const offsetX = (Math.random() - 0.5) * 4;
        const offsetY = (Math.random() - 0.5) * 4;
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        return {
          scale: 1,
          color: `rgb(${r}, ${g}, ${b})`,
          offset: { x: offsetX, y: offsetY }
        };
      }
      return { scale: 1, color: '#ffffff' };
    }
  };

  return (effects[effect] || effects.none)();
}

// --- Draw Word with Effects and Transforms ---
function drawWordWithEffects(word, x, y, fontSize, rotation, scale, effect, progress) {
  const effectResult = applyTextEffect(ctx, word, effect, progress);
  const finalText = effectResult.text || word;
  const finalScale = (scale || 1) * (effectResult.scale || 1);
  const finalColor = effectResult.color || '#ffffff';
  const offset = effectResult.offset || { x: 0, y: 0 };

  ctx.save();
  
  // Apply transforms
  ctx.translate(x + offset.x, y + offset.y);
  if (rotation) {
    ctx.rotate(rotation * Math.PI / 180);
  }
  if (finalScale !== 1) {
    ctx.scale(finalScale, finalScale);
  }

  ctx.fillStyle = finalColor;
  ctx.font = `${fontSize}px ${fontStyleInput.value}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(finalText, 0, 0);
  
  ctx.restore();
}

// --- Helper: Get Visible Lines Based on Display Mode ---
function getVisibleLines(currentLineIndex, totalLines, mode) {
  const lines = [];
  
  if (mode === 1) {
    // Single line mode
    if (currentLineIndex < totalLines) {
      lines.push(currentLineIndex);
    }
  } else if (mode === 2) {
    // Two line mode - show current and next
    if (currentLineIndex < totalLines) {
      lines.push(currentLineIndex);
    }
    if (currentLineIndex + 1 < totalLines) {
      lines.push(currentLineIndex + 1);
    }
  } else if (mode === 3) {
    // Three line mode - show previous, current, next
    if (currentLineIndex > 0) {
      lines.push(currentLineIndex - 1);
    }
    if (currentLineIndex < totalLines) {
      lines.push(currentLineIndex);
    }
    if (currentLineIndex + 1 < totalLines) {
      lines.push(currentLineIndex + 1);
    }
  }
  
  return lines;
}

// --- Timestamp-based Timing ---
function getWordProgressFromTimestamp(wordIndex, currentTime) {
  if (!timestampData || timestampData.length === 0) {
    return null; // Use fallback timing
  }
  
  if (wordIndex >= timestampData.length) {
    return 1; // Word is complete
  }
  
  const ts = timestampData[wordIndex];
  if (currentTime < ts.start) {
    return 0; // Word hasn't started
  }
  if (currentTime >= ts.end) {
    return 1; // Word is complete
  }
  
  return (currentTime - ts.start) / (ts.end - ts.start);
}

function getCurrentLineFromTimestamp(currentTime, lines) {
  if (!timestampData || timestampData.length === 0) {
    return 0;
  }
  
  let wordIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const lineWords = lines[i].split(/\s+/).filter(Boolean);
    const lineEndWordIndex = wordIndex + lineWords.length;
    
    if (lineEndWordIndex > 0 && lineEndWordIndex <= timestampData.length) {
      const lastWordTs = timestampData[lineEndWordIndex - 1];
      if (currentTime <= lastWordTs.end) {
        return i;
      }
    }
    
    wordIndex = lineEndWordIndex;
  }
  
  return lines.length - 1;
}