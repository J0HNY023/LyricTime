/* ==========================================================================
   main.js — Core render/animation loop & app bootstrap. Loaded LAST, since
   it ties together canvas.js, layouts.js, text-effects.js and audio.js.

   BUG FIX: in the text (non-audio-sync) branch of animate(), the original
   code called `updateActiveWordHighlight(currentTime)` where `currentTime`
   was never defined in that branch (it only exists inside the audio-sync
   branch) — this threw a silent ReferenceError-safe `undefined` down into
   updateActiveWordHighlight every frame while replaying typed text. It's
   been corrected to pass `elapsed`, the actual local timer for that mode.
   ========================================================================== */

// --- Unified Render Logic ---
function drawFrameAtCurrentTime() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const driftSpeed = parseFloat(driftInput.value);
  const fontSize = getComputedFontSize();
  const fontStyle = fontStyleInput.value;
  const tracking = parseInt(trackingInput.value, 10);
  const activeTime = isAudioSyncMode ? audioElement.currentTime : 0;

  // Handle focused-center effect separately
  if (textEffectInput.value === 'focused-center') {
    renderFocusedCenter(activeTime, fontSize, fontStyle, tracking, driftSpeed);
    drawDebugGrid();
    drawMarquee();
    return;
  }
  
  if (layoutModeInput.value === 'focused-center') {
    renderFocusedCenter(activeTime, fontSize, fontStyle, tracking, driftSpeed);
  } else {
    wordObjects.forEach((wordObj, idx) => {
      renderWord(wordObj, activeTime, fontSize, fontStyle, tracking, driftSpeed);

      // Draw highlight if dragged OR part of the selected group
      if (idx === draggedWordIndex || selectedWordIndices.includes(idx)) {
        drawWordHighlight(wordObj, activeTime, driftSpeed, fontSize);
      }
    });
  }
  
  // Draw selection highlights for focused-center layout too
  if (layoutModeInput.value === 'focused-center' && selectedWordIndices.length > 0) {
    selectedWordIndices.forEach(idx => {
      if (wordObjects[idx]) {
        drawWordHighlight(wordObjects[idx], activeTime, driftSpeed, fontSize);
      }
    });
  }

  drawDebugGrid();
  drawMarquee();
}

function animate(timestamp) {
  if (isAudioSyncMode) {
    const currentTime = audioElement.currentTime;
    const driftSpeed = parseFloat(driftInput.value);
    const fontSize = getComputedFontSize();
    const fontStyle = fontStyleInput.value;
    const tracking = parseInt(trackingInput.value, 10);

    updateActiveWordHighlight(currentTime);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (layoutModeInput.value === 'focused-center') {
      renderFocusedCenter(currentTime, fontSize, fontStyle, tracking, driftSpeed);
    } else {
      wordObjects.forEach(wordObj => {
        renderWord(wordObj, currentTime, fontSize, fontStyle, tracking, driftSpeed);
      });
    }

    drawDebugGrid();
    drawMarquee();

    if (!audioElement.paused && !audioElement.ended) {
      animationFrame = requestAnimationFrame(animate);
    }
  } else {
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000;

    const driftSpeed = parseFloat(driftInput.value);
    const fontSize = getComputedFontSize();
    const fontStyle = fontStyleInput.value;
    const tracking = parseInt(trackingInput.value, 10);

    updateActiveWordHighlight(elapsed);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let isAnyWordActive = false;

    if (layoutModeInput.value === 'focused-center') {
      renderFocusedCenter(elapsed, fontSize, fontStyle, tracking, driftSpeed);
      isAnyWordActive = true; // keep the animation loop running
    } else {
      wordObjects.forEach(wordObj => {
        if (elapsed <= wordObj.startTime + wordObj.duration + 0.5) {
          isAnyWordActive = true;
        }
        renderWord(wordObj, elapsed, fontSize, fontStyle, tracking, driftSpeed);
      });
    }

    drawDebugGrid();
    drawMarquee();

    if (isAnyWordActive) {
      animationFrame = requestAnimationFrame(animate);
    }
  }
}

async function startAnimation() {
  cancelAnimationFrame(animationFrame);
  resizeCanvas();

  if (isAudioSyncMode) {
    audioElement.currentTime = 0;
    try {
      await audioElement.play();
      playPauseBtn.textContent = '❚❚';
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        console.warn('Playback requires user interaction. Click Play to start.');
        playPauseBtn.textContent = '▶';
      } else {
        console.error('Play error:', err);
      }
    }
  } else {
    if (!audioElement.paused) audioElement.pause();
    buildWordStructures();
    startTime = null;
  }

  animationFrame = requestAnimationFrame(animate);
}

// --- Initialization ---
(async function init() {
  await loadState();
  updateLabels();
  
  // Build word structures after loading state (or defaults)
  if (isAudioSyncMode && activeWordsData && activeWordsData.length > 0) {
    buildWordStructuresFromAudio(activeWordsData);
  } else if (!isAudioSyncMode && textInput.value.trim()) {
    buildWordStructures();
  }
  
  setTimeout(startAnimation, 100);
})();
