/* ==========================================================================
   utils.js — Small, mostly-pure helper functions used across the app
   ========================================================================== */

function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function getScrubStepInSeconds() {
  const val = parseFloat(scrubValInput.value) || 0;
  const unit = scrubUnitSelect.value;
  return unit === 'ms' ? val / 1000 : val;
}

function getDisplayText(text) {
  return capitalizeTextInput.checked ? text.toUpperCase() : text;
}

// Generates the little particles used by the "Dust Dissolve" text effect
function generateParticles(charWidth, currentX, charX, fontSize, tracking) {
  const particles = [];
  const particleCount = Math.floor(charWidth * 1.5);
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      relX: (charX - currentX) + Math.random() * charWidth,
      relY: -(Math.random() * fontSize * 0.8),
      size: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 0.5 - 0.2,
      particleDelay: Math.random() * 0.2
    });
  }
  return particles;
}
