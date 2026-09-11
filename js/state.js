/* ==========================================================================
   state.js — Global mutable state
   ========================================================================== */

let showAltTips = true;

let isDebugMode = false;
let isLooping = false;

let animationFrame;
let wordObjects = [];
let activeWordsData = [];
let startTime = null;
let recognition = null;
let isListening = false;
let isAudioSyncMode = false;
let isSeeking = false;
let audioElement = new Audio();

// --- Undo/Redo History ---
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 50;

function pushToUndoStack() {
  const stateSnapshot = {
    textInput: textInput.value,
    activeWordsData: JSON.parse(JSON.stringify(activeWordsData)),
    layoutMode: layoutModeInput.value,
    fontScale: fontScaleInput.value,
    fontStyle: fontStyleInput.value,
    tracking: trackingInput.value,
    centerXOffset: centerXOffsetInput.value,
    staggerDelay: staggerInput.value,
    wordLife: wordLifeInput.value,
    fadeOutDelay: fadeOutDelayInput.value,
    driftSpeed: driftInput.value,
    textEffect: textEffectInput.value
  };
  
  undoStack.push(stateSnapshot);
  if (undoStack.length > MAX_HISTORY) {
    undoStack.shift();
  }
  // Clear redo stack when new action is performed
  redoStack = [];
}

function undo() {
  if (undoStack.length === 0) return;
  
  // Push current state to redo stack
  const currentState = {
    textInput: textInput.value,
    activeWordsData: JSON.parse(JSON.stringify(activeWordsData)),
    layoutMode: layoutModeInput.value,
    fontScale: fontScaleInput.value,
    fontStyle: fontStyleInput.value,
    tracking: trackingInput.value,
    centerXOffset: centerXOffsetInput.value,
    staggerDelay: staggerInput.value,
    wordLife: wordLifeInput.value,
    fadeOutDelay: fadeOutDelayInput.value,
    driftSpeed: driftInput.value,
    textEffect: textEffectInput.value
  };
  redoStack.push(currentState);
  
  // Restore previous state
  const prevState = undoStack.pop();
  restoreStateFromSnapshot(prevState);
}

function redo() {
  if (redoStack.length === 0) return;
  
  // Push current state to undo stack
  const currentState = {
    textInput: textInput.value,
    activeWordsData: JSON.parse(JSON.stringify(activeWordsData)),
    layoutMode: layoutModeInput.value,
    fontScale: fontScaleInput.value,
    fontStyle: fontStyleInput.value,
    tracking: trackingInput.value,
    centerXOffset: centerXOffsetInput.value,
    staggerDelay: staggerInput.value,
    wordLife: wordLifeInput.value,
    fadeOutDelay: fadeOutDelayInput.value,
    driftSpeed: driftInput.value,
    textEffect: textEffectInput.value
  };
  undoStack.push(currentState);
  
  // Restore next state
  const nextState = redoStack.pop();
  restoreStateFromSnapshot(nextState);
}

function restoreStateFromSnapshot(snapshot) {
  textInput.value = snapshot.textInput;
  activeWordsData = JSON.parse(JSON.stringify(snapshot.activeWordsData));
  layoutModeInput.value = snapshot.layoutMode;
  fontScaleInput.value = snapshot.fontScale;
  fontStyleInput.value = snapshot.fontStyle;
  trackingInput.value = snapshot.tracking;
  centerXOffsetInput.value = snapshot.centerXOffset;
  staggerInput.value = snapshot.staggerDelay;
  wordLifeInput.value = snapshot.wordLife;
  fadeOutDelayInput.value = snapshot.fadeOutDelay;
  driftInput.value = snapshot.driftSpeed;
  textEffectInput.value = snapshot.textEffect;
  
  // Update UI labels
  updateLabels();
  fontScaleVal.textContent = `${parseFloat(fontScaleInput.value).toFixed(1)}x`;
  staggerVal.textContent = `${staggerInput.value}s`;
  wordLifeVal.textContent = `${wordLifeInput.value}s`;
  fadeOutDelayVal.textContent = `${fadeOutDelayInput.value}s`;
  trackingVal.textContent = `${trackingInput.value}px`;
  driftVal.textContent = driftInput.value;
  centerXOffsetVal.textContent = `${centerXOffsetInput.value}px`;
  
  // Rebuild and redraw
  if (isAudioSyncMode) {
    buildWordStructuresFromAudio(activeWordsData);
  } else {
    buildWordStructures();
  }
  drawFrameAtCurrentTime();
  
  // Update char counter
  updateCharCounter();
  renderWordChips();
  
  saveState();
}

// --- Canvas Dragging State ---
let draggedWordIndex = -1;
let dragStartX = 0;
let dragStartY = 0;
let dragStartWordX = 0; // Stores exact visual X on click
let dragStartWordY = 0; // Stores exact visual Y on click

// --- Resize State ---
let isResizing = false;
let isRotating = false;
let rotateStartX = 0;
let isAltDown = false;
let isCtrlDown = false;

let resizeStartX = 0;
let resizeStartScale = 1.0;
let isDragging = false;

// --- Multi-Select State ---
let selectedWordIndices = [];
let isAllSelected = false;
let dragStartStates = []; // Stores initial X, Y, and Scale for all selected words

// --- Marquee Selection State ---
let isMarqueeSelecting = false;
let marqueeStartX = 0;
let marqueeStartY = 0;
let marqueeCurrentX = 0;
let marqueeCurrentY = 0;

// --- Cinematic Glitch Effect Config (mutable — edited live via its panel) ---
let cinematicConfig = {
  emphasisWords: "TAKOT, DILIM, LALABAN",
  secondaryWords: "PATAY-SINDING",
  colors: {
    bg: "#000000", main: "#00D2FF", emphasis: "#FF4500", secondary: "#FFD700",
    glow: "#FF007F", chromaRed: "#FF4500", chromaBlue: "#00D2FF"
  },
  transform: { scale: 0.8 },
  style: {
    glitchIntensity: 0.3, chromaticAberration: 0.3, aberrationAngle: 15,
    aberrationRange: 1.0, emphasisScale: 1.8, secondaryScale: 0.9,
    screenShake: 0.5, glowStrength: 0.6, animSpeed: 1.0
  }
};
