/* ==========================================================================
   storage.js — Save/load state (localStorage) & audio file persistence
   (IndexedDB)
   ========================================================================== */

/**
 * Validate and sanitize data from localStorage before use
 * @param {any} data - Data to validate
 * @param {string} expectedType - Expected type of the data
 * @returns {any} Sanitized data or default value
 */
function validateLocalStorageData(data, expectedType, defaultValue = null) {
  if (data === null || data === undefined) {
    return defaultValue;
  }
  
  // Type validation
  if (expectedType === 'string') {
    if (typeof data !== 'string') return defaultValue;
    // Sanitize string data using DOMPurify if available
    return typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(data) : data;
  }
  
  if (expectedType === 'number') {
    if (typeof data !== 'number' || isNaN(data)) return defaultValue;
    return data;
  }
  
  if (expectedType === 'boolean') {
    return data === true || data === false ? data : defaultValue;
  }
  
  if (expectedType === 'array') {
    if (!Array.isArray(data)) return defaultValue;
    // Recursively validate array items
    return data.map(item => validateLocalStorageData(item, 'object', null)).filter(i => i !== null);
  }
  
  if (expectedType === 'object') {
    if (typeof data !== 'object' || Array.isArray(data)) return defaultValue;
    return data;
  }
  
  return defaultValue;
}

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
      const parsedState = JSON.parse(saved);
      
      // Validate the state object structure
      if (typeof parsedState !== 'object' || parsedState === null || Array.isArray(parsedState)) {
        console.warn('Invalid state structure from localStorage, resetting to defaults');
        return;
      }
      
      const state = parsedState;
      
      // Validate and sanitize string fields before use
      if (state.text !== undefined) {
        textInput.value = validateLocalStorageData(state.text, 'string', '');
      }
      if (state.fontStyle !== undefined) fontStyleInput.value = validateLocalStorageData(state.fontStyle, 'string', fontStyleInput.value);
      if (state.fontScale !== undefined) fontScaleInput.value = validateLocalStorageData(state.fontScale, 'string', fontScaleInput.value);
      if (state.staggerDelay !== undefined) staggerInput.value = validateLocalStorageData(state.staggerDelay, 'string', staggerInput.value);
      if (state.wordLife !== undefined) wordLifeInput.value = validateLocalStorageData(state.wordLife, 'string', wordLifeInput.value);
      if (state.fadeOutDelay !== undefined) fadeOutDelayInput.value = validateLocalStorageData(state.fadeOutDelay, 'string', fadeOutDelayInput.value);
      if (state.letterSpacing !== undefined) trackingInput.value = validateLocalStorageData(state.letterSpacing, 'string', trackingInput.value);
      if (state.driftSpeed !== undefined) driftInput.value = validateLocalStorageData(state.driftSpeed, 'string', driftInput.value);
      if (state.layoutMode !== undefined) layoutModeInput.value = validateLocalStorageData(state.layoutMode, 'string', layoutModeInput.value);
      if (state.textEffect !== undefined) textEffectInput.value = validateLocalStorageData(state.textEffect, 'string', textEffectInput.value);
      if (state.scrubVal !== undefined) scrubValInput.value = validateLocalStorageData(state.scrubVal, 'string', scrubValInput.value);
      if (state.scrubUnit !== undefined) scrubUnitSelect.value = validateLocalStorageData(state.scrubUnit, 'string', scrubUnitSelect.value);
      if (state.centerXOffset !== undefined) {
        centerXOffsetInput.value = validateLocalStorageData(state.centerXOffset, 'string', '0');
        centerXOffsetVal.textContent = `${centerXOffsetInput.value}px`;
      }
      
      // Validate boolean fields
      if (state.isAudioSyncMode !== undefined) isAudioSyncMode = validateLocalStorageData(state.isAudioSyncMode, 'boolean', false);
      if (state.autoAlign !== undefined) autoAlignInput.checked = validateLocalStorageData(state.autoAlign, 'boolean', false);
      if (state.capitalizeText !== undefined) capitalizeTextInput.checked = validateLocalStorageData(state.capitalizeText, 'boolean', false);
      if (state.debugMode !== undefined) {
        debugModeInput.checked = validateLocalStorageData(state.debugMode, 'boolean', false);
        isDebugMode = validateLocalStorageData(state.debugMode, 'boolean', false);
      }
      if (state.showAltTips !== undefined) {
        showAltTipsInput.checked = validateLocalStorageData(state.showAltTips, 'boolean', true);
        showAltTips = validateLocalStorageData(state.showAltTips, 'boolean', true);
      }
      if (state.isLooping !== undefined) {
        isLooping = validateLocalStorageData(state.isLooping, 'boolean', false);
        updateLoopButtonUI();
      }
      
      // Validate array data (activeWordsData)
      if (state.activeWordsData && Array.isArray(state.activeWordsData)) {
        activeWordsData = state.activeWordsData.filter(item => 
          item && typeof item === 'object' && 
          typeof item.word === 'string' && 
          typeof item.start === 'number' && 
          typeof item.end === 'number'
        );
        if (activeWordsData.length > 0) {
          renderTimestampEditorUI();
        }
      }
      
      // Validate cinematic config object
      if (state.cinematicConfig && typeof state.cinematicConfig === 'object' && !Array.isArray(state.cinematicConfig)) {
        cinematicConfig = state.cinematicConfig;
        if (state.textEffect === 'cinematic-glitch') {
          textEffectInput.value = 'cinematic-glitch';
          buildCinematicUI();
        } else {
          const existingPanel = document.querySelector('.cinematic-config-panel');
          if (existingPanel) {
            existingPanel.style.display = 'none';
          }
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
