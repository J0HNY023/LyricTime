/* ==========================================================================
   ui-handlers.js — Event listeners & general UI wiring (sidebar inputs,
   keyboard shortcuts, canvas drag/select/resize interactions)
   ========================================================================== */

// Track Alt / Ctrl keys
document.addEventListener('keydown', (e) => {
  if (e.key === 'Alt') isAltDown = true;
  if (e.key === 'Control') isCtrlDown = true;
});
document.addEventListener('keyup', (e) => {
  if (e.key === 'Alt') isAltDown = false;
  if (e.key === 'Control') isCtrlDown = false;
});

const wordCounter = document.getElementById('wordCounter');

function updateCharCounter() {
  const currentLength = textInput.value.length;
  charCounter.textContent = `${currentLength} / ${MAX_CHARS}`;
  
  // Update word counter
  const words = textInput.value.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  if (wordCounter) {
    wordCounter.textContent = wordCount;
  }

  if (currentLength > MAX_CHARS * 0.9) {
    charCounter.style.color = '#ff7777';
    charLimitWarning.style.display = 'block';
  } else if (currentLength > MAX_CHARS * 0.75) {
    charCounter.style.color = '#ffaa00';
    charLimitWarning.style.display = 'none';
  } else {
    charCounter.style.color = '#8a8a98';
    charLimitWarning.style.display = 'none';
  }
}

// Combined input listener for the text area: cleans line breaks, enforces
// the char limit, and keeps the counter/chips/labels/saved-state in sync.
textInput.addEventListener('input', () => {
  // For single-line input, just ensure no line breaks slip in
  let cleanText = textInput.value.replace(/[\r\n]+/g, '');
  if (textInput.value !== cleanText) {
    textInput.value = cleanText;
  }

  // Enforce character limit
  if (textInput.value.length > MAX_CHARS) {
    textInput.value = textInput.value.slice(0, MAX_CHARS);
  }

  // Update counter and chips
  updateCharCounter();
  renderWordChips();

  // Save state to undo stack
  pushToUndoStack();
  
  // Save state
  updateLabels();
  saveState();
});

// Initial counter update
updateCharCounter();

function updateLabels() {
  fontScaleVal.textContent = `${parseFloat(fontScaleInput.value).toFixed(1)}x`;
  staggerVal.textContent = `${staggerInput.value}s`;
  wordLifeVal.textContent = `${wordLifeInput.value}s`;
  fadeOutDelayVal.textContent = `${fadeOutDelayInput.value}s`;
  trackingVal.textContent = `${trackingInput.value}px`;
  driftVal.textContent = driftInput.value;
}

// Word-gap slider used by all layouts (standard, subtitle, focused-center)
centerXOffsetInput.addEventListener('input', () => {
  centerXOffsetVal.textContent = `${centerXOffsetInput.value}px`;
  saveState();
  
  if (isAudioSyncMode) {
    buildWordStructuresFromAudio(activeWordsData);
  } else {
    buildWordStructures();
  }
  
  drawFrameAtCurrentTime();
});

// 1. LAYOUT-AFFECTING INPUTS (rebuilds the word grid to prevent overlap)
[textInput, fontStyleInput, fontScaleInput, trackingInput].forEach(elem => {
  elem.addEventListener('input', () => {
    updateLabels();
    saveState();

    if (isAudioSyncMode) {
      buildWordStructuresFromAudio(activeWordsData);
    } else {
      buildWordStructures();
    }

    drawFrameAtCurrentTime();

    if (!isAudioSyncMode) {
      startTime = null;
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(animate);
    }
  });
});

// 2. ANIMATION-AFFECTING INPUTS (only redraws, keeps positions)
[staggerInput, wordLifeInput, fadeOutDelayInput, driftInput, textEffectInput].forEach(elem => {
  elem.addEventListener('input', () => {
    updateLabels();
    saveState();
    drawFrameAtCurrentTime();

    if (!isAudioSyncMode) {
      startTime = null;
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(animate);
    }
  });
});

[scrubValInput, scrubUnitSelect].forEach(elem => {
  elem.addEventListener('change', saveState);
  elem.addEventListener('input', saveState);
});

autoAlignInput.addEventListener('change', () => {
  saveState();
  if (isAudioSyncMode) {
    buildWordStructuresFromAudio(activeWordsData);
  } else {
    buildWordStructures();
  }
  drawFrameAtCurrentTime();
});

