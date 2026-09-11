/* ==========================================================================
   text-effects.js — Per-word visual effects (dust, glitch, blur, wave, etc.)
   and the Cinematic Glitch configuration panel.

   NOTE: The original file contained a second function, `drawWordEffect`,
   that duplicated most of this same switch-on-effect logic but was never
   called anywhere. It's been removed here as dead code — `renderWord` below
   is the single source of truth for drawing a word's effect.
   ========================================================================== */

function renderWord(wordObj, elapsed, fontSize, fontStyle, tracking, driftSpeed, overrideX = null, overrideY = null, overrideOpacity = null) {
  const wordScale = wordObj.scale || 1.0;
  const scaledFontSize = fontSize * wordScale;
  const scaledTracking = tracking * wordScale;

  const duration = wordObj.duration;
  const wordElapsed = elapsed - wordObj.startTime;

  if (wordElapsed < 0) return;

  // --- SMOOTH TRANSITION LOGIC ---
  if (wordObj.animX === undefined) { wordObj.animX = wordObj.x; wordObj.animY = wordObj.y; }

  if (layoutModeInput.value !== 'focused-center') {
    // If not in focused mode, target the original logical position
    wordObj.targetX = wordObj.x;
    wordObj.targetY = wordObj.y - (wordElapsed * driftSpeed * 10); // include drift

    wordObj.animX = lerp(wordObj.animX, wordObj.targetX, LAYOUT_EASE);
    wordObj.animY = lerp(wordObj.animY, wordObj.targetY, LAYOUT_EASE);
  }

  // Timeline Logic
  const fadeInDuration = duration * 0.3;
  const fadeOutDelay = parseFloat(fadeOutDelayInput ? fadeOutDelayInput.value : 0);
  let fadeOutDuration = duration - fadeInDuration - fadeOutDelay;
  if (fadeOutDuration < 0.1) fadeOutDuration = 0.1;

  let opacity = 0;
  let isFadingOut = false;
  let fadeOutProgress = 0;

  if (wordElapsed <= fadeInDuration) opacity = wordElapsed / fadeInDuration;
  else if (wordElapsed <= fadeInDuration + fadeOutDelay) opacity = 1;
  else if (wordElapsed <= duration) {
    isFadingOut = true;
    fadeOutProgress = (wordElapsed - fadeInDuration - fadeOutDelay) / fadeOutDuration;
    opacity = 1 - fadeOutProgress;
  } else return;

  // Apply override opacity if provided (for the 3-line layout dimming)
  if (overrideOpacity !== null) opacity = overrideOpacity;

  // --- COORDINATE INJECTION ---
  let drawX = wordObj.x;
  let drawY = wordObj.y - (wordElapsed * driftSpeed * 10);

  if (overrideX !== null) drawX = overrideX;
  if (overrideY !== null) drawY = overrideY;

  const effect = textEffectInput.value;
  ctx.font = `${scaledFontSize}px ${fontStyle}`;
  const chars = wordObj.text.split('');

  // Helper to draw text at the injected coordinates
  const drawText = (color, offsetX = 0, offsetY = 0) => {
    ctx.fillStyle = color;
    let charX = drawX + offsetX;
    chars.forEach(char => {
      const charWidth = ctx.measureText(char).width;
      ctx.fillText(char, charX, drawY + offsetY);
      charX += charWidth + scaledTracking;
    });
  };

  // === EFFECT: NONE ===
  if (effect === 'none') { drawText(`rgba(230, 230, 234, ${opacity})`); return; }

  // === EFFECT: DUST DISSOLVE ===
  if (effect === 'dust') {
    drawText(`rgba(230, 230, 234, ${opacity})`);
    if (isFadingOut) {
      // Offset between dynamic position and static position
      const offsetX = drawX - wordObj.x;
      const offsetY = drawY - wordObj.y;

      wordObj.particles.forEach(p => {
        const pElapsed = (wordElapsed - fadeInDuration - fadeOutDelay);
        if (pElapsed > p.particleDelay) {
          const pX = wordObj.x + offsetX + (p.relX * wordScale) + (p.vx * pElapsed * 15 * wordScale);
          const pY = wordObj.y + offsetY + (p.relY * wordScale) + (p.vy * pElapsed * 15 * wordScale);
          const pOpacity = Math.max(1 - (fadeOutProgress / (1 - p.particleDelay)), 0);

          if (pOpacity > 0) {
            ctx.fillStyle = `rgba(230, 230, 234, ${pOpacity * 0.8})`;
            ctx.fillRect(pX, pY, p.size * wordScale, p.size * wordScale);
          }
        }
      });
    }
    return;
  }

  // === EFFECT: RGB GLITCH ===
  if (effect === 'glitch') {
    const glitchIntensity = isFadingOut ? fadeOutProgress * 6 : 0;
    drawText(`rgba(255, 60, 60, ${opacity * 0.7})`, -glitchIntensity, 0);
    drawText(`rgba(60, 255, 60, ${opacity * 0.7})`, 0, 0);
    drawText(`rgba(60, 60, 255, ${opacity * 0.7})`, glitchIntensity, 0);
    return;
  }

  // === EFFECT: BLUR FADE ===
  if (effect === 'blur') {
    const blurAmount = isFadingOut ? fadeOutProgress * 10 : 0;
    ctx.save();
    ctx.filter = `blur(${blurAmount}px)`;
    drawText(`rgba(230, 230, 234, ${opacity})`);
    ctx.restore();
    return;
  }

  // === EFFECT: SINE WAVE ===
  if (effect === 'wave') {
    ctx.fillStyle = `rgba(230, 230, 234, ${opacity})`;
    let charX = drawX;
    const waveAmplitude = 4 * wordScale;
    const waveFrequency = 0.3;
    chars.forEach((char, i) => {
      const charWidth = ctx.measureText(char).width;
      const waveOffset = Math.sin((wordElapsed * 4) + (i * waveFrequency)) * waveAmplitude;
      ctx.fillText(char, charX, drawY + waveOffset);
      charX += charWidth + scaledTracking;
    });
    return;
  }

  // === EFFECT: TYPEWRITER ===
  if (effect === 'typewriter') {
    const totalChars = chars.length;
    const revealProgress = Math.min(wordElapsed / (duration * 0.6), 1);
    const charsToShow = Math.floor(revealProgress * totalChars);
    ctx.fillStyle = `rgba(230, 230, 234, ${opacity})`;
    let charX = drawX;
    chars.forEach((char, i) => {
      const charWidth = ctx.measureText(char).width;
      if (i < charsToShow) ctx.fillText(char, charX, drawY);
      else if (i === charsToShow && wordElapsed < duration * 0.6) {
        if (Math.floor(wordElapsed * 4) % 2 === 0) ctx.fillRect(charX, drawY - scaledFontSize * 0.8, 2 * wordScale, scaledFontSize);
      }
      charX += charWidth + scaledTracking;
    });
    return;
  }

  // === EFFECT: GLITCH STACK ===
  if (effect === 'glitch-stack') {
    const stackOffset = 4 * wordScale;
    const extraOffset = isFadingOut ? fadeOutProgress * 5 : 0;
    drawText(`rgba(0, 255, 255, ${opacity})`, -stackOffset - extraOffset, stackOffset);
    drawText(`rgba(255, 0, 255, ${opacity})`, stackOffset + extraOffset, -stackOffset);
    drawText(`rgba(255, 255, 255, ${opacity})`, 0, 0);
    return;
  }

  // === EFFECT: CINEMATIC GLITCH ===
  if (effect === 'cinematic-glitch') {
    renderCinematicWord(wordObj, elapsed, scaledFontSize, fontStyle, scaledTracking, driftSpeed, opacity, isFadingOut, fadeOutProgress, drawX, drawY);
    return;
  }
}

