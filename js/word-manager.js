/* ==========================================================================
   word-manager.js — Word chip UI + timestamp/word data mutation helpers
   (exposed on window since they're invoked from inline onclick/onchange
   attributes rendered by timestamp-editor.js)
   ========================================================================== */

// --- Word Chips Logic ---
function renderWordChips() {
  const text = textInput.value.trim();
  wordChipsContainer.innerHTML = '';

  if (!text) {
    wordChipsContainer.innerHTML = '<span style="font-size:0.7rem; color:#8a8a98;">No words yet. Type in the textarea above.</span>';
    return;
  }

  const words = text.split(/\s+/);
  words.forEach((word, index) => {
    const chip = document.createElement('div');
    chip.style.cssText = `
      display:inline-flex; align-items:center; gap:4px;
      background:#1a1a24; border:1px solid #2a2a3a;
      padding:4px 8px; border-radius:12px; font-size:0.7rem; color:#d0d0da;
    `;

    const wordSpan = document.createElement('span');
    wordSpan.textContent = word;
    wordSpan.style.cursor = 'pointer';
    wordSpan.title = 'Click to edit';
    wordSpan.addEventListener('click', () => {
      const newText = prompt('Edit word:', word);
      if (newText !== null && newText.trim() !== '') {
        const allWords = textInput.value.trim().split(/\s+/);
        allWords[index] = newText.trim();
        textInput.value = allWords.join(' ');
        saveState();
        renderWordChips();
      }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => {
      const allWords = textInput.value.trim().split(/\s+/);
      allWords.splice(index, 1);
      textInput.value = allWords.join(' ');
      saveState();
      renderWordChips();
    });

    chip.appendChild(wordSpan);
    chip.appendChild(deleteBtn);
    wordChipsContainer.appendChild(chip);
  });
}

// Clear All button
clearTextBtn.addEventListener('click', () => {
  if (confirm('Clear all text?')) {
    // 1. Clear the visible textarea
    textInput.value = '';

    // 2. Clear the hidden data arrays
    activeWordsData = [];
    wordObjects = [];

    // 3. Reset sync mode so typing works freely again
    isAudioSyncMode = false;
    saveState();

    // 4. Update UI elements
    updateCharCounter();
    renderWordChips();

    // 5. Hide the timestamp editor if it's open
    const editorContainer = document.getElementById('timestampEditorContainer');
    if (editorContainer) {
      editorContainer.classList.add('hidden');
      editorContainer.innerHTML = '';
    }

    // 6. Clear the canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
});

// NOTE: The original code registered a *second* `textInput` 'input'
// listener here that only called renderWordChips() again — redundant,
// since the main input listener in ui-handlers.js already calls
// renderWordChips() on every keystroke. Removed to avoid doing the work
// twice per keystroke.

// Initial render
renderWordChips();

/* -----------------------------------------------------------------------
   Per-word data mutation (used by the timestamp editor's inline controls)
   ----------------------------------------------------------------------- */

window.updateWordData = function (index, field, value) {
  if (activeWordsData[index]) {
    activeWordsData[index][field] = value;
    saveState();
  }
};

window.updateWordPosition = function (index, axis, value) {
  if (activeWordsData[index]) {
    activeWordsData[index][axis] = isNaN(value) ? 0 : value;
    saveState();
    buildWordStructuresFromAudio(activeWordsData);
    drawFrameAtCurrentTime();
  }
};

window.updateWordAbsolutePosition = function (index, axis, value) {
  if (activeWordsData[index]) {
    activeWordsData[index][axis] = isNaN(value) ? 0 : value;
    saveState();
    buildWordStructuresFromAudio(activeWordsData);
    drawFrameAtCurrentTime();
  }
};

window.resetWordPosition = function (index) {
  if (activeWordsData[index]) {
    delete activeWordsData[index].absX;
    delete activeWordsData[index].absY;
    saveState();
    buildWordStructuresFromAudio(activeWordsData);
    drawFrameAtCurrentTime();
    renderTimestampEditorUI();
  }
};

window.deleteWordData = function (index) {
  activeWordsData.splice(index, 1);
  saveState();
  renderTimestampEditorUI();
  buildWordStructuresFromAudio(activeWordsData);
  drawFrameAtCurrentTime();
};

window.applyTimestampEdits = function () {
  // Sort by start time, don't rebuild positions
  activeWordsData.sort((a, b) => a.start - b.start);
  saveState();

  renderTimestampEditorUI();
  
  // Rebuild word structures to apply any text changes
  buildWordStructuresFromAudio(activeWordsData);
  drawFrameAtCurrentTime();

  if (isAudioSyncMode && !audioElement.paused) {
    animationFrame = requestAnimationFrame(animate);
  }
};

// --- Duplication & Timestamp Offset Logic ---
window.duplicateWordData = function (index) {
  if (!activeWordsData[index]) return;

  const sourceWord = activeWordsData[index];
  const duration = sourceWord.end - sourceWord.start;

  const newStart = sourceWord.end + 0.05;
  const newEnd = newStart + duration;

  const duplicatedItem = {
    word: sourceWord.word,
    start: parseFloat(newStart.toFixed(2)),
    end: parseFloat(newEnd.toFixed(2)),
    offsetX: sourceWord.offsetX || 0,
    offsetY: sourceWord.offsetY || 0
  };

  const timeShift = newEnd - sourceWord.start;

  activeWordsData.splice(index + 1, 0, duplicatedItem);

  for (let i = index + 2; i < activeWordsData.length; i++) {
    activeWordsData[i].start = parseFloat((activeWordsData[i].start + timeShift).toFixed(2));
    activeWordsData[i].end = parseFloat((activeWordsData[i].end + timeShift).toFixed(2));
  }

  saveState();
  renderTimestampEditorUI();
  buildWordStructuresFromAudio(activeWordsData);
  drawFrameAtCurrentTime();
};

window.shiftAllTimestamps = function (direction) {
  const shiftInput = document.getElementById('shiftAmountInput');
  const amount = (parseFloat(shiftInput.value) || 0) * direction;

  if (amount === 0) return;

  activeWordsData.forEach(w => {
    w.start = Math.max(0, parseFloat((w.start + amount).toFixed(2)));
    w.end = Math.max(0.1, parseFloat((w.end + amount).toFixed(2)));
  });

  saveState();
  renderTimestampEditorUI();
  buildWordStructuresFromAudio(activeWordsData);
  drawFrameAtCurrentTime();
  
  // Save the shift amount to localStorage for persistence
  localStorage.setItem('shiftAllAmount', Math.abs(amount).toFixed(2));
};

// --- Reset Layout Logic ---
document.getElementById('resetLayoutBtn').addEventListener('click', () => {
  // 1. Clear all custom positions, offsets, and scales from the data model
  activeWordsData.forEach(w => {
    delete w.absX;
    delete w.absY;
    delete w.scale;
    delete w.offsetX;
    delete w.offsetY;
  });

  // 2. Save the clean state
  saveState();

  // 3. Rebuild the word structures (recalculates the center grid)
  if (isAudioSyncMode) {
    buildWordStructuresFromAudio(activeWordsData);
  } else {
    buildWordStructures();
  }

  // 4. Force a redraw
  drawFrameAtCurrentTime();

  // If in text mode, restart animation to show the reset
  if (!isAudioSyncMode) {
    startTime = null;
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(animate);
  }
});
