/* ==========================================================================
   layouts.js — Simplified layout for minimal sidebar version
   All words are laid out in a simple centered format without user controls
   ========================================================================== */

function buildWordStructures() {
  wordObjects = [];
  const rawLines = wordsData.map(w => getDisplayText(w.word.trim())).join(' ').split('\n');
  const fontSize = getComputedFontSize();
  const tracking = 12; // Fixed tracking
  const lineHeight = fontSize * 2.2;
  const staggerDelay = 0.35; // Fixed stagger
  const defaultDuration = 2.5; // Fixed duration

  ctx.font = `${fontSize}px Georgia, "Times New Roman", serif`;
  const spaceWidth = ctx.measureText(' ').width + tracking;
  let globalWordIndex = 0;

  const padding = 20;
  const maxLineWidth = canvas.width - (padding * 2);
  
  // Start at the center of the canvas
  let currentY = (canvas.height / 2) - (fontSize / 2);
  
  // Fixed word gap
  const wordGap = 0;
  const effectiveSpaceWidth = spaceWidth + wordGap;

  rawLines.forEach((lineText, lineIndex) => {
    const words = lineText.trim().split(/\s+/).filter(w => w.length > 0);
    
    // Calculate total width of all words on this line to center it
    let totalLineWidth = 0;
    words.forEach(wordText => {
      let wWidth = 0;
      wordText.split('').forEach(char => {
        wWidth += ctx.measureText(char).width + tracking;
      });
      totalLineWidth += wWidth + effectiveSpaceWidth;
    });

    // Center the line horizontally
    let currentX = (canvas.width - totalLineWidth) / 2;

    words.forEach(wordText => {
      let wWidth = 0;
      wordText.split('').forEach(char => {
        wWidth += ctx.measureText(char).width + tracking;
      });

      // Wrap if exceeds max width
      if (currentX + wWidth > canvas.width - padding && words.length > 1) {
        currentY += lineHeight;
        currentX = (canvas.width - totalLineWidth) / 2;
      }

      wordObjects.push({
        word: wordText,
        x: currentX,
        y: currentY,
        width: wWidth,
        height: fontSize,
        opacity: 0,
        targetOpacity: 1,
        startTime: globalWordIndex * staggerDelay,
        endTime: globalWordIndex * staggerDelay + defaultDuration,
        duration: defaultDuration,
        originalIndex: globalWordIndex,
        rotation: 0,
        savedRotation: 0,
        savedX: currentX,
        savedY: currentY,
        isCenterLine: false,
        driftOffset: 0,
        scale: 1,
        letterSpacing: tracking,
        wordGap: wordGap
      });

      currentX += wWidth + effectiveSpaceWidth;
      globalWordIndex++;
    });

    currentY += lineHeight;
  });
}

// Build word structures from audio-synced data
function buildWordStructuresFromAudio(audioWords) {
  wordObjects = [];
  const fontSize = getComputedFontSize();
  const tracking = 12;
  const lineHeight = fontSize * 2.2;
  
  ctx.font = `${fontSize}px Georgia, "Times New Roman", serif`;
  const spaceWidth = ctx.measureText(' ').width + tracking;
  const wordGap = 0;
  const effectiveSpaceWidth = spaceWidth + wordGap;
  
  const padding = 20;
  const maxLineWidth = canvas.width - (padding * 2);
  
  let currentY = (canvas.height / 2) - (fontSize / 2);
  let currentX = padding;
  let lineWidth = 0;
  
  audioWords.forEach((wordData, index) => {
    const displayText = getDisplayText(wordData.word.trim());
    if (!displayText) return;
    
    let wWidth = 0;
    displayText.split('').forEach(char => {
      wWidth += ctx.measureText(char).width + tracking;
    });
    
    // Line wrap check
    if (lineWidth + wWidth > maxLineWidth && index > 0) {
      currentY += lineHeight;
      currentX = padding;
      lineWidth = 0;
    }
    
    wordObjects.push({
      word: displayText,
      x: currentX,
      y: currentY,
      width: wWidth,
      height: fontSize,
      opacity: 0,
      targetOpacity: 1,
      startTime: wordData.start || index * 0.5,
      endTime: wordData.end || (index + 1) * 0.5,
      duration: (wordData.end || (index + 1) * 0.5) - (wordData.start || index * 0.5),
      originalIndex: index,
      rotation: 0,
      savedRotation: 0,
      savedX: currentX,
      savedY: currentY,
      isCenterLine: false,
      driftOffset: 0,
      scale: 1,
      letterSpacing: tracking,
      wordGap: wordGap
    });
    
    currentX += wWidth + effectiveSpaceWidth;
    lineWidth += wWidth + effectiveSpaceWidth;
  });
}

// Initialize layout button handlers
function initLayoutButtons() {
  // Process Audio button handler
  processAudioBtn.addEventListener('click', async () => {
    const file = audioUpload.files[0];
    if (!file) {
      alert('Please select an audio file first.');
      return;
    }
    
    const mode = transcriptionModeSelect.value;
    progressOverlay.style.display = 'flex';
    progressTitle.textContent = 'Processing Audio...';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    
    try {
      if (mode === 'whisperx') {
        await processWithWhisperX(file);
      } else {
        await processWithGroq(file);
      }
    } catch (error) {
      console.error('Processing error:', error);
      progressTitle.textContent = 'Error processing audio';
      setTimeout(() => {
        progressOverlay.style.display = 'none';
      }, 2000);
    }
  });
}
