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
  let currentY = padding + fontSize;

  if (layoutModeInput.value === 'subtitle') {
    // Start near the bottom and let the standard wrap logic take over
    currentY = canvas.height - padding - (fontSize * 2);
  }

  rawLines.forEach((lineText, lineIndex) => {
    const words = lineText.trim().split(/\s+/).filter(w => w.length > 0);
    let currentX = padding;
    let wordIdx = 0;

    words.forEach((wordText) => {
      let wWidth = 0;
      wordText.split('').forEach(char => {
        wWidth += ctx.measureText(char).width + tracking;
      });

      // WRAP LOGIC: If word exceeds canvas width, move to next line
      if (currentX + wWidth > maxLineWidth && currentX > padding) {
        currentX = padding;
        currentY += lineHeight;
      }

      // Prevent bottom overflow
      if (currentY > canvas.height - padding) return;

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
        targetY: currentY
      });

      currentX += wWidth + spaceWidth;
      globalWordIndex++;
      wordIdx++;
    });
    currentY += lineHeight; // Hard line break
  });

  // Apply auto-alignment clamping after building
  wordObjects.forEach(wordObj => clampWordToBounds(wordObj));

  // Shift entire block to bottom for Subtitle layout
  if (layoutModeInput && layoutModeInput.value === 'subtitle') {
    let maxY = 0;
    wordObjects.forEach(w => { if (w.y > maxY) maxY = w.y; });

    let shiftY = (canvas.height - padding) - maxY;
    wordObjects.forEach(w => {
      w.y += shiftY;
      w.baseY += shiftY;
    });
  }
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
  let currentY = padding + fontSize;

  let globalIdx = 0;
  let currentX = padding;

  wordsData.forEach((wordItem) => {
    const currentIndex = globalIdx++;
    let wWidth = 0;
    wordItem.word.trim().split('').forEach(char => {
      wWidth += ctx.measureText(char).width + tracking;
    });

    // Add word gap for focused-center layout mode
    const wordGap = (layoutModeInput && layoutModeInput.value === 'focused-center') ? (parseFloat(centerXOffsetInput.value) || 0) : 0;
    const effectiveSpaceWidth = spaceWidth + wordGap;

    // WRAP LOGIC
    if (currentX + wWidth > maxLineWidth && currentX > padding) {
      currentX = padding;
      currentY += lineHeight;
    }

    // Prevent bottom overflow
    if (currentY > canvas.height - padding) return;

    const particles = [];
    const chars = getDisplayText(wordItem.word.trim()).split('');

    const offsetX = wordItem.offsetX || 0;
    const offsetY = wordItem.offsetY || 0;

    // Use saved absolute positions if they exist, otherwise calculate
    let baseWordX, baseWordY;
    if (wordItem.absX !== undefined && wordItem.absY !== undefined) {
      baseWordX = wordItem.absX;
      baseWordY = wordItem.absY;
    } else {
      baseWordX = currentX + offsetX;
      baseWordY = currentY + offsetY;
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
      rotation: wordItem.rotation || 0
    });

    currentX += wWidth + effectiveSpaceWidth;
  });

  textInput.value = wordsData.map(w => getDisplayText(w.word.trim())).join(' ');
  saveState();

  // Only uncollapse the editor if it was just created (after transcription)
  const editorContainer = document.getElementById('timestampEditorContainer');
  if (editorContainer.classList.contains('hidden')) {
    editorContainer.classList.remove('collapsed');
    document.getElementById('editorToggleBtn').textContent = '▼ Collapse';
  }

  wordObjects.forEach(wordObj => clampWordToBounds(wordObj));

  // Shift entire block to bottom for Subtitle layout
  if (layoutModeInput && layoutModeInput.value === 'subtitle') {
    let maxY = 0;
    wordObjects.forEach(w => { if (w.y > maxY) maxY = w.y; });

    let shiftY = (canvas.height - padding) - maxY;
    wordObjects.forEach(w => {
      w.y += shiftY;
      w.baseY += shiftY;
    });
  }
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

  lines.forEach(line => {
    if (line.words.length === 0) return;

    const wordGap = parseFloat(centerXOffsetInput.value) || 0;
    let totalWidth = 0;
    line.words.forEach(w => totalWidth += ctx.measureText(w.text).width + tracking + wordGap);

    let startX = centerX - (totalWidth / 2);

    line.words.forEach((w) => {
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

      startX += wWidth + tracking + wordGap;
    });
  });

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// --- Layout Mode Switch ---
layoutModeInput.addEventListener('change', () => {
  saveState();
  if (isAudioSyncMode) {
    buildWordStructuresFromAudio(activeWordsData);
  } else {
    buildWordStructures();
  }
  drawFrameAtCurrentTime();
  if (!isAudioSyncMode) startAnimation();
});