// --- Cinematic Render Function ---
function renderCinematicWord(wordObj, elapsed, fontSize, fontStyle, tracking, driftSpeed, globalOpacity, isFadingOut, fadeOutProgress, drawX, drawY) {
  const cfg = cinematicConfig;

  // Determine Word Type
  const emphasisList = cfg.emphasisWords.toUpperCase().split(',').map(s => s.trim());
  const secondaryList = cfg.secondaryWords.toUpperCase().split(',').map(s => s.trim());
  const cleanText = wordObj.text.toUpperCase();

  let isEmphasis = emphasisList.includes(cleanText);
  let isSecondary = secondaryList.includes(cleanText);

  let finalScale = cfg.transform.scale;
  let finalColor = cfg.colors.main;

  if (isEmphasis) { finalScale *= cfg.style.emphasisScale; finalColor = cfg.colors.emphasis; }
  if (isSecondary) { finalScale *= cfg.style.secondaryScale; finalColor = cfg.colors.secondary; }

  const finalFontSize = fontSize * finalScale;
  ctx.font = `bold ${finalFontSize}px ${fontStyle}`;

  const shakeAmt = cfg.style.screenShake * 5;
  const shakeX = (Math.random() - 0.5) * shakeAmt;
  const shakeY = (Math.random() - 0.5) * shakeAmt;
  const jitterX = (Math.random() - 0.5) * cfg.style.glitchIntensity * 10 * (isFadingOut ? 2 : 1);

  const finalDrawX = drawX + shakeX + jitterX;
  const finalDrawY = drawY + shakeY;

  if (cfg.style.glowStrength > 0) {
    ctx.fillStyle = cfg.colors.glow;
    ctx.globalAlpha = globalOpacity * cfg.style.glowStrength;
    ctx.fillText(wordObj.text, finalDrawX + 4, finalDrawY + 4);
  }

  const rad = cfg.style.aberrationAngle * (Math.PI / 180);
  const range = cfg.style.aberrationRange * 5;
  const aberration = cfg.style.chromaticAberration * (isFadingOut ? 1.5 : 1);

  const offX = Math.cos(rad) * range * aberration;
  const offY = Math.sin(rad) * range * aberration;

  ctx.globalAlpha = globalOpacity;
  ctx.fillStyle = cfg.colors.chromaRed;
  ctx.fillText(wordObj.text, finalDrawX + offX, finalDrawY + offY);

  ctx.fillStyle = cfg.colors.chromaBlue;
  ctx.fillText(wordObj.text, finalDrawX - offX, finalDrawY - offY);

  ctx.fillStyle = finalColor;
  ctx.fillText(wordObj.text, finalDrawX, finalDrawY);

  ctx.globalAlpha = 1.0;
}