capitalizeTextInput.addEventListener('change', () => {
  saveState();
  if (isAudioSyncMode) {
    buildWordStructuresFromAudio(activeWordsData);
  } else {
    buildWordStructures();
  }
  drawFrameAtCurrentTime();
});

debugModeInput.addEventListener('change', () => {
  isDebugMode = debugModeInput.checked;
  saveState();
  drawFrameAtCurrentTime();
});

showAltTipsInput.addEventListener('change', () => {
  showAltTips = showAltTipsInput.checked;
  saveState();
  if (!showAltTips) {
    canvasTooltip.style.display = 'none';
  }
});

triggerBtn.addEventListener('click', () => {
  // If audio exists and is loaded, add timestamps with 0.24s spacing
  if (audioElement.src && audioElement.src.length > 0) {
    if (activeWordsData.length === 0) {
      pushToUndoStack();
      
      const words = textInput.value.trim().split(/\s+/).filter(w => w.length > 0);
      const defaultDuration = parseFloat(wordLifeInput.value) || 1.5;
      const spacing = 0.24;
      
      activeWordsData = words.map((word, index) => ({
        word: word,
        start: index * spacing,
        end: (index * spacing) + defaultDuration,
        absX: 0,
        absY: 0,
        offsetX: 0,
        offsetY: 0,
        scale: 1.0,
        rotation: 0
      }));
      
      saveState();
      renderTimestampEditorUI();
      buildWordStructuresFromAudio(activeWordsData);
      isAudioSyncMode = true;
      drawFrameAtCurrentTime();
    } else {
      // Timestamps already exist, do nothing (cancel action)
      console.log('Timestamps already exist. Click again to do nothing.');
    }
    return;
  }
  
  // No audio: Just rebuild word structures without timestamps
  pushToUndoStack();
  isAudioSyncMode = false;
  saveState();
  buildWordStructures();
  drawFrameAtCurrentTime();
});

window.addEventListener('resize', () => {
  resizeCanvas();
  if (!isAudioSyncMode) buildWordStructures();
});

