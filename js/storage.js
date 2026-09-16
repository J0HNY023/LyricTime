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
  // Save sidebar scroll position
  const sidebarContent = document.querySelector('.sidebar-content');
  const sidebarScrollTop = sidebarContent ? sidebarContent.scrollTop : 0;
  localStorage.setItem('sidebar_scroll_position', sidebarScrollTop.toString());
  
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

// Restore sidebar scroll position
function restoreSidebarScrollPosition() {
  const savedScroll = localStorage.getItem('sidebar_scroll_position');
  if (savedScroll !== null) {
    const sidebarContent = document.querySelector('.sidebar-content');
    if (sidebarContent) {
      sidebarContent.scrollTop = parseInt(savedScroll, 10);
    }
  }
}

// Apply default values from data-default attributes to all inputs
function applyDefaultValues() {
  const sliders = document.querySelectorAll('input[type="range"][data-default]');
  sliders.forEach(slider => {
    const defaultValue = slider.getAttribute('data-default');
    if (defaultValue !== null) {
      slider.value = defaultValue;
    }
  });
  
  // Reset select dropdowns to their defaults
  const layoutModeSelect = document.getElementById('layoutMode');
  if (layoutModeSelect) {
    layoutModeSelect.value = 'standard';
  }

  const fontStyleSelect = document.getElementById('fontStyle');
  if (fontStyleSelect) {
    fontStyleSelect.selectedIndex = 0;
  }

  const textEffectSelect = document.getElementById('textEffect');
  if (textEffectSelect) {
    textEffectSelect.value = 'none';
  }

  // Reset checkboxes to unchecked state
  const autoAlignCheckbox = document.getElementById('autoAlign');
  if (autoAlignCheckbox) {
    autoAlignCheckbox.checked = false;
  }

  const capitalizeTextCheckbox = document.getElementById('capitalizeText');
  if (capitalizeTextCheckbox) {
    capitalizeTextCheckbox.checked = false;
  }

  const debugModeCheckbox = document.getElementById('debugMode');
  if (debugModeCheckbox) {
    debugModeCheckbox.checked = false;
  }
  
  const showAltTipsCheckbox = document.getElementById('showAltTips');
  if (showAltTipsCheckbox) {
    showAltTipsCheckbox.checked = true;
    showAltTips = true;
  }
}

async function loadState() {
  const saved = localStorage.getItem('dust_animation_state');
  
  // If no saved state exists, apply default values first
  if (!saved) {
    applyDefaultValues();
  }
  
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
        // Only rebuild UI if cinematic-glitch is the selected effect
        if (state.textEffect === 'cinematic-glitch') {
          textEffectInput.value = 'cinematic-glitch';
          buildCinematicUI();
        } else {
          // Hide cinematic settings panel if not selected
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
  
  // Restore sidebar scroll position after all content is loaded
  setTimeout(restoreSidebarScrollPosition, 150);
}
