/* ==========================================================================
   layouts.js — Layout modes (standard, subtitle, focused-center) & word
   structure construction.

   NOTE: The original file also defined `calculateUniformLayout()`, which
   was fully built out but never called from anywhere (not wired to any
   button/listener). It's been dropped here as dead code — remove this
   note and re-add it if you intend to hook it up to something.

   NOTE 2: The original `buildWordStructures()` registered a brand-new
   `centerXOffsetInput` 'input' listener every single time it ran (i.e. on
   every keystroke/slider change that rebuilds the layout), silently
   stacking up duplicate listeners over a session. That one-time listener
   now lives in ui-handlers.js instead.
   ========================================================================== */

function buildWordStructures() {
  wordObjects = [];
  const rawLines = textInput.value.split('\n');
  const fontSize = getComputedFontSize();
  const fontStyle = fontStyleInput.value;
  const tracking = parseInt(trackingInput.value, 10);
  const lineHeight = fontSize * 2.2;
  const staggerDelay = parseFloat(staggerInput.value);
  const defaultDuration = parseFloat(wordLifeInput.value);

  ctx.font = `${fontSize}px ${fontStyle}`;
  const spaceWidth = ctx.measureText(' ').width + tracking;
  let globalWordIndex = 0;

  const padding = 20;
  const maxLineWidth = canvas.width - (padding * 2);
  
  // Start at the center of the canvas for all layout modes
  let currentY = (canvas.height / 2) - (fontSize / 2);
  
  if (layoutModeInput.value === 'subtitle') {
    // Start near the bottom and let the standard wrap logic take over
    currentY = canvas.height - padding - (fontSize * 2);
  }
  
  // For single-line mode, position all words at the center Y (they will be rendered horizontally)
  if (layoutModeInput.value === 'single-line') {
    currentY = (canvas.height / 2) - (fontSize / 2);
  }

  // Add word gap for all layout modes
  const wordGap = parseFloat(centerXOffsetInput.value) || 0;
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
      totalLineWidth += wWidth;
    });
    // Add gaps between words
    if (words.length > 1) {
      totalLineWidth += (words.length - 1) * effectiveSpaceWidth;
    }
    
    // Start X position centered on canvas
    let currentX = (canvas.width / 2) - (totalLineWidth / 2);
    let wordIdx = 0;

    words.forEach((wordText, idx) => {
      let wWidth = 0;
      wordText.split('').forEach(char => {
        wWidth += ctx.measureText(char).width + tracking;
      });

      // WRAP LOGIC: If word exceeds canvas width, move to next line
      if (currentX + wWidth > canvas.width - padding && currentX > padding) {
        // Recalculate centered position for new line
        currentX = (canvas.width / 2) - (totalLineWidth / 2);
        currentY += lineHeight;
      }

      // Prevent bottom overflow by wrapping to top if needed
      if (currentY + fontSize > canvas.height - padding) {
        currentY = padding + fontSize;
        // Recalculate centered position for new line after wrap
        let remainingWords = words.slice(idx);
        let remainingLineWidth = 0;
        remainingWords.forEach(wordText => {
          let wWidth = 0;
          wordText.split('').forEach(char => {
            wWidth += ctx.measureText(char).width + tracking;
          });
          remainingLineWidth += wWidth;
        });
        if (remainingWords.length > 1) {
          remainingLineWidth += (remainingWords.length - 1) * effectiveSpaceWidth;
        }
        currentX = (canvas.width / 2) - (remainingLineWidth / 2);
      }

      const startTimeOffset = globalWordIndex * staggerDelay;
      const particles = [];
      const displayText = getDisplayText(wordText);
      const chars = displayText.split('');
      let charX = currentX;

      chars.forEach(char => {
        const charWidth = ctx.measureText(char).width;
        particles.push(...generateParticles(charWidth, currentX, charX, fontSize, tracking));
        charX += charWidth + tracking;
      });

      wordObjects.push({
        text: displayText,
        x: currentX,
        y: currentY,
        baseX: currentX,
        baseY: currentY,
        width: wWidth,
        baseWidth: wWidth,
        scale: 1.0,
        startTime: startTimeOffset,
        duration: defaultDuration,
        particles: particles,
        dataIndex: -1,
        lineIdx: lineIndex,
        wordIdx: wordIdx,
        animX: currentX,
        animY: currentY,
        targetX: currentX,
        targetY: currentY,
        savedGap: parseFloat(centerXOffsetInput.value) || 0
      });

      // Apply word gap after each word (except the last one on the line)
      if (idx < words.length - 1) {
        currentX += wWidth + effectiveSpaceWidth;
      } else {
        currentX += wWidth; // Last word doesn't need trailing gap
      }
      globalWordIndex++;
      wordIdx++;
    });
    currentY += lineHeight; // Hard line break
  });

  // Clamp all words to safe area after positioning
  const safePadding = 20;
  wordObjects.forEach(word => {
    // Clamp X position
    if (word.x < safePadding) {
      word.x = safePadding;
      word.baseX = safePadding;
      word.animX = safePadding;
      word.targetX = safePadding;
    }
    if (word.x + word.width > canvas.width - safePadding) {
      word.x = canvas.width - safePadding - word.width;
      word.baseX = canvas.width - safePadding - word.width;
      word.animX = canvas.width - safePadding - word.width;
      word.targetX = canvas.width - safePadding - word.width;
    }
    // Clamp Y position
    if (word.y < safePadding + fontSize) {
      word.y = safePadding + fontSize;
      word.baseY = safePadding + fontSize;
      word.animY = safePadding + fontSize;
      word.targetY = safePadding + fontSize;
    }
    if (word.y > canvas.height - safePadding) {
      word.y = canvas.height - safePadding;
      word.baseY = canvas.height - safePadding;
      word.animY = canvas.height - safePadding;
      word.targetY = canvas.height - safePadding;
    }
  });
}