// --- Enhanced Keyboard Controls ---
document.addEventListener('keydown', (e) => {
  // Ctrl + Z for Undo, Ctrl + Y or Ctrl + Shift + Z for Redo
  if (e.ctrlKey && e.code === 'KeyZ') {
    e.preventDefault();
    if (e.shiftKey) {
      redo();
    } else {
      undo();
    }
    return;
  }
  
  if (e.ctrlKey && e.code === 'KeyY') {
    e.preventDefault();
    redo();
    return;
  }

  // Ctrl + S to Save state manually
  if (e.ctrlKey && e.code === 'KeyS') {
    e.preventDefault();
    saveState();
    // Show brief visual feedback
    const saveIndicator = document.createElement('div');
    saveIndicator.textContent = '✓ Saved';
    saveIndicator.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#00e5ff;color:#000;padding:8px 16px;border-radius:4px;font-size:0.75rem;font-weight:600;z-index:99999;animation:fadeout 2s forwards;';
    document.body.appendChild(saveIndicator);
    setTimeout(() => saveIndicator.remove(), 2000);
    return;
  }

  // Delete/Backspace to remove selected words
  if (e.code === 'Delete' || e.code === 'Backspace') {
    const activeEl = document.activeElement;
    const isTextInput = activeEl && (
      activeEl.tagName === 'TEXTAREA' ||
      (activeEl.tagName === 'INPUT' && ['text', 'number', 'password', 'search'].includes(activeEl.type))
    );
    
    if (!isTextInput && selectedWordIndices.length > 0) {
      e.preventDefault();
      pushToUndoStack();
      // Remove selected words from activeWordsData (in reverse order to maintain indices)
      selectedWordIndices.sort((a, b) => b - a).forEach(idx => {
        if (activeWordsData[idx]) {
          activeWordsData.splice(idx, 1);
        }
      });
      selectedWordIndices = [];
      isAllSelected = false;
      saveState();
      renderTimestampEditorUI();
      buildWordStructuresFromAudio(activeWordsData);
      drawFrameAtCurrentTime();
      return;
    }
  }

  // Arrow keys for fine positioning when word(s) selected
  if ((e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') && selectedWordIndices.length > 0) {
    const activeEl = document.activeElement;
    const isTextInput = activeEl && (
      activeEl.tagName === 'TEXTAREA' ||
      (activeEl.tagName === 'INPUT' && ['text', 'number', 'password', 'search'].includes(activeEl.type))
    );
    
    if (!isTextInput) {
      e.preventDefault();
      pushToUndoStack();
      const step = e.shiftKey ? 10 : 1; // Shift for faster movement
      
      selectedWordIndices.forEach(idx => {
        if (wordObjects[idx]) {
          if (e.code === 'ArrowUp') wordObjects[idx].y -= step;
          if (e.code === 'ArrowDown') wordObjects[idx].y += step;
          if (e.code === 'ArrowLeft') wordObjects[idx].x -= step;
          if (e.code === 'ArrowRight') wordObjects[idx].x += step;
          
          // Sync back to data model
          if (wordObjects[idx].dataIndex !== -1 && activeWordsData[wordObjects[idx].dataIndex]) {
            activeWordsData[wordObjects[idx].dataIndex].absX = wordObjects[idx].x;
            activeWordsData[wordObjects[idx].dataIndex].absY = wordObjects[idx].y;
          }
        }
      });
      
      saveState();
      drawFrameAtCurrentTime();
      return;
    }
  }

  // Ctrl + A to Select/Deselect All (works on canvas, not in text inputs)
  if (e.ctrlKey && e.code === 'KeyA') {
    const activeEl = document.activeElement;
    const isTextInput = activeEl && (
      activeEl.tagName === 'TEXTAREA' ||
      (activeEl.tagName === 'INPUT' && ['text', 'number', 'password', 'search'].includes(activeEl.type))
    );

    // Only select all words if NOT focused on a text input
    if (!isTextInput) {
      e.preventDefault();
      isAllSelected = !isAllSelected;

      if (isAllSelected) {
        selectedWordIndices = wordObjects.map((_, i) => i);
        // Also sync with timestamp editor if in audio sync mode
        if (isAudioSyncMode) {
          selectedTimestampIndices = [...selectedWordIndices];
          renderTimestampEditorUI();
        }
      } else {
        selectedWordIndices = [];
        selectedTimestampIndices = [];
        if (isAudioSyncMode) {
          renderTimestampEditorUI();
        }
      }
      drawFrameAtCurrentTime();
      return;
    }
  }

  const activeEl = document.activeElement;
  const isTextInput = activeEl && (
    activeEl.tagName === 'TEXTAREA' ||
    (activeEl.tagName === 'INPUT' && ['text', 'number', 'password', 'search'].includes(activeEl.type))
  );

  if (e.code === 'Space') {
    if (isTextInput) return;
    e.preventDefault();
    if (activeEl && activeEl !== document.body) {
      activeEl.blur();
    }

    if (audioElement.src) {
      if (audioElement.paused) {
        audioElement.play().then(() => {
          playPauseBtn.textContent = '❚❚';
          animationFrame = requestAnimationFrame(animate);
        }).catch(err => {
          if (err.name === 'NotAllowedError') {
            console.warn('Playback requires user interaction. Click the Play button.');
          } else {
            console.error('Play error:', err);
          }
        });
      } else {
        audioElement.pause();
        playPauseBtn.textContent = '▶';
      }
    }
  }

  if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
    if (isTextInput) return;

    if (audioElement.duration) {
      e.preventDefault();
      const step = getScrubStepInSeconds();

      if (e.code === 'ArrowLeft') {
        audioElement.currentTime = Math.max(0, audioElement.currentTime - step);
      } else if (e.code === 'ArrowRight') {
        audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + step);
      }

      timelineSlider.value = (audioElement.currentTime / audioElement.duration) * 100;
      timeDisplay.textContent = `${formatTime(audioElement.currentTime)} / ${formatTime(audioElement.duration)}`;

      if (audioElement.paused) {
        drawFrameAtCurrentTime();
      }
    }
  }
});

/* -----------------------------------------------------------------------
   Interactive Canvas Drag, Resize, Multi-select & Marquee
   ----------------------------------------------------------------------- */

function getWordAtPosition(x, y) {
  const baseFontSize = getComputedFontSize();
  const padding = 10;
  const activeTime = isAudioSyncMode ? audioElement.currentTime : 0;
  const driftSpeed = parseFloat(driftInput.value);

  for (let i = 0; i < wordObjects.length; i++) {
    const obj = wordObjects[i];
    if (isAudioSyncMode) {
      const wordElapsed = activeTime - obj.startTime;
      if (wordElapsed < 0 || wordElapsed > obj.duration) continue;
    }

    const wordScale = obj.scale || 1.0;
    const scaledFontSize = baseFontSize * wordScale;
    const scaledWidth = (obj.baseWidth || obj.width) * wordScale;

    const currentDrift = isAudioSyncMode ? (activeTime - obj.startTime) * driftSpeed * 10 : 0;
    const currentY = obj.y - currentDrift;

    const left = obj.x - padding;
    const right = obj.x + scaledWidth + padding;
    const top = currentY - scaledFontSize - padding;
    const bottom = currentY + padding;

    if (x >= left && x <= right && y >= top && y <= bottom) {
      return i;
    }
  }
  return -1;
}