/* -----------------------------------------------------------------------
   Cinematic Glitch Configuration Panel
   ----------------------------------------------------------------------- */

function buildCinematicUI() {
  effectSettingsContainer.style.display = 'block';
  effectSettingsContainer.innerHTML = `
    <h2 style="font-size:0.9rem; color:#00e5ff; margin-bottom:10px;">Cinematic Glitch Settings</h2>

    <div class="cinematic-group">
      <label class="cinematic-label">Emphasis Words</label>
      <input type="text" class="cinematic-text-input" id="cinEmphasisWords" value="${cinematicConfig.emphasisWords}" style="background:#09090c; border:1px solid #22222a; padding:8px; border-radius:4px;">
    </div>
    <div class="cinematic-group">
      <label class="cinematic-label">Secondary Words</label>
      <input type="text" class="cinematic-text-input" id="cinSecondaryWords" value="${cinematicConfig.secondaryWords}" style="background:#09090c; border:1px solid #22222a; padding:8px; border-radius:4px;">
    </div>

    <div class="cinematic-group">
      <label class="cinematic-label">Colors</label>
      ${createColorRow('Main Text', 'main', cinematicConfig.colors.main)}
      ${createColorRow('Emphasis', 'emphasis', cinematicConfig.colors.emphasis)}
      ${createColorRow('Secondary', 'secondary', cinematicConfig.colors.secondary)}
      ${createColorRow('3D Offset Glow', 'glow', cinematicConfig.colors.glow)}
      ${createColorRow('Chroma Red', 'chromaRed', cinematicConfig.colors.chromaRed)}
      ${createColorRow('Chroma Blue', 'chromaBlue', cinematicConfig.colors.chromaBlue)}
    </div>

    <div class="cinematic-group">
      <label class="cinematic-label">Transform</label>
      ${createSliderRow('Global Scale', 'scale', cinematicConfig.transform.scale, 0.1, 3.0, 0.1)}
    </div>

    <div class="cinematic-group">
      <label class="cinematic-label">Style</label>
      ${createSliderRow('Glitch Intensity', 'glitchIntensity', cinematicConfig.style.glitchIntensity, 0, 1, 0.1)}
      ${createSliderRow('Chromatic Aberration', 'chromaticAberration', cinematicConfig.style.chromaticAberration, 0, 1, 0.1)}
      ${createSliderRow('Aberration Angle', 'aberrationAngle', cinematicConfig.style.aberrationAngle, 0, 360, 1)}
      ${createSliderRow('Aberration Range', 'aberrationRange', cinematicConfig.style.aberrationRange, 0, 5, 0.1)}
      ${createSliderRow('Emphasis Scale', 'emphasisScale', cinematicConfig.style.emphasisScale, 0.5, 3.0, 0.1)}
      ${createSliderRow('Secondary Scale', 'secondaryScale', cinematicConfig.style.secondaryScale, 0.5, 2.0, 0.1)}
      ${createSliderRow('Screen Shake', 'screenShake', cinematicConfig.style.screenShake, 0, 2, 0.1)}
      ${createSliderRow('Glow Strength', 'glowStrength', cinematicConfig.style.glowStrength, 0, 2, 0.1)}
      ${createSliderRow('Animation Speed', 'animSpeed', cinematicConfig.style.animSpeed, 0.1, 3.0, 0.1)}
    </div>
  `;
  attachCinematicListeners();
}

function createColorRow(label, key, hex) {
  return `
    <div style="margin-bottom:8px;">
      <span style="font-size:0.7rem; color:#aaa;">${label}</span>
      <div class="cinematic-input-row">
        <input type="color" class="cinematic-color-picker" id="cinColor_${key}" value="${hex}">
        <input type="text" class="cinematic-text-input" id="cinHex_${key}" value="${hex}" style="width:80px;">
      </div>
    </div>
  `;
}

function createSliderRow(label, key, val, min, max, step) {
  return `
    <div style="margin-bottom:8px;">
      <div class="cinematic-slider-row">
        <span style="font-size:0.7rem; color:#aaa; width:120px;">${label}</span>
        <input type="range" id="cinSlider_${key}" min="${min}" max="${max}" step="${step}" value="${val}">
        <span class="cinematic-val-display" id="cinVal_${key}">${val}</span>
      </div>
    </div>
  `;
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
    effectSettingsContainer.innerHTML = '';
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
