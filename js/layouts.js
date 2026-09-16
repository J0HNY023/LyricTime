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

/**
 * Balances a line of words into multiple sub-lines for better readability.
 * Instead of letting lines run too long, this function breaks them into
 * visually balanced segments that avoid orphans and maintain good proportions.
 * 
 * @param {string[]} words - Array of words to balance
 * @param {number} maxLineWidth - Maximum width in pixels
 * @param {number} tracking - Letter spacing
 * @param {number} spaceWidth - Width of space between words
 * @returns {string[][]} Array of word arrays, each representing a balanced line
 */
function balanceLineForReadability(words, maxLineWidth, tracking, spaceWidth) {
  if (words.length === 0) return [];
  
  // Target line length: aim for 60-75% of max width for optimal readability
  const targetLineWidth = maxLineWidth * 0.7;
  const minLineWidth = maxLineWidth * 0.4; // Don't break unless we exceed this
  
  // Calculate approximate width of all words
  let totalWidth = 0;
  const wordWidths = words.map(word => {
    let w = 0;
    ctx.font || (ctx.font = '16px Inter'); // Ensure font is set
    word.split('').forEach(char => {
      w += ctx.measureText(char).width + tracking;
    });
    return w;
  });
  
  wordWidths.forEach((w, i) => {
    totalWidth += w;
    if (i < words.length - 1) totalWidth += spaceWidth;
  });
  
  // If the line fits comfortably, no need to break it
  if (totalWidth <= targetLineWidth) {
    return [words];
  }
  
  // Break into multiple balanced lines
  const lines = [];
  let currentLine = [];
  let currentWidth = 0;
  
  for (let i = 0; i < words.length; i++) {
    const wordWidth = wordWidths[i];
    const newWidth = currentWidth + wordWidth + (currentLine.length > 0 ? spaceWidth : 0);
    
    // If adding this word would exceed target and we have words already
    if (newWidth > targetLineWidth && currentLine.length > 0) {
      // Check if current line is reasonably long (avoid very short lines)
      if (currentWidth >= minLineWidth) {
        lines.push(currentLine);
        currentLine = [words[i]];
        currentWidth = wordWidth;
      } else {
        // Current line is too short, try to add more words even if slightly over target
        currentLine.push(words[i]);
        currentWidth = newWidth;
      }
    } else {
      currentLine.push(words[i]);
      currentWidth = newWidth;
    }
  }
  
  // Handle remaining words
  if (currentLine.length > 0) {
    // If last line is very short and previous line exists, try to merge
    if (lines.length > 0 && currentWidth < minLineWidth) {
      const prevLine = lines[lines.length - 1];
      const combinedWidth = currentWidth + spaceWidth + wordWidths[wordWidths.length - prevLine.length - 1];
      
      // If moving last word from prev line makes both lines more balanced, do it
      if (combinedWidth <= targetLineWidth * 1.3) {
        // Keep as separate lines but accept the short line
        lines.push(currentLine);
      } else {
        lines.push(currentLine);
      }
    } else {
      lines.push(currentLine);
    }
  }
  
  return lines;
}

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

  // Add word gap for all layout modes
  const wordGap = parseFloat(centerXOffsetInput.value) || 0;
  const effectiveSpaceWidth = spaceWidth + wordGap;

  rawLines.forEach((lineText, lineIndex) => {
    const words = lineText.trim().split(/\s+/).filter(w => w.length > 0);
    
    // IMPROVED LINE BALANCING: Instead of using hard newlines only,
    // we break long lines into multiple balanced sub-lines for better readability
    const subLines = balanceLineForReadability(words, maxLineWidth, tracking, effectiveSpaceWidth);
    
    subLines.forEach((subLineWords, subIndex) => {
      if (subLineWords.length === 0) return;
      
      // Calculate total width of words in this sub-line to center it
      let totalSubLineWidth = 0;
      subLineWords.forEach(wordText => {
        let wWidth = 0;
        wordText.split('').forEach(char => {
          wWidth += ctx.measureText(char).width + tracking;
        });
        totalSubLineWidth += wWidth;
      });
      // Add gaps between words
      if (subLineWords.length > 1) {
        totalSubLineWidth += (subLineWords.length - 1) * effectiveSpaceWidth;
      }
      
      // Start X position centered on canvas
      let currentX = (canvas.width / 2) - (totalSubLineWidth / 2);
      let wordIdx = 0;

      subLineWords.forEach((wordText, idx) => {
        let wWidth = 0;
        wordText.split('').forEach(char => {
          wWidth += ctx.measureText(char).width + tracking;
        });

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
        if (idx < subLineWords.length - 1) {
          currentX += wWidth + effectiveSpaceWidth;
        } else {
          currentX += wWidth; // Last word doesn't need trailing gap
        }
        globalWordIndex++;
        wordIdx++;
      });
      
      // Move to next sub-line (with slightly reduced spacing for visual grouping)
      if (subIndex < subLines.length - 1) {
        currentY += lineHeight * 0.9;
      }
    });
    
    // After all sub-lines, add normal line spacing
    currentY += lineHeight;
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

// --- Layout Mode Switch ---
layoutModeInput.addEventListener('change', () => {
  saveState();
  
  
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