function getHandleAtPosition(x, y, obj, fontSize, activeTime, driftSpeed) {
  const wordScale = obj.scale || 1.0;
  const scaledFontSize = fontSize * wordScale;
  const scaledWidth = obj.baseWidth * wordScale;

  const currentDrift = isAudioSyncMode ? (activeTime - obj.startTime) * driftSpeed * 10 : 0;
  const currentY = obj.y - currentDrift;

  const padding = 6;
  const boxX = obj.x - padding;
  const boxY = currentY - scaledFontSize;
  const boxW = scaledWidth + padding * 2;
  const boxH = scaledFontSize + padding;

  const handleSize = 10;

  const handles = [
    { name: 'tl', hx: boxX, hy: boxY },
    { name: 'tr', hx: boxX + boxW, hy: boxY },
    { name: 'bl', hx: boxX, hy: boxY + boxH },
    { name: 'br', hx: boxX + boxW, hy: boxY + boxH }
  ];

  for (let h of handles) {
    if (Math.abs(x - h.hx) < handleSize && Math.abs(y - h.hy) < handleSize) {
      return h.name;
    }
  }
  return null;
}

function getGroupBoundingBox(indices) {
  if (indices.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const baseFontSize = getComputedFontSize();
  const activeTime = isAudioSyncMode ? audioElement.currentTime : 0;
  const driftSpeed = parseFloat(driftInput.value);

  indices.forEach(idx => {
    const obj = wordObjects[idx];
    const wordScale = obj.scale || 1.0;
    const scaledFontSize = baseFontSize * wordScale;
    const scaledWidth = (obj.baseWidth || obj.width) * wordScale;
    const currentDrift = (activeTime - obj.startTime) * driftSpeed * 10;
    const currentY = obj.y - currentDrift;

    const padding = 2;
    const boxX = obj.x - padding;
    const boxY = currentY - scaledFontSize - padding;

    minX = Math.min(minX, boxX);
    minY = Math.min(minY, boxY);
    maxX = Math.max(maxX, boxX + scaledWidth + padding * 2);
    maxY = Math.max(maxY, boxY + scaledFontSize + padding * 2);
  });
  return { minX, minY, maxX, maxY };
}

canvas.addEventListener('pointerdown', (e) => {
  const coords = getCanvasCoordinates(e);

  // 1. Marquee Selection (Ctrl + Drag)
  if (e.ctrlKey) {
    e.preventDefault();
    isMarqueeSelecting = true;
    marqueeStartX = coords.x;
    marqueeStartY = coords.y;
    marqueeCurrentX = coords.x;
    marqueeCurrentY = coords.y;
    canvas.setPointerCapture(e.pointerId);
    return;
  }

  // 2. Normal Word Dragging
  const hitIndex = getWordAtPosition(coords.x, coords.y);

  if (hitIndex !== -1 && wordObjects[hitIndex].dataIndex !== -1) {
    draggedWordIndex = hitIndex;
    canvas.setPointerCapture(e.pointerId);
    dragStartX = coords.x;
    dragStartY = coords.y;

    if (selectedWordIndices.includes(hitIndex)) {
      dragStartStates = selectedWordIndices.map(idx => ({
        idx: idx,
        startX: wordObjects[idx].x,
        startY: wordObjects[idx].y,
        startScale: wordObjects[idx].scale || 1.0
      }));
    } else {
      selectedWordIndices = [hitIndex];
      isAllSelected = false;
      dragStartStates = [{
        idx: hitIndex,
        startX: wordObjects[hitIndex].x,
        startY: wordObjects[hitIndex].y,
        startScale: wordObjects[hitIndex].scale || 1.0
      }];
    }

    // Check for rotation mode (Ctrl + Alt), resize mode (Alt only), or drag mode
    if (isCtrlDown && isAltDown) {
      isRotating = true;
      rotateStartX = coords.x;
    } else if (isAltDown) {
      isResizing = true;
      resizeStartX = coords.x;
    } else {
      isDragging = true;
    }
  }
  else if (selectedWordIndices.length > 0) {
    const groupBox = getGroupBoundingBox(selectedWordIndices);
    if (groupBox && coords.x >= groupBox.minX && coords.x <= groupBox.maxX &&
      coords.y >= groupBox.minY && coords.y <= groupBox.maxY) {
      draggedWordIndex = selectedWordIndices[0];
      canvas.setPointerCapture(e.pointerId);
      dragStartX = coords.x;
      dragStartY = coords.y;
      dragStartStates = selectedWordIndices.map(idx => ({
        idx: idx, startX: wordObjects[idx].x, startY: wordObjects[idx].y, startScale: wordObjects[idx].scale || 1.0
      }));
      // Check for rotation mode (Ctrl + Alt), resize mode (Alt only), or drag mode
      if (isCtrlDown && isAltDown) {
        isRotating = true;
        rotateStartX = coords.x;
      } else if (isAltDown) {
        isResizing = true;
        resizeStartX = coords.x;
      } else {
        isDragging = true;
      }
    } else {
      selectedWordIndices = [];
      isAllSelected = false;
      drawFrameAtCurrentTime();
    }
  }
  else {
    selectedWordIndices = [];
    isAllSelected = false;
    drawFrameAtCurrentTime();
  }
  
  // Handle double-click to edit text in focused-center layout
  if (layoutModeInput.value === 'focused-center' && hitIndex !== -1) {
    // Will be handled by dblclick event
  }
});

// Single pointermove listener with O(1) drag updates
canvas.addEventListener('pointermove', (e) => {
  const coords = getCanvasCoordinates(e);

  // --- MARQUEE DRAGGING ---
  if (isMarqueeSelecting) {
    marqueeCurrentX = coords.x;
    marqueeCurrentY = coords.y;
    drawFrameAtCurrentTime();
    return;
  }
  // --- TOOLTIP LOGIC ---
  if ((isAltDown || isCtrlDown) && showAltTips) {
    canvasTooltip.style.display = 'block';
    canvasTooltip.style.left = `${e.clientX}px`;
    canvasTooltip.style.top = `${e.clientY}px`;
    
    if (isAltDown && !isCtrlDown) {
      canvasTooltip.textContent = 'alt+ hover on edges to resize';
    } else if (isCtrlDown) {
      canvasTooltip.textContent = 'ctrl + a to select all | ctrl + drag to marquee select';
    }
  } else {
    canvasTooltip.style.display = 'none';
  }

  // 1. Active drag/resize
  if (draggedWordIndex !== -1 && dragStartStates.length > 0) {
    const dx = coords.x - dragStartX;
    const dy = coords.y - dragStartY;

    if (isResizing) {
      dragStartStates.forEach(state => {
        let newScale = state.startScale + (dx / 100);
        newScale = Math.max(0.5, Math.min(3.0, newScale));

        wordObjects[state.idx].scale = newScale;
        if (wordObjects[state.idx].dataIndex !== -1) {
          activeWordsData[wordObjects[state.idx].dataIndex].scale = newScale;
        }
      });
      drawFrameAtCurrentTime();
      canvas.style.cursor = 'nwse-resize';
      if (isAltDown) canvasTooltip.textContent = 'alt+ hover on edges to resize';
    } else if (isDragging) {
      dragStartStates.forEach(state => {
        let newAbsX = state.startX + dx;
        let newAbsY = state.startY + dy;

        if (autoAlignInput && autoAlignInput.checked) {
          const padding = 10;
          const obj = wordObjects[state.idx];
          const scaledWidth = (obj.baseWidth || obj.width) * (obj.scale || 1);
          const maxX = canvas.width - scaledWidth - padding;
          const maxY = canvas.height - 20;
          newAbsX = Math.max(padding, Math.min(newAbsX, maxX));
          newAbsY = Math.max(40, Math.min(newAbsY, maxY));
        }

        wordObjects[state.idx].x = newAbsX;
        wordObjects[state.idx].y = newAbsY;

        if (wordObjects[state.idx].dataIndex !== -1) {
          activeWordsData[wordObjects[state.idx].dataIndex].absX = newAbsX;
          activeWordsData[wordObjects[state.idx].dataIndex].absY = newAbsY;
        }
      });
      drawFrameAtCurrentTime();
      canvas.style.cursor = 'grabbing';
      if (isAltDown) canvasTooltip.textContent = 'Moving Group...';
    }
    return;
  }
  
  // 1b. Active rotation (Ctrl + Alt + Drag horizontally)
  if (draggedWordIndex !== -1 && isAltDown && e.ctrlKey) {
    const dx = coords.x - dragStartX;
    dragStartStates.forEach(state => {
      let newRotation = (dx * 0.5) % 360; // 0.5 degrees per pixel
      wordObjects[state.idx].rotation = newRotation;
      if (wordObjects[state.idx].dataIndex !== -1) {
        activeWordsData[wordObjects[state.idx].dataIndex].rotation = newRotation;
      }
    });
    drawFrameAtCurrentTime();
    canvasTooltip.textContent = `Rotating: ${Math.round((dx * 0.5) % 360)}°`;
    return;
  }

  // 2. Hover cursor & Tooltip Text
  const hoverIndex = getWordAtPosition(coords.x, coords.y);
  let tooltipText = 'alt+ hover on edges to resize'; // Default text for empty space when Alt is pressed

  if (selectedWordIndices.length > 0) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const baseFontSize = getComputedFontSize();
    const activeTime = isAudioSyncMode ? audioElement.currentTime : 0;
    const driftSpeed = parseFloat(driftInput.value);

    selectedWordIndices.forEach(idx => {
      const obj = wordObjects[idx];
      const wordScale = obj.scale || 1.0;
      const scaledFontSize = baseFontSize * wordScale;
      const scaledWidth = (obj.baseWidth || obj.width) * wordScale;
      const currentDrift = (activeTime - obj.startTime) * driftSpeed * 10;
      const currentY = obj.y - currentDrift;

      const padding = 2;
      const boxX = obj.x - padding;
      const boxY = currentY - scaledFontSize - padding;

      minX = Math.min(minX, boxX);
      minY = Math.min(minY, boxY);
      maxX = Math.max(maxX, boxX + scaledWidth + padding * 2);
      maxY = Math.max(maxY, boxY + scaledFontSize + padding * 2);
    });

    const edgeThreshold = 8;
    const nearLeft = Math.abs(coords.x - minX) < edgeThreshold;
    const nearRight = Math.abs(coords.x - maxX) < edgeThreshold;
    const nearTop = Math.abs(coords.y - minY) < edgeThreshold;
    const nearBottom = Math.abs(coords.y - maxY) < edgeThreshold;
    const insideBox = coords.x >= minX && coords.x <= maxX && coords.y >= minY && coords.y <= maxY;

    if (isAltDown) {
      if ((nearLeft && nearTop) || (nearRight && nearBottom)) {
        canvas.style.cursor = 'nwse-resize';
        tooltipText = 'Resize (Diagonal)';
      } else if ((nearRight && nearTop) || (nearLeft && nearBottom)) {
        canvas.style.cursor = 'nesw-resize';
        tooltipText = 'Resize (Diagonal)';
      } else if (nearLeft || nearRight) {
        canvas.style.cursor = 'ew-resize';
        tooltipText = 'Resize (Horizontal)';
      } else if (nearTop || nearBottom) {
        canvas.style.cursor = 'ns-resize';
        tooltipText = 'Resize (Vertical)';
      } else if (insideBox) {
        canvas.style.cursor = 'grab';
        tooltipText = 'Drag Group';
      } else {
        canvas.style.cursor = 'default';
        tooltipText = 'alt+ hover on edges to resize';
      }
    } else {
      canvas.style.cursor = insideBox ? 'grab' : 'default';
    }
  } else if (hoverIndex !== -1) {
    const obj = wordObjects[hoverIndex];
    const baseFontSize = getComputedFontSize();
    const wordScale = obj.scale || 1.0;
    const scaledFontSize = baseFontSize * wordScale;
    const scaledWidth = (obj.baseWidth || obj.width) * wordScale;

    const activeTime = isAudioSyncMode ? audioElement.currentTime : 0;
    const driftSpeed = parseFloat(driftInput.value);
    const currentDrift = (activeTime - obj.startTime) * driftSpeed * 10;
    const currentY = obj.y - currentDrift;

    const padding = 2;
    const boxX = obj.x - padding;
    const boxY = currentY - scaledFontSize - padding;
    const boxW = scaledWidth + (padding * 2);
    const boxH = scaledFontSize + (padding * 2);

    const edgeThreshold = 8;
    const nearLeft = Math.abs(coords.x - boxX) < edgeThreshold;
    const nearRight = Math.abs(coords.x - (boxX + boxW)) < edgeThreshold;
    const nearTop = Math.abs(coords.y - boxY) < edgeThreshold;
    const nearBottom = Math.abs(coords.y - (boxY + boxH)) < edgeThreshold;

    if (isAltDown) {
      if ((nearLeft && nearTop) || (nearRight && nearBottom) || (nearRight && nearTop) || (nearLeft && nearBottom)) {
        canvas.style.cursor = 'nwse-resize';
        tooltipText = 'Resize (Diagonal)';
      } else if (nearLeft || nearRight) {
        canvas.style.cursor = 'ew-resize';
        tooltipText = 'Resize (Horizontal)';
      } else if (nearTop || nearBottom) {
        canvas.style.cursor = 'ns-resize';
        tooltipText = 'Resize (Vertical)';
      } else {
        canvas.style.cursor = 'grab';
        tooltipText = 'Resize / Drag';
      }
    } else {
      canvas.style.cursor = 'grab';
    }
  } else {
    canvas.style.cursor = 'default';
  }

  // Apply tooltip text if Alt/Ctrl is held
  if ((isAltDown || isCtrlDown) && showAltTips) {
    if (isCtrlDown && !isAltDown) {
      canvasTooltip.textContent = 'Ctrl + Drag to Marquee Select | Ctrl+A to Select All';
    } else if (isAltDown && isCtrlDown) {
      canvasTooltip.textContent = 'Ctrl+Alt+Drag to Rotate';
    } else if (isAltDown) {
      canvasTooltip.textContent = tooltipText;
    }
  } else if (showAltTips && hoverIndex !== -1) {
    // Show default tooltip when hovering over a word without Alt/Ctrl
    canvasTooltip.textContent = 'Resize / Drag';
  }
});

