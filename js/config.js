/* ==========================================================================
   config.js — Constants, configuration & DOM element references
   Loaded FIRST. Every other script relies on the globals declared here.
   ========================================================================== */

// --- Scrub Input References ---
const scrubValInput = document.getElementById('scrubValInput');
const scrubUnitSelect = document.getElementById('scrubUnitSelect');
const loopBtn = document.getElementById('loopBtn');

// --- Canvas ---
const canvas = document.getElementById('animCanvas');
const ctx = canvas.getContext('2d');

// --- Progress Overlay ---
const progressOverlay = document.getElementById('progressOverlay');
const progressTitle = document.getElementById('progressTitle');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

// --- Audio Player Controls ---
const audioControls = document.getElementById('audioControls');
const playPauseBtn = document.getElementById('playPauseBtn');
const timelineSlider = document.getElementById('timelineSlider');
const timeDisplay = document.getElementById('timeDisplay');
const debugModeInput = document.getElementById('debugMode');

// --- Undo/Redo Buttons ---
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

// --- Skip Back/Forward Buttons ---
const skipBackBtn = document.getElementById('skipBackBtn');
const skipForwardBtn = document.getElementById('skipForwardBtn');

// --- Audio Upload ---
const audioUpload = document.getElementById('audioUpload');
const processAudioBtn = document.getElementById('processAudioBtn');
const transcriptionModeSelect = document.getElementById('transcriptionMode');

// NOTE: There is a "Words Per Line" slider in the HTML (#focusedWordsPerLine)
// but nothing in the codebase reads its value during layout — it currently
// has no effect. Left as-is since wiring it up would change behavior;
// flagging here so it's not mistaken for dead code you forgot to remove.

// --- Animation Constants ---
// Smooth easing factor (0.0–1.0, lower = smoother/slower)
const LAYOUT_EASE = 0.12;

// --- Cache for computed values ---
const cache = {
  fontSize: null,
  lastFontSizeTime: 0,
  CACHE_DURATION: 100 // ms to cache computed values
};

/**
 * Get cached computed font size to avoid repeated calculations
 * @returns {number} Computed font size in pixels
 */
function getCachedFontSize() {
  const now = performance.now();
  if (cache.fontSize !== null && (now - cache.lastFontSizeTime) < cache.CACHE_DURATION) {
    return cache.fontSize;
  }
  
  // Compute new value - fixed scale factor of 1.0
  const baseSize = Math.min(canvas.width * 0.032, 22);
  cache.fontSize = baseSize;
  cache.lastFontSizeTime = now;
  return cache.fontSize;
}

/**
 * Clear the computed value cache (call when relevant inputs change)
 */
function clearCache() {
  cache.fontSize = null;
}
