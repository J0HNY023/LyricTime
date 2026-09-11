/* ==========================================================================
   config.js — Constants, configuration & DOM element references
   Loaded FIRST. Every other script relies on the globals declared here.
   ========================================================================== */

// --- Sidebar / Text Input Controls ---
const autoAlignInput = document.getElementById('autoAlign');
const capitalizeTextInput = document.getElementById('capitalizeText');

// --- Scrub Input References ---
const scrubValInput = document.getElementById('scrubValInput');
const scrubUnitSelect = document.getElementById('scrubUnitSelect');
const loopBtn = document.getElementById('loopBtn');

// --- Effect / Canvas ---
const textEffectInput = document.getElementById('textEffect');
const canvas = document.getElementById('animCanvas');
const ctx = canvas.getContext('2d');

// --- Text Input ---
const textInput = document.getElementById('textInput');
const charCounter = document.getElementById('charCounter');
const charLimitWarning = document.getElementById('charLimitWarning');
const MAX_CHARS = 896;

// --- Typography Controls ---
const fontStyleInput = document.getElementById('fontStyle');
const fontScaleInput = document.getElementById('fontScale');
const staggerInput = document.getElementById('staggerDelay');
const wordLifeInput = document.getElementById('wordLife');
const trackingInput = document.getElementById('letterSpacing');
const driftInput = document.getElementById('driftSpeed');
const triggerBtn = document.getElementById('triggerBtn');
const micBtn = document.getElementById('micBtn');
const micStatus = document.getElementById('micStatus');

// --- Audio Upload ---
const audioUpload = document.getElementById('audioUpload');
const processAudioBtn = document.getElementById('processAudioBtn');

// --- Value Label Spans ---
const fontScaleVal = document.getElementById('fontScaleVal');
const staggerVal = document.getElementById('staggerVal');
const wordLifeVal = document.getElementById('wordLifeVal');
const trackingVal = document.getElementById('trackingVal');
const driftVal = document.getElementById('driftVal');

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

const fadeOutDelayInput = document.getElementById('fadeOutDelay');
const fadeOutDelayVal = document.getElementById('fadeOutDelayVal');
const layoutModeInput = document.getElementById('layoutMode');

const centerXOffsetInput = document.getElementById('centerXOffset');
const centerXOffsetVal = document.getElementById('centerXOffsetVal');

const showAltTipsInput = document.getElementById('showAltTips');

// --- Word Chips / Editor DOM ---
const wordChipsContainer = document.getElementById('wordChipsContainer');
const clearTextBtn = document.getElementById('clearTextBtn');
const effectSettingsContainer = document.getElementById('effectSpecificSettings');

// --- Sidebar Resize ---
const sidebar = document.getElementById('sidebar');
const sidebarResizer = document.getElementById('sidebarResizer');

// --- Undo/Redo Buttons ---
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

// --- Rotation Slider ---
const rotationSlider = document.getElementById('rotationSlider');
const rotationVal = document.getElementById('rotationVal');

// NOTE: There is a "Words Per Line" slider in the HTML (#focusedWordsPerLine)
// but nothing in the codebase reads its value during layout — it currently
// has no effect. Left as-is since wiring it up would change behavior;
// flagging here so it's not mistaken for dead code you forgot to remove.

// --- Animation Constants ---
// Smooth easing factor (0.0–1.0, lower = smoother/slower)
const LAYOUT_EASE = 0.12;