function endDrag(e) {
  // 1. Finalize Marquee Selection
  if (isMarqueeSelecting) {
    canvas.releasePointerCapture(e.pointerId);
    isMarqueeSelecting = false;

    // Only select if dragged more than 5 pixels (avoids accidental clicks)
    const dx = Math.abs(marqueeCurrentX - marqueeStartX);
    const dy = Math.abs(marqueeCurrentY - marqueeStartY);

    if (dx > 5 || dy > 5) {
      const minX = Math.min(marqueeStartX, marqueeCurrentX);
      const maxX = Math.max(marqueeStartX, marqueeCurrentX);
      const minY = Math.min(marqueeStartY, marqueeCurrentY);
      const maxY = Math.max(marqueeStartY, marqueeCurrentY);

      const baseFontSize = getComputedFontSize();
      const activeTime = isAudioSyncMode ? audioElement.currentTime : 0;
      const driftSpeed = parseFloat(driftInput.value);
      const newSelection = [];

      wordObjects.forEach((obj, idx) => {
        const wordScale = obj.scale || 1.0;
        const scaledFontSize = baseFontSize * wordScale;
        const scaledWidth = (obj.baseWidth || obj.width) * wordScale;
        const currentDrift = (activeTime - obj.startTime) * driftSpeed * 10;
        const currentY = obj.y - currentDrift;

        const padding = 2;
        const boxX = obj.x - padding;
        const boxY = currentY - scaledFontSize - padding;
        const boxW = scaledWidth + padding * 2;
        const boxH = scaledFontSize + padding * 2;

        if (boxX < maxX && boxX + boxW > minX &&
          boxY < maxY && boxY + boxH > minY) {
          newSelection.push(idx);
        }
      });

      selectedWordIndices = newSelection;
      isAllSelected = false;
    }

    drawFrameAtCurrentTime();
    return;
  }

  // 2. Normal Drag End
  if (draggedWordIndex !== -1) {
    canvas.releasePointerCapture(e.pointerId);
    draggedWordIndex = -1;
    dragStartStates = [];
    isResizing = false;
    isRotating = false;
    isDragging = false;
    canvas.style.cursor = 'default';

    if (isAudioSyncMode) {
      buildWordStructuresFromAudio(activeWordsData);
    }
    saveState();
  }
}

canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

// --- Canvas Double-Click Inline Editing (works on all layouts including focused-center) ---
canvas.addEventListener('dblclick', (e) => {
  const coords = getCanvasCoordinates(e);
  const hitIndex = getWordAtPosition(coords.x, coords.y);

  if (hitIndex === -1) return;

  const wordObj = wordObjects[hitIndex];
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / canvas.width;
  const scaleY = rect.height / canvas.height;

  const baseFontSize = getComputedFontSize();
  const wordScale = wordObj.scale || 1.0;
  const scaledFontSize = baseFontSize * wordScale;

  ctx.font = `${scaledFontSize}px ${fontStyleInput.value}`;

  const tracking = parseInt(trackingInput.value, 10);
  const scaledTracking = tracking * wordScale;

  const textWidth = ctx.measureText(wordObj.text).width + ((wordObj.text.length - 1) * scaledTracking);

  const driftSpeed = parseFloat(driftInput.value);
  const activeTime = isAudioSyncMode ? audioElement.currentTime : 0;
  const currentDrift = isAudioSyncMode ? (activeTime - wordObj.startTime) * driftSpeed * 10 : 0;
  const visualY = wordObj.y - currentDrift;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = wordObj.text;

  // --- Alignment styles ---
  input.style.position = 'fixed';
  input.style.left = `${rect.left + (wordObj.x * scaleX)}px`;

  const textTopOffset = scaledFontSize * 0.85;
  input.style.top = `${rect.top + ((visualY - textTopOffset) * scaleY)}px`;

  const cursorBuffer = 15 * scaleX;
  input.style.width = `${(textWidth * scaleX) + cursorBuffer}px`;
  input.style.height = `${scaledFontSize * scaleY}px`;

  input.style.font = `${scaledFontSize * scaleY}px ${fontStyleInput.value}`;
  input.style.letterSpacing = `${scaledTracking * scaleX}px`;

  input.style.padding = '0';
  input.style.margin = '0';
  input.style.border = 'none';
  input.style.outline = 'none';
  input.style.boxSizing = 'border-box';
  input.style.lineHeight = '1';
  input.style.textAlign = 'left';

  input.style.color = '#e6e6ea';
  input.style.background = 'rgba(0, 229, 255, 0.2)';
  input.style.borderRadius = '2px';
  input.style.zIndex = '10000';

  document.body.appendChild(input);
  input.focus();
  input.select();

  const commitEdit = () => {
    const newText = input.value.trim();
    document.body.removeChild(input);

    if (!newText) return;

    if (isAudioSyncMode && wordObj.dataIndex !== -1) {
      activeWordsData[wordObj.dataIndex].word = newText;
      saveState();
      buildWordStructuresFromAudio(activeWordsData);
    } else {
      const lines = textInput.value.split('\n');
      const line = lines[wordObj.lineIdx];
      const words = line.match(/\S+/g) || [];

      if (words[wordObj.wordIdx] !== undefined) {
        words[wordObj.wordIdx] = capitalizeTextInput.checked ? newText.toUpperCase() : newText;
        lines[wordObj.lineIdx] = words.join(' ');
        textInput.value = lines.join('\n');
        saveState();
        buildWordStructures();
      }
    }

    drawFrameAtCurrentTime();
    if (!isAudioSyncMode) startAnimation();
  };

  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      input.blur();
    }
  });
  input.addEventListener('blur', commitEdit);
});

