/* ==========================================================================
   canvas.js — Canvas setup, sizing, coordinate math & low-level drawing
   ========================================================================== */

// --- Tooltip Setup ---
const canvasTooltip = document.createElement('div');
canvasTooltip.id = 'canvasTooltip';
document.body.appendChild(canvasTooltip);

// Hide tooltip when mouse leaves canvas
canvas.addEventListener('mouseleave', () => {
  canvasTooltip.style.display = 'none';
});

// --- Fullscreen Toggle Logic ---
const fullscreenBtn = document.getElementById('fullscreenBtn');
const canvasViewport = document.querySelector('.canvas-viewport');

if (fullscreenBtn && canvasViewport) {
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      canvasViewport.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  });

  // Listen for fullscreen changes (including pressing 'Esc' to exit)
  document.addEventListener('fullscreenchange', () => {
    // Wait a brief moment for the browser to finish the transition
    setTimeout(() => {
      resizeCanvas();

      if (isAudioSyncMode) {
        buildWordStructuresFromAudio(activeWordsData);
      } else {
        buildWordStructures();
      }

      drawFrameAtCurrentTime();
    }, 100);
  });
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

function getComputedFontSize() {
  const scale = parseFloat(fontScaleInput.value);
  const baseSize = Math.min(canvas.width * 0.032, 22);
  return baseSize * scale;
}

function clampWordToBounds(wordObj) {
  if (!autoAlignInput || !autoAlignInput.checked) return;

  const wordScale = wordObj.scale || 1.0;
  const scaledWidth = (wordObj.baseWidth || wordObj.width) * wordScale;
  const scaledHeight = getComputedFontSize() * wordScale; // actual text height

  const padding = 20;
  const maxX = canvas.width - scaledWidth - padding;
  const maxY = canvas.height - 20;

  // Clamp X position
  if (wordObj.x < padding) wordObj.x = padding;
  if (wordObj.x > maxX) wordObj.x = maxX;

  // Clamp Y position based on text height so the top doesn't go off screen
  const minY = padding + scaledHeight;
  if (wordObj.y < minY) wordObj.y = minY;
  if (wordObj.y > maxY) wordObj.y = maxY;

  // Sync back to data model if in audio sync mode
  if (wordObj.dataIndex !== -1 && activeWordsData[wordObj.dataIndex]) {
    activeWordsData[wordObj.dataIndex].absX = wordObj.x;
    activeWordsData[wordObj.dataIndex].absY = wordObj.y;
  }
}

// New function to clamp all words to bounds (called from reset settings)
function clampAllWordsToScreen() {
  wordObjects.forEach(wordObj => clampWordToBounds(wordObj));
  if (isAudioSyncMode) {
    buildWordStructuresFromAudio(activeWordsData);
  } else {
    buildWordStructures();
  }
  drawFrameAtCurrentTime();
}

// Clamp button handler
const clampToScreenBtn = document.getElementById('clampToScreenBtn');
if (clampToScreenBtn) {
  clampToScreenBtn.addEventListener('click', () => {
    clampAllWordsToScreen();
  });
}

function getCanvasCoordinates(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

function drawDebugGrid() {
  if (!isDebugMode) return;

  ctx.save();

  // 1. Safe Text Area Boundary (the 20px padding used for wrapping)
  const padding = 20;
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(padding, padding, canvas.width - (padding * 2), canvas.height - (padding * 2));

  // 2. Center Crosshair
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, canvas.height);
  ctx.moveTo(0, centerY);
  ctx.lineTo(canvas.width, centerY);
  ctx.stroke();

  // 3. Grid Lines (every 50px)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);
  ctx.beginPath();

  for (let x = 0; x <= canvas.width; x += 50) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  for (let y = 0; y <= canvas.height; y += 50) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();

  // 4. Coordinate Labels
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '10px monospace';
  ctx.fillText(`W: ${canvas.width}px | H: ${canvas.height}px`, 5, 15);
  ctx.fillText(`Center: (${centerX}, ${centerY})`, centerX + 5, centerY - 5);
  ctx.fillText(`Safe Area: ${padding}px padding`, padding + 5, padding + 15);

  ctx.restore();
}

function drawMarquee() {
  if (!isMarqueeSelecting) return;

  const minX = Math.min(marqueeStartX, marqueeCurrentX);
  const maxX = Math.max(marqueeStartX, marqueeCurrentX);
  const minY = Math.min(marqueeStartY, marqueeCurrentY);
  const maxY = Math.max(marqueeStartY, marqueeCurrentY);
  const width = maxX - minX;
  const height = maxY - minY;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
  ctx.fillRect(minX, minY, width, height);
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(minX, minY, width, height);
  ctx.restore();
}

// --- Bounding Box Render Logic ---
function drawWordHighlight(obj, activeTime, driftSpeed, fontSize) {
  const wordScale = obj.scale || 1.0;
  const scaledFontSize = fontSize * wordScale;

  // Measure text directly so the box always matches the current size
  ctx.font = `${scaledFontSize}px ${fontStyleInput.value}`;
  const scaledTracking = parseInt(trackingInput.value, 10) * wordScale;

  let scaledWidth = 0;
  obj.text.split('').forEach(char => {
    scaledWidth += ctx.measureText(char).width + scaledTracking;
  });

  const currentDrift = isAudioSyncMode ? (activeTime - obj.startTime) * driftSpeed * 10 : 0;
  const currentY = obj.y - currentDrift;

  const padding = 2;
  const x = obj.x - padding;
  const y = currentY - scaledFontSize - padding;
  const width = scaledWidth + (padding * 2);
  const height = scaledFontSize + (padding * 2);

  // Get rotation value (default to 0 if not set)
  const rotation = obj.rotation || 0;

  ctx.save();
  // Apply rotation around the word's center
  ctx.translate(obj.x, currentY);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.translate(-obj.x, -currentY);

  // Draw rotated bounding box
  ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, width, height);
  
  // Draw rotation handle icon at top-center of selected word (centered on border)
  // Adjusted: moved right by 50% and up by 5%
  const handleSize = 12;
  const handleY = y - handleSize - 6 - (height * 0.05); // Move up by 5% of height
  const centerX = obj.x + (width * 0.5); // Move right by 50% of width
  
  ctx.fillStyle = '#00e5ff';
  ctx.beginPath();
  ctx.arc(centerX, handleY + (handleSize / 2), handleSize / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw curved arrow to indicate rotation
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, handleY + (handleSize / 2), handleSize * 0.9, -Math.PI * 0.3, Math.PI * 0.8);
  ctx.stroke();
  
  // Draw arrowhead
  const arrowAngle = Math.PI * 0.8;
  const arrowX = centerX + Math.cos(arrowAngle) * handleSize * 0.9;
  const arrowY = (handleY + (handleSize / 2)) + Math.sin(arrowAngle) * handleSize * 0.9;
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(arrowX - 3 * Math.cos(arrowAngle - Math.PI / 6), arrowY - 3 * Math.sin(arrowAngle - Math.PI / 6));
  ctx.lineTo(arrowX - 3 * Math.cos(arrowAngle + Math.PI / 6), arrowY - 3 * Math.sin(arrowAngle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = '#00e5ff';
  ctx.fill();
  
  ctx.restore();
}
