/* ==========================================================================
   storage.js — Save/load state (localStorage) & audio file persistence
   (IndexedDB)
   ========================================================================== */

// --- IndexedDB Audio Storage Helpers ---
function openAudioDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DustAudioDB', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('audioFiles')) {
        db.createObjectStore('audioFiles');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Failed to open IndexedDB');
  });
}

async function saveAudioFileToDB(file) {
  try {
    const db = await openAudioDB();
    const tx = db.transaction('audioFiles', 'readwrite');
    const store = tx.objectStore('audioFiles');
    store.put(file, 'saved_audio');
  } catch (err) {
    console.error('Failed to save audio to IndexedDB:', err);
  }
}

async function loadAudioFileFromDB() {
  try {
    const db = await openAudioDB();
    return new Promise((resolve) => {
      const tx = db.transaction('audioFiles', 'readonly');
      const store = tx.objectStore('audioFiles');
      const request = store.get('saved_audio');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error('Failed to load audio from IndexedDB:', err);
    return null;
  }
}

// --- LocalStorage Persistence Helpers ---
function saveState() {
  const state = {
    text: textInput.value,
    fontStyle: fontStyleInput.value,
    fontScale: fontScaleInput.value,
    staggerDelay: staggerInput.value,
    wordLife: wordLifeInput.value,
    fadeOutDelay: fadeOutDelayInput.value,
    letterSpacing: trackingInput.value,
    driftSpeed: driftInput.value,
    textEffect: textEffectInput.value,
    scrubVal: scrubValInput.value,
    scrubUnit: scrubUnitSelect.value,
    isLooping: isLooping,
    autoAlign: autoAlignInput.checked,
    capitalizeText: capitalizeTextInput.checked,
    cinematicConfig: cinematicConfig,
    debugMode: debugModeInput.checked,
    showAltTips: showAltTipsInput.checked,
    centerXOffset: centerXOffsetInput.value,
    layoutMode: layoutModeInput.value,
    activeWordsData: activeWordsData,
    isAudioSyncMode: isAudioSyncMode
  };
  localStorage.setItem('dust_animation_state', JSON.stringify(state));
}

async function loadState() {
  const saved = localStorage.getItem('dust_animation_state');
  if (saved) {
    try {
      const state = JSON.parse(saved);
      if (state.text !== undefined) textInput.value = state.text;
      if (state.fontStyle !== undefined) fontStyleInput.value = state.fontStyle;
      if (state.fontScale !== undefined) fontScaleInput.value = state.fontScale;
      if (state.staggerDelay !== undefined) staggerInput.value = state.staggerDelay;
      if (state.wordLife !== undefined) wordLifeInput.value = state.wordLife;
      if (state.fadeOutDelay !== undefined) fadeOutDelayInput.value = state.fadeOutDelay;
      if (state.letterSpacing !== undefined) trackingInput.value = state.letterSpacing;
      if (state.driftSpeed !== undefined) driftInput.value = state.driftSpeed;
      if (state.isAudioSyncMode !== undefined) isAudioSyncMode = state.isAudioSyncMode;
      if (state.autoAlign !== undefined) autoAlignInput.checked = state.autoAlign;
      if (state.capitalizeText !== undefined) capitalizeTextInput.checked = state.capitalizeText;
      if (state.layoutMode !== undefined) layoutModeInput.value = state.layoutMode;

      if (state.centerXOffset !== undefined) {
        centerXOffsetInput.value = state.centerXOffset;
        centerXOffsetVal.textContent = `${state.centerXOffset}px`;
      }

      if (state.debugMode !== undefined) {
        debugModeInput.checked = state.debugMode;
        isDebugMode = state.debugMode;
      }
      if (state.showAltTips !== undefined) {
        showAltTipsInput.checked = state.showAltTips;
        showAltTips = state.showAltTips;
      }

      if (state.activeWordsData && state.activeWordsData.length > 0) {
        activeWordsData = state.activeWordsData;
        renderTimestampEditorUI();
      }
      if (state.textEffect !== undefined) textEffectInput.value = state.textEffect;
      if (state.scrubVal !== undefined) scrubValInput.value = state.scrubVal;
      if (state.scrubUnit !== undefined) scrubUnitSelect.value = state.scrubUnit;
      if (state.isLooping !== undefined) {
        isLooping = state.isLooping;
        updateLoopButtonUI();
      }
      if (state.cinematicConfig) {
        cinematicConfig = state.cinematicConfig;
        if (state.textEffect === 'cinematic-glitch') {
          textEffectInput.value = 'cinematic-glitch';
          buildCinematicUI(); // Rebuild UI with loaded values
        }
      }

    } catch (e) {
      console.error('Failed to parse saved state from localStorage', e);
    }
  }

  const savedAudioBlob = await loadAudioFileFromDB();
  if (savedAudioBlob) {
    const rawAudioUrl = URL.createObjectURL(savedAudioBlob);
    audioElement.src = rawAudioUrl;
    audioControls.classList.add('active');

    if (activeWordsData && activeWordsData.length > 0) {
      buildWordStructuresFromAudio(activeWordsData);
    }
  }

  renderWordChips();
}