// --- Sidebar Manual Resize Logic ---
if (sidebar && sidebarResizer) {
  let isResizingSidebar = false;

  sidebarResizer.addEventListener('pointerdown', (e) => {
    isResizingSidebar = true;
    sidebarResizer.setPointerCapture(e.pointerId);
    sidebarResizer.classList.add('is-dragging');
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  });

  sidebarResizer.addEventListener('pointermove', (e) => {
    if (!isResizingSidebar) return;

    const sidebarRect = sidebar.getBoundingClientRect();
    const newWidth = sidebarRect.right - e.clientX;

    if (newWidth >= 200 && newWidth <= 600) {
      sidebar.style.width = `${newWidth}px`;
      resizeCanvas();
      drawFrameAtCurrentTime();
    }
  });

  const stopSidebarResize = (e) => {
    if (isResizingSidebar) {
      isResizingSidebar = false;
      sidebarResizer.releasePointerCapture(e.pointerId);
      sidebarResizer.classList.remove('is-dragging');
      document.body.style.cursor = 'default';
      localStorage.setItem('dust_sidebar_width', sidebar.style.width);
    }
  };

  sidebarResizer.addEventListener('pointerup', stopSidebarResize);
  sidebarResizer.addEventListener('pointercancel', stopSidebarResize);

  // Restore saved sidebar width on initialization
  const savedWidth = localStorage.getItem('dust_sidebar_width');
  if (savedWidth) {
    sidebar.style.width = savedWidth;
    setTimeout(() => {
      resizeCanvas();
      drawFrameAtCurrentTime();
    }, 50);
  }
}
