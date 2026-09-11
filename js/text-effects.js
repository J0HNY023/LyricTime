/* ==========================================================================
   text-effects.js — Text effect rendering logic (dust, glitch, blur, etc.)
   ========================================================================== */

// Import effectSettingsContainer from config.js (declared there)
// Import cinematicConfig from state.js (declared there)

/**
 * Render a word with the appropriate effect
 * This is the main entry point called by main.js and layouts.js
 * @param {Object} wordObj - Word object with position and timing data
 * @param {number} activeTime - Current time in seconds
 * @param {number} fontSize - Font size in pixels
 * @param {string} fontFamily - Font family string
 * @param {number} tracking - Letter spacing in pixels
 * @param {number} driftSpeed - Drift speed multiplier
 * @param {number} [animX] - Optional animated X position (for layout transitions)
 * @param {number} [animY] - Optional animated Y position (for layout transitions)
 * @param {number} [opacity] - Optional opacity override (0-1)
 */
function renderWord(wordObj, activeTime, fontSize, fontFamily, tracking, driftSpeed, animX, animY, opacity) {
  const { text, x, y, startTime, duration, color } = wordObj;
  
  // Use animated position if provided, otherwise use base position
  const renderX = animX !== undefined ? animX : x;
  const renderY = animY !== undefined ? animY : y;
  
  // Calculate progress (0-1) based on timing
  const elapsed = activeTime - startTime;
  const progress = Math.max(0, Math.min(1, elapsed / duration));
  
  // Apply drift if in audio sync mode
  let finalY = renderY;
  if (isAudioSyncMode && driftSpeed > 0) {
    finalY = renderY - (elapsed * driftSpeed * 10);
  }
  
  // Get the current effect type
  const effect = textEffectInput ? textEffectInput.value : 'none';
  
  // Create a temporary word object for the effect renderer
  const tempWordObj = {
    ...wordObj,
    x: renderX,
    y: finalY,
    fontSize,
    fontFamily,
    color: color || '#ffffff'
  };
  
  // Apply custom opacity if provided
  if (opacity !== undefined) {
    ctx.save();
    ctx.globalAlpha = opacity;
    drawWordWithEffect(ctx, tempWordObj, progress, effect);
    ctx.restore();
  } else {
    drawWordWithEffect(ctx, tempWordObj, progress, effect);
  }
}

// Cinematic Glitch configuration is imported from state.js
// let cinematicConfig = { ... } is defined in state.js line 169

/**
 * Draw a word with the specified effect
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} wordObj - Word object with position and timing data
 * @param {number} progress - Animation progress (0-1)
 * @param {string} effect - Effect type to apply
 */
function drawWordWithEffect(ctx, wordObj, progress, effect) {
  const { text, x, y, fontSize, fontFamily, color } = wordObj;
  
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  
  switch (effect) {
    case 'dust':
      drawDustEffect(ctx, wordObj, progress);
      break;
    case 'glitch':
      drawGlitchEffect(ctx, wordObj, progress);
      break;
    case 'blur':
      drawBlurEffect(ctx, wordObj, progress);
      break;
    case 'wave':
      drawWaveEffect(ctx, wordObj, progress);
      break;
    case 'typewriter':
      drawTypewriterEffect(ctx, wordObj, progress);
      break;
    case 'glitch-stack':
      drawGlitchStackEffect(ctx, wordObj, progress);
      break;
    case 'cinematic-glitch':
      drawCinematicGlitchEffect(ctx, wordObj, progress);
      break;
    default:
      drawPlainFadeEffect(ctx, wordObj, progress);
  }
}