function buildWordStructuresFromAudio(wordsData) {
  activeWordsData = JSON.parse(JSON.stringify(wordsData));
  saveState();
  renderTimestampEditorUI();

  wordObjects = [];
  const fontSize = getComputedFontSize();
  const fontStyle = fontStyleInput.value;
  const tracking = parseInt(trackingInput.value, 10);

  ctx.font = `${fontSize}px ${fontStyle}`;
  const spaceWidth = ctx.measureText(' ').width + tracking;

  const lineHeight = fontSize * 2.2;
  const padding = 20;
  const maxLineWidth = canvas.width - (padding * 2);
  
  // Start at the center of the canvas for all layout modes
  let currentY = (canvas.height / 2) - (fontSize / 2);

  if (layoutModeInput && layoutModeInput.value === 'subtitle') {
    // Start near the bottom and let the standard wrap logic take over
    currentY = canvas.height - padding - (fontSize * 2);
  }
  
  // For single-line mode, position all words at the center Y (they will be rendered horizontally)
  if (layoutModeInput && layoutModeInput.value === 'single-line') {
    currentY = (canvas.height / 2) - (fontSize / 2);
  }

  let globalIdx = 0;
  
  // Calculate total width of all words to center them
  let totalLineWidth = 0;
  wordsData.forEach(wordItem => {
    let wWidth = 0;
    wordItem.word.trim().split('').forEach(char => {
      wWidth += ctx.measureText(char).width + tracking;
    });
    totalLineWidth += wWidth;
  });
  // Add gaps between words
  const wordGap = parseFloat(centerXOffsetInput.value) || 0;
  if (wordsData.length > 1) {
    totalLineWidth += (wordsData.length - 1) * (spaceWidth + wordGap);
  }
  
  // Start X position centered on canvas
  let currentX = (canvas.width / 2) - (totalLineWidth / 2);

  wordsData.forEach((wordItem, idx) => {
    const currentIndex = globalIdx++;
    let wWidth = 0;
    wordItem.word.trim().split('').forEach(char => {
      wWidth += ctx.measureText(char).width + tracking;
    });

    // Add word gap for all layout modes (not just focused-center)
    const effectiveSpaceWidth = spaceWidth + wordGap;

    // WRAP LOGIC
    if (currentX + wWidth > canvas.width - padding && currentX > padding) {
      // Recalculate centered position for new line
      currentX = (canvas.width / 2) - (totalLineWidth / 2);
      currentY += lineHeight;
    }

    // Prevent bottom overflow by wrapping to top
    if (currentY + fontSize > canvas.height - padding) {
      currentY = padding + fontSize;
      // Recalculate centered position for remaining words
      let remainingWords = wordsData.slice(idx);
      let remainingLineWidth = 0;
      remainingWords.forEach(w => {
        let wWidth = 0;
        w.word.trim().split('').forEach(char => {
          wWidth += ctx.measureText(char).width + tracking;
        });
        remainingLineWidth += wWidth;
      });
      if (remainingWords.length > 1) {
        remainingLineWidth += (remainingWords.length - 1) * effectiveSpaceWidth;
      }
      currentX = (canvas.width / 2) - (remainingLineWidth / 2);
    }

    const particles = [];
    const chars = getDisplayText(wordItem.word.trim()).split('');

    const offsetX = wordItem.offsetX || 0;
    const offsetY = wordItem.offsetY || 0;

    // Use saved absolute positions if they exist AND gap hasn't changed, otherwise calculate
    let baseWordX, baseWordY;
    const currentGap = parseFloat(centerXOffsetInput.value) || 0;
    const savedGap = wordItem.savedGap !== undefined ? wordItem.savedGap : 0;
    
    // Only use saved absolute positions if the gap setting hasn't changed since they were saved
    if (wordItem.absX !== undefined && wordItem.absY !== undefined && Math.abs(currentGap - savedGap) < 0.01) {
      baseWordX = wordItem.absX;
      baseWordY = wordItem.absY;
    } else {
      baseWordX = currentX + offsetX;
      baseWordY = currentY + offsetY;
      // Save the current gap value with this word so we know if it changes later
      wordItem.savedGap = currentGap;
    }

    let charX = baseWordX;

    chars.forEach(char => {
      const charWidth = ctx.measureText(char).width;
      particles.push(...generateParticles(charWidth, baseWordX, charX, fontSize, tracking));
      charX += charWidth + tracking;
    });

    const wordDuration = Math.max((wordItem.end - wordItem.start), 1.2);

    wordObjects.push({
      text: getDisplayText(wordItem.word.trim()),
      x: baseWordX,
      y: baseWordY,
      baseX: currentX,
      baseY: currentY,
      width: wWidth,
      baseWidth: wWidth,
      scale: wordItem.scale || 1.0,
      startTime: wordItem.start,
      duration: wordDuration,
      particles: particles,
      dataIndex: currentIndex,
      animX: baseWordX,
      animY: baseWordY,
      targetX: baseWordX,
      targetY: baseWordY,
      rotation: wordItem.rotation || 0,
      savedGap: currentGap
    });

    // Apply word gap after each word (except the last one)
    if (idx < wordsData.length - 1) {
      currentX += wWidth + effectiveSpaceWidth;
    } else {
      currentX += wWidth; // Last word doesn't need trailing gap
    }
  });

  textInput.value = wordsData.map(w => getDisplayText(w.word.trim())).join(' ');
  saveState();

  // Only uncollapse the editor if it was just created (after transcription)
  const editorContainer = document.getElementById('timestampEditorContainer');
  if (editorContainer.classList.contains('hidden')) {
    editorContainer.classList.remove('collapsed');
    document.getElementById('editorToggleBtn').textContent = '▼ Collapse';
  }

  // Shift entire block to bottom for Subtitle layout
  if (layoutModeInput && layoutModeInput.value === 'subtitle') {
    let maxY = 0;
    wordObjects.forEach(w => { if (w.y > maxY) maxY = w.y; });

    let shiftY = (canvas.height - padding) - maxY;
    wordObjects.forEach(w => {
      w.y += shiftY;
      w.baseY += shiftY;
      w.animY += shiftY;
      w.targetY += shiftY;
    });
  }
  // For all layouts, ensure words are clamped to safe area
  const safePadding = 20;
  wordObjects.forEach(word => {
    // Clamp X position
    if (word.x < safePadding) {
      word.x = safePadding;
      word.baseX = safePadding;
      word.animX = safePadding;
      word.targetX = safePadding;
    }
    if (word.x + word.width > canvas.width - safePadding) {
      word.x = canvas.width - safePadding - word.width;
      word.baseX = canvas.width - safePadding - word.width;
      word.animX = canvas.width - safePadding - word.width;
      word.targetX = canvas.width - safePadding - word.width;
    }
    // Clamp Y position
    if (word.y < safePadding + fontSize) {
      word.y = safePadding + fontSize;
      word.baseY = safePadding + fontSize;
      word.animY = safePadding + fontSize;
      word.targetY = safePadding + fontSize;
    }
    if (word.y > canvas.height - safePadding) {
      word.y = canvas.height - safePadding;
      word.baseY = canvas.height - safePadding;
      word.animY = canvas.height - safePadding;
      word.targetY = canvas.height - safePadding;
    }
  });
}

function renderFocusedCenter(elapsed, fontSize, fontStyle, tracking, driftSpeed) {
  if (wordObjects.length === 0) return;

  const activeTime = elapsed;
  let currentWordIndex = -1;

  for (let i = 0; i < wordObjects.length; i++) {
    if (activeTime >= wordObjects[i].startTime && activeTime <= wordObjects[i].startTime + wordObjects[i].duration) {
      currentWordIndex = i; break;
    }
  }
  if (currentWordIndex === -1) return;

  const lineHeight = fontSize * 2.5;
  const centerY = canvas.height / 2;
  const centerX = canvas.width / 2;

  ctx.font = `${fontSize}px ${fontStyle}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const lines = [
    { words: [], y: centerY - lineHeight, opacity: 0.2 },
    { words: [], y: centerY, opacity: 0.5 },
    { words: [], y: centerY + lineHeight, opacity: 1.0 }
  ];

  for (let i = Math.max(0, currentWordIndex - 3); i < currentWordIndex; i++) if (wordObjects[i]) lines[0].words.push(wordObjects[i]);
  for (let i = Math.max(0, currentWordIndex - 1); i < currentWordIndex; i++) if (wordObjects[i]) lines[1].words.push(wordObjects[i]);
  for (let i = currentWordIndex; i < Math.min(wordObjects.length, currentWordIndex + 3); i++) lines[2].words.push(wordObjects[i]);

  lines.forEach((line, lineIdx) => {
    if (line.words.length === 0) return;

    const wordGap = parseFloat(centerXOffsetInput.value) || 0;
    let totalWidth = 0;
    
    // Calculate total width with proper gap handling (no trailing gap on last word)
    line.words.forEach((w, idx) => {
      const wWidth = ctx.measureText(w.text).width;
      totalWidth += wWidth + tracking;
      if (idx < line.words.length - 1) {
        totalWidth += wordGap; // Add gap only between words
      }
    });

    let startX = centerX - (totalWidth / 2);

    line.words.forEach((w, idx) => {
      const wWidth = ctx.measureText(w.text).width;

      // 1. Target position
      w.targetX = startX;
      w.targetY = line.y;

      // 2. Initialize anim positions if they don't exist
      if (w.animX === undefined) { w.animX = w.x; w.animY = w.y; }

      // 3. Smoothly interpolate towards the target
      w.animX = lerp(w.animX, w.targetX, LAYOUT_EASE);
      w.animY = lerp(w.animY, w.targetY, LAYOUT_EASE);

      // 4. Pass the animated position to renderWord
      renderWord(w, elapsed, fontSize, fontStyle, tracking, driftSpeed, w.animX, w.animY, line.opacity);

      // Move startX for next word (with gap only if not last word)
      startX += wWidth + tracking;
      if (idx < line.words.length - 1) {
        startX += wordGap;
      }
    });
  });

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// --- Single-Line Layout Render Function ---
function renderSingleLine(elapsed, fontSize, fontStyle, tracking, driftSpeed) {
  if (wordObjects.length === 0) return;

  const activeTime = elapsed;
  const maxWords = parseInt(maxWordsDisplayInput ? maxWordsDisplayInput.value : 4, 10);
  
  // Find the current word index based on time
  let currentWordIndex = -1;
  for (let i = 0; i < wordObjects.length; i++) {
    if (activeTime >= wordObjects[i].startTime && activeTime <= wordObjects[i].startTime + wordObjects[i].duration) {
      currentWordIndex = i;
      break;
    }
  }
  
  if (currentWordIndex === -1) {
    // No word is currently active, check if we should show the next word fading in
    // or keep showing the last word fading out
    return;
  }

  const lineHeight = fontSize * 2.5;
  const centerY = canvas.height / 2;
  const centerX = canvas.width / 2;

  ctx.font = `${fontSize}px ${fontStyle}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Calculate which words to display (centered around current word)
  const wordsToShow = [];
  const startIdx = Math.max(0, currentWordIndex - Math.floor((maxWords - 1) / 2));
  const endIdx = Math.min(wordObjects.length, startIdx + maxWords);
  
  // Adjust start if we're near the end
  const actualStart = Math.max(0, endIdx - maxWords);
  
  for (let i = actualStart; i < endIdx; i++) {
    wordsToShow.push(wordObjects[i]);
  }

  // Calculate total width to center the line
  const wordGap = parseFloat(centerXOffsetInput.value) || 0;
  let totalWidth = 0;
  
  wordsToShow.forEach((w, idx) => {
    const wWidth = ctx.measureText(w.text).width;
    totalWidth += wWidth + tracking;
    if (idx < wordsToShow.length - 1) {
      totalWidth += wordGap;
    }
  });

  let startX = centerX - (totalWidth / 2);
  const lineY = centerY;

  wordsToShow.forEach((w, idx) => {
    const wWidth = ctx.measureText(w.text).width;

    // Target position for this word
    w.targetX = startX;
    w.targetY = lineY;

    // Initialize anim positions if they don't exist
    if (w.animX === undefined) { w.animX = w.x; w.animY = w.y; }

    // Smoothly interpolate towards the target
    w.animX = lerp(w.animX, w.targetX, LAYOUT_EASE);
    w.animY = lerp(w.animY, w.targetY, LAYOUT_EASE);

    // Calculate opacity based on whether this is the active word
    let opacity = 1.0;
    const wordElapsed = activeTime - w.startTime;
    const fadeInDuration = w.duration * 0.3;
    const fadeOutDelay = parseFloat(fadeOutDelayInput ? fadeOutDelayInput.value : 0);
    
    if (wordElapsed < 0) {
      opacity = 0;
    } else if (wordElapsed <= fadeInDuration) {
      opacity = wordElapsed / fadeInDuration;
    } else if (wordElapsed > fadeInDuration + fadeOutDelay) {
      const fadeOutProgress = (wordElapsed - fadeInDuration - fadeOutDelay) / (w.duration - fadeInDuration - fadeOutDelay);
      opacity = Math.max(1 - fadeOutProgress, 0);
    }

    // Pass the animated position to renderWord
    renderWord(w, elapsed, fontSize, fontStyle, tracking, driftSpeed, w.animX, w.animY, opacity);

    // Move startX for next word
    startX += wWidth + tracking;
    if (idx < wordsToShow.length - 1) {
      startX += wordGap;
    }
  });

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// --- Single-Line Settings Visibility Toggle ---
const singleLineSettings = document.getElementById('singleLineSettings');
const maxWordsDisplayInput = document.getElementById('maxWordsDisplay');
const maxWordsVal = document.getElementById('maxWordsVal');

if (maxWordsDisplayInput && maxWordsVal) {
  maxWordsDisplayInput.addEventListener('input', (e) => {
    maxWordsVal.textContent = e.target.value;
    saveState();
    if (isAudioSyncMode) {
      buildWordStructuresFromAudio(activeWordsData);
    } else {
      buildWordStructures();
    }
    drawFrameAtCurrentTime();
    if (!isAudioSyncMode) startAnimation();
  });
}

// --- Layout Mode Switch ---
layoutModeInput.addEventListener('change', () => {
  saveState();
  
  // Show/hide single-line settings based on mode
  if (singleLineSettings) {
    singleLineSettings.style.display = layoutModeInput.value === 'single-line' ? 'block' : 'none';
  }
  
  // Word Gap setting is now always visible for all layouts (no need to toggle)
  // The centerXOffset slider applies to all layout modes
  if (isAudioSyncMode) {
    buildWordStructuresFromAudio(activeWordsData);
  } else {
    buildWordStructures();
  }
  drawFrameAtCurrentTime();
  if (!isAudioSyncMode) startAnimation();
});