function drawPlainFadeEffect(ctx, wordObj, progress) {
  const { text, x, y, fontSize, fontFamily, color } = wordObj;
  
  ctx.save();
  ctx.globalAlpha = Math.min(1, progress * 2);
  ctx.fillStyle = color || '#ffffff';
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawDustEffect(ctx, wordObj, progress) {
  const { text, x, y, fontSize, fontFamily, color } = wordObj;
  
  ctx.save();
  ctx.fillStyle = color || '#ffffff';
  ctx.font = `${fontSize}px ${fontFamily}`;
  
  // Fade in/out
  const alpha = Math.min(1, progress * 2, (1 - progress) * 2 + 0.5);
  ctx.globalAlpha = alpha;
  
  // Draw particles
  const particleCount = Math.floor(fontSize * 0.8);
  for (let i = 0; i < particleCount; i++) {
    const offsetX = (Math.sin(progress * 10 + i) * fontSize * 0.3);
    const offsetY = (Math.cos(progress * 8 + i) * fontSize * 0.2);
    const particleSize = Math.random() * 2 + 1;
    
    ctx.beginPath();
    ctx.arc(x + offsetX, y + offsetY - (progress * fontSize * 0.5), particleSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function drawGlitchEffect(ctx, wordObj, progress) {
  const { text, x, y, fontSize, fontFamily, color } = wordObj;
  
  ctx.save();
  ctx.font = `${fontSize}px ${fontFamily}`;
  
  // RGB split effect
  const glitchOffset = Math.sin(progress * 20) * 3;
  
  // Red channel
  ctx.fillStyle = '#ff0040';
  ctx.globalAlpha = 0.7;
  ctx.fillText(text, x + glitchOffset, y);
  
  // Blue channel
  ctx.fillStyle = '#00d4ff';
  ctx.globalAlpha = 0.7;
  ctx.fillText(text, x - glitchOffset, y);
  
  // Main text
  ctx.fillStyle = color || '#ffffff';
  ctx.globalAlpha = Math.min(1, progress * 2);
  ctx.fillText(text, x, y);
  
  ctx.restore();
}

function drawBlurEffect(ctx, wordObj, progress) {
  const { text, x, y, fontSize, fontFamily, color } = wordObj;
  
  ctx.save();
  ctx.fillStyle = color || '#ffffff';
  ctx.font = `${fontSize}px ${fontFamily}`;
  
  const blurAmount = Math.max(0, (1 - progress) * 10);
  ctx.filter = `blur(${blurAmount}px)`;
  ctx.globalAlpha = Math.min(1, progress * 2);
  ctx.fillText(text, x, y);
  
  ctx.restore();
}

function drawWaveEffect(ctx, wordObj, progress) {
  const { text, x, y, fontSize, fontFamily, color } = wordObj;
  
  ctx.save();
  ctx.fillStyle = color || '#ffffff';
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.globalAlpha = Math.min(1, progress * 2);
  
  // Draw each character with wave offset
  const chars = text.split('');
  const charWidth = ctx.measureText('a').width;
  let currentX = x - (chars.length * charWidth) / 2;
  
  for (let i = 0; i < chars.length; i++) {
    const waveOffset = Math.sin(progress * 10 + i * 0.5) * 5;
    ctx.fillText(chars[i], currentX + (i * charWidth), y + waveOffset);
  }
  
  ctx.restore();
}

function drawTypewriterEffect(ctx, wordObj, progress) {
  const { text, x, y, fontSize, fontFamily, color } = wordObj;
  
  ctx.save();
  ctx.fillStyle = color || '#ffffff';
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.globalAlpha = Math.min(1, progress * 2);
  
  // Show characters progressively
  const charCount = Math.floor(text.length * progress);
  const visibleText = text.substring(0, charCount);
  
  const textWidth = ctx.measureText(visibleText).width;
  ctx.fillText(visibleText, x - textWidth / 2, y);
  
  // Draw cursor
  if (charCount < text.length && Math.floor(Date.now() / 500) % 2 === 0) {
    const cursorX = x - textWidth / 2 + textWidth;
    ctx.fillRect(cursorX, y - fontSize / 2, 2, fontSize);
  }
  
  ctx.restore();
}

function drawGlitchStackEffect(ctx, wordObj, progress) {
  const { text, x, y, fontSize, fontFamily, color } = wordObj;
  
  ctx.save();
  ctx.font = `${fontSize}px ${fontFamily}`;
  
  // Create stacked anaglyph effect
  const layers = 3;
  for (let i = 0; i < layers; i++) {
    const offset = (i - 1) * 2;
    const hue = (i / layers) * 360;
    ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${0.5 * Math.min(1, progress * 2)})`;
    ctx.fillText(text, x + offset, y + offset);
  }
  
  // Main text on top
  ctx.fillStyle = color || '#ffffff';
  ctx.globalAlpha = Math.min(1, progress * 2);
  ctx.fillText(text, x, y);
  
  ctx.restore();
}

function drawCinematicGlitchEffect(ctx, wordObj, progress) {
  const { text, x, y, fontSize, fontFamily, color } = wordObj;
  
  ctx.save();
  
  // Apply global scale from config
  const scale = cinematicConfig.transform.scale;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(-x, -y);
  
  // Check if word is emphasis or secondary
  const isEmphasis = cinematicConfig.emphasisWords.split(',').some(w => w.trim().toLowerCase() === text.toLowerCase());
  const isSecondary = cinematicConfig.secondaryWords.split(',').some(w => w.trim().toLowerCase() === text.toLowerCase());
  
  let textColor = color || cinematicConfig.colors.main;
  let textScale = 1;
  
  if (isEmphasis) {
    textColor = cinematicConfig.colors.emphasis;
    textScale = cinematicConfig.style.emphasisScale;
  } else if (isSecondary) {
    textColor = cinematicConfig.colors.secondary;
    textScale = cinematicConfig.style.secondaryScale;
  }
  
  ctx.font = `${fontSize * textScale}px ${fontFamily}`;
  
  // Screen shake
  const shakeAmount = cinematicConfig.style.screenShake * Math.sin(progress * 30);
  
  // Chromatic aberration
  const aberrationRange = cinematicConfig.style.aberrationRange;
  const aberrationAngle = (cinematicConfig.style.aberrationAngle * Math.PI) / 180;
  const aberrationX = Math.cos(aberrationAngle) * aberrationRange;
  const aberrationY = Math.sin(aberrationAngle) * aberrationRange;
  
  // Draw red channel offset
  ctx.fillStyle = cinematicConfig.colors.chromaRed;
  ctx.globalAlpha = 0.5 * cinematicConfig.style.chromaticAberration;
  ctx.fillText(text, x + aberrationX + shakeAmount, y + aberrationY + shakeAmount);
  
  // Draw blue channel offset
  ctx.fillStyle = cinematicConfig.colors.chromaBlue;
  ctx.globalAlpha = 0.5 * cinematicConfig.style.chromaticAberration;
  ctx.fillText(text, x - aberrationX - shakeAmount, y - aberrationY - shakeAmount);
  
  // Main text with glow
  ctx.fillStyle = textColor;
  ctx.globalAlpha = Math.min(1, progress * 2);
  
  // Apply glow
  if (cinematicConfig.style.glowStrength > 0) {
    ctx.shadowColor = cinematicConfig.colors.glow;
    ctx.shadowBlur = fontSize * cinematicConfig.style.glowStrength;
  }
  
  ctx.fillText(text, x + shakeAmount, y + shakeAmount);
  
  ctx.restore();
}

/* -----------------------------------------------------------------------
   Cinematic Glitch Configuration Panel
   ----------------------------------------------------------------------- */

function buildCinematicUI() {
  effectSettingsContainer.style.display = 'block';
  
  // Clear existing content safely
  while (effectSettingsContainer.firstChild) {
    effectSettingsContainer.removeChild(effectSettingsContainer.firstChild);
  }
  
  // Create title
  const titleEl = document.createElement('h2');
  titleEl.style.cssText = 'font-size:0.9rem; color:#00e5ff; margin-bottom:10px;';
  titleEl.textContent = 'Cinematic Glitch Settings';
  effectSettingsContainer.appendChild(titleEl);
  
  // Create groups using DOM methods
  createCinematicGroup('Emphasis Words', 'cinEmphasisWords', 'text', cinematicConfig.emphasisWords);
  createCinematicGroup('Secondary Words', 'cinSecondaryWords', 'text', cinematicConfig.secondaryWords);
  
  // Colors group
  const colorsDiv = document.createElement('div');
  colorsDiv.className = 'cinematic-group';
  colorsDiv.innerHTML = '<label class="cinematic-label">Colors</label>';
  
  Object.entries(cinematicConfig.colors).forEach(([key, hex]) => {
    const colorRow = document.createElement('div');
    colorRow.style.marginBottom = '8px';
    colorRow.innerHTML = DOMPurify.sanitize(`
      <span style="font-size:0.7rem; color:#aaa;">${key.charAt(0).toUpperCase() + key.slice(1)}</span>
      <div class="cinematic-input-row">
        <input type="color" class="cinematic-color-picker" id="cinColor_${key}" value="${hex}">
        <input type="text" class="cinematic-text-input" id="cinHex_${key}" value="${hex}" style="width:80px;">
      </div>
    `);
    colorsDiv.appendChild(colorRow);
  });
  
  effectSettingsContainer.appendChild(colorsDiv);
  
  // Transform group
  const transformDiv = document.createElement('div');
  transformDiv.className = 'cinematic-group';
  transformDiv.innerHTML = '<label class="cinematic-label">Transform</label>';
  transformDiv.appendChild(createCinematicSlider('Global Scale', 'scale', cinematicConfig.transform.scale, 0.1, 3.0, 0.1));
  effectSettingsContainer.appendChild(transformDiv);
  
  // Style group
  const styleDiv = document.createElement('div');
  styleDiv.className = 'cinematic-group';
  styleDiv.innerHTML = '<label class="cinematic-label">Style</label>';
  
  const styleSliders = [
    ['Glitch Intensity', 'glitchIntensity', cinematicConfig.style.glitchIntensity, 0, 1, 0.1],
    ['Chromatic Aberration', 'chromaticAberration', cinematicConfig.style.chromaticAberration, 0, 1, 0.1],
    ['Aberration Angle', 'aberrationAngle', cinematicConfig.style.aberrationAngle, 0, 360, 1],
    ['Aberration Range', 'aberrationRange', cinematicConfig.style.aberrationRange, 0, 5, 0.1],
    ['Emphasis Scale', 'emphasisScale', cinematicConfig.style.emphasisScale, 0.5, 3.0, 0.1],
    ['Secondary Scale', 'secondaryScale', cinematicConfig.style.secondaryScale, 0.5, 2.0, 0.1],
    ['Screen Shake', 'screenShake', cinematicConfig.style.screenShake, 0, 2, 0.1],
    ['Glow Strength', 'glowStrength', cinematicConfig.style.glowStrength, 0, 2, 0.1],
    ['Animation Speed', 'animSpeed', cinematicConfig.style.animSpeed, 0.1, 3.0, 0.1]
  ];
  
  styleSliders.forEach(([label, key, val, min, max, step]) => {
    styleDiv.appendChild(createCinematicSlider(label, key, val, min, max, step));
  });
  
  effectSettingsContainer.appendChild(styleDiv);
  
  attachCinematicListeners();
}

function createCinematicGroup(label, id, type, value) {
  const groupDiv = document.createElement('div');
  groupDiv.className = 'cinematic-group';
  
  const labelEl = document.createElement('label');
  labelEl.className = 'cinematic-label';
  labelEl.textContent = label;
  
  const inputEl = document.createElement('input');
  inputEl.type = type;
  inputEl.id = id;
  inputEl.value = value;
  inputEl.style.cssText = 'background:#09090c; border:1px solid #22222a; padding:8px; border-radius:4px; width:100%; box-sizing:border-box;';
  
  groupDiv.appendChild(labelEl);
  groupDiv.appendChild(inputEl);
  effectSettingsContainer.appendChild(groupDiv);
}

function createCinematicSlider(label, key, val, min, max, step) {
  const div = document.createElement('div');
  div.style.marginBottom = '8px';
  div.innerHTML = DOMPurify.sanitize(`
    <div class="cinematic-slider-row">
      <span style="font-size:0.7rem; color:#aaa; width:120px;">${label}</span>
      <input type="range" id="cinSlider_${key}" min="${min}" max="${max}" step="${step}" value="${val}">
      <span class="cinematic-val-display" id="cinVal_${key}">${val}</span>
    </div>
  `);
  return div;
}

function attachCinematicListeners() {
  // 1. Text Inputs (Emphasis & Secondary Words)
  ['EmphasisWords', 'SecondaryWords'].forEach(id => {
    const el = document.getElementById(`cin${id}`);
    if (el) {
      el.addEventListener('input', (e) => {
        const key = id === 'EmphasisWords' ? 'emphasisWords' : 'secondaryWords';
        cinematicConfig[key] = e.target.value;
        saveState();
        triggerPreview();
      });
    }
  });

  // 2. Color Inputs
  Object.keys(cinematicConfig.colors).forEach(key => {
    const colorInput = document.getElementById(`cinColor_${key}`);
    const hexInput = document.getElementById(`cinHex_${key}`);

    if (colorInput && hexInput) {
      colorInput.addEventListener('input', (e) => {
        hexInput.value = e.target.value;
        cinematicConfig.colors[key] = e.target.value;
        saveState();
        triggerPreview();
      });
      hexInput.addEventListener('change', (e) => {
        colorInput.value = e.target.value;
        cinematicConfig.colors[key] = e.target.value;
        saveState();
        triggerPreview();
      });
    }
  });

  // 3. Sliders (Transform & Style)
  const sliderKeys = [...Object.keys(cinematicConfig.transform), ...Object.keys(cinematicConfig.style)];
  sliderKeys.forEach(key => {
    const slider = document.getElementById(`cinSlider_${key}`);
    const display = document.getElementById(`cinVal_${key}`);

    if (slider && display) {
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        display.textContent = val;

        if (cinematicConfig.transform[key] !== undefined) {
          cinematicConfig.transform[key] = val;
        }
        if (cinematicConfig.style[key] !== undefined) {
          cinematicConfig.style[key] = val;
        }

        saveState();
        triggerPreview();
      });
    }
  });
}

// Forces a redraw/restart so slider changes are visible immediately
function triggerPreview() {
  if (isAudioSyncMode) {
    drawFrameAtCurrentTime();
  } else {
    startTime = null;
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(animate);
  }
}

// --- Hook into Text Effect Change ---
textEffectInput.addEventListener('change', (e) => {
  if (e.target.value === 'cinematic-glitch') {
    buildCinematicUI();
  } else {
    effectSettingsContainer.style.display = 'none';
    while (effectSettingsContainer.firstChild) {
      effectSettingsContainer.removeChild(effectSettingsContainer.firstChild);
    }
  }
  saveState();
  if (!isAudioSyncMode) startAnimation();
});

// --- Initialize Cinematic UI on Page Load if Already Selected ---
// This ensures that when the page is reloaded with cinematic-glitch active,
// the settings panel is displayed immediately.
if (textEffectInput && textEffectInput.value === 'cinematic-glitch') {
  buildCinematicUI();
}
