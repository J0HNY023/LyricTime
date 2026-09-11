/* ==========================================================================
   timestamp-editor.js — Bottom "Synced Words & Positions" editor UI
   ========================================================================== */

// Store selected word indices for batch operations
let selectedTimestampIndices = [];

// --- Editor Toggle Logic ---
window.toggleEditor = function () {
  const editor = document.getElementById('timestampEditorContainer');
  const btn = document.getElementById('editorToggleBtn');

  if (editor.classList.contains('collapsed')) {
    editor.classList.remove('collapsed');
    btn.textContent = '▼ Collapse';
  } else {
    editor.classList.add('collapsed');
    btn.textContent = '▲ Expand';
  }

  // Resize canvas after the CSS transition to ensure it fits perfectly
  setTimeout(() => {
    resizeCanvas();
    drawFrameAtCurrentTime();
  }, 300);
};

// --- Timestamp Step Change Handler ---
function updateTimestampSteps() {
  const stepInput = document.getElementById('timestampStepInput');
  if (!stepInput) return;
  const step = stepInput.value || '0.1';
  
  // Update all timestamp input steps dynamically
  document.querySelectorAll('input[type="number"][onchange*="start"], input[type="number"][onchange*="end"]').forEach(input => {
    input.step = step;
  });
}

// --- Dynamic Sidebar Position & Timestamp Editor ---
function renderTimestampEditorUI() {
  let editorContainer = document.getElementById('timestampEditorContainer');

  // 1. Safety check: create the container if it's missing
  if (!editorContainer) {
    console.warn('Timestamp editor container missing. Creating it...');
    editorContainer = document.createElement('div');
    editorContainer.id = 'timestampEditorContainer';
    editorContainer.className = 'bottom-editor collapsed';

    editorContainer.innerHTML = `
      <div class="editor-header" onclick="toggleEditor()">
        <span class="editor-title">SYNCED WORDS & POSITIONS</span>
        <button class="toggle-btn" id="editorToggleBtn">▲ Expand</button>
      </div>
      <div class="editor-content"></div>
    `;

    document.querySelector('.main-content').appendChild(editorContainer);
  }

  // Hide completely if no data
  if (!activeWordsData || activeWordsData.length === 0) {
    editorContainer.classList.add('hidden');
    return;
  }

  // Show editor
  editorContainer.classList.remove('hidden');

  const toggleBtn = document.getElementById('editorToggleBtn');
  if (toggleBtn) toggleBtn.textContent = '▲ Expand';

  // 2. Safety check: find or create the inner content area
  let editorContent = editorContainer.querySelector('.editor-content');
  if (!editorContent) {
    editorContent = document.createElement('div');
    editorContent.className = 'editor-content';
    editorContainer.appendChild(editorContent);
  }

  let html = `
    <!-- Global Time Offset Control -->
    <div style="display:flex; align-items:center; gap:8px; background:#0e0e14; padding:8px; border-radius:4px; border:1px solid #22222a; font-size:0.75rem; color:#aaa; flex-wrap: wrap; margin-bottom: 12px;">
      <span>Shift All Times:</span>
      <input type="number" id="shiftAmountInput" value="0.5" step="0.1" style="width:45px; padding:2px 4px; font-size:0.75rem; background:#09090c; border:1px solid #333; color:#fff; border-radius:3px;">
      <span>s</span>
      <button onclick="shiftAllTimestamps(1)" style="background:#222230; color:#00e5ff; border:1px solid #333345; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">+ Shift</button>
      <button onclick="shiftAllTimestamps(-1)" style="background:#222230; color:#ff7777; border:1px solid #333345; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">- Shift</button>
      <button onclick="applyTimestampEdits()" class="btn-primary" style="margin:0 0 0 auto; padding:4px 12px; font-size:0.7rem; background:#8a2be2; color:#fff;">Apply & Sort</button>
    </div>
    
    <!-- Timestamp Increment Settings -->
    <div style="display:flex; align-items:center; gap:8px; background:#0e0e14; padding:8px; border-radius:4px; border:1px solid #22222a; font-size:0.75rem; color:#aaa; flex-wrap: wrap; margin-bottom: 12px;">
      <span>Timestamp Step:</span>
      <input type="number" id="timestampStepInput" value="0.1" step="0.05" min="0.01" onchange="updateTimestampSteps()" style="width:50px; padding:2px 4px; font-size:0.75rem; background:#09090c; border:1px solid #333; color:#fff; border-radius:3px;">
      <span>s</span>
      <span style="margin-left:8px;">Use arrows on timestamp inputs to increment by this amount.</span>
    </div>
    
    <!-- Batch Selection Controls -->
    <div style="display:flex; align-items:center; gap:8px; background:#0e0e14; padding:8px; border-radius:4px; border:1px solid #22222a; font-size:0.75rem; color:#aaa; flex-wrap: wrap; margin-bottom: 12px;">
      <span>Select:</span>
      <button onclick="selectAllTimestamps()" style="background:#222230; color:#00e5ff; border:1px solid #333345; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">All</button>
      <button onclick="deselectAllTimestamps()" style="background:#222230; color:#aaa; border:1px solid #333345; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">None</button>
      <span style="margin-left:auto;" id="selectedCountDisplay">0 selected</span>
    </div>
    <div style="display:flex; align-items:center; gap:8px; background:#0e0e14; padding:8px; border-radius:4px; border:1px solid #22222a; font-size:0.75rem; color:#aaa; flex-wrap: wrap; margin-bottom: 12px;">
      <span>Batch Shift Selected:</span>
      <input type="number" id="batchShiftAmountInput" value="0.1" step="0.05" style="width:45px; padding:2px 4px; font-size:0.75rem; background:#09090c; border:1px solid #333; color:#fff; border-radius:3px;">
      <span>s</span>
      <button onclick="batchShiftTimestamps(1)" style="background:#222230; color:#00e5ff; border:1px solid #333345; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">+ Shift</button>
      <button onclick="batchShiftTimestamps(-1)" style="background:#222230; color:#ff7777; border:1px solid #333345; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">- Shift</button>
    </div>

    <div class="word-editor-list-below">
  `;

  activeWordsData.forEach((w, index) => {
    const isSelected = selectedTimestampIndices.includes(index);
    html += `
      <div id="word-row-${index}" class="word-editor-row ${isSelected ? 'selected' : ''}" style="display:flex; flex-direction:column; gap:4px; background:#121218; padding:8px; border-radius:4px; border:1px solid ${isSelected ? '#00e5ff' : '#1a1a24'}; margin-bottom: 8px;">
        <div style="display:flex; align-items:center; gap:6px; flex-wrap: wrap;">
          <input type="checkbox" onchange="toggleTimestampSelection(${index})" ${isSelected ? 'checked' : ''} style="cursor:pointer;">
          <input type="text" value="${w.word.trim()}" onchange="updateWordData(${index}, 'word', this.value)" style="flex:2; min-width:100px; padding:4px; font-size:0.75rem; background:#09090c; border:1px solid #22222a; color:#fff; border-radius:3px;">
          <input type="number" step="0.1" value="${parseFloat(w.start).toFixed(2)}" onchange="updateWordData(${index}, 'start', parseFloat(this.value))" style="width:50px; padding:4px; font-size:0.75rem; background:#09090c; border:1px solid #22222a; color:#fff; border-radius:3px;">
          <span style="font-size:0.7rem; color:#8a8a98;">-</span>
          <input type="number" step="0.1" value="${parseFloat(w.end).toFixed(2)}" onchange="updateWordData(${index}, 'end', parseFloat(this.value))" style="width:50px; padding:4px; font-size:0.75rem; background:#09090c; border:1px solid #22222a; color:#fff; border-radius:3px;">

          <button onclick="duplicateWordData(${index})" title="Duplicate word" style="background:#1a3a2a; color:#00ffcc; border:1px solid #2a5a3a; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">📋</button>
          <button onclick="deleteWordData(${index})" style="background:#3a1a1a; color:#ff7777; border:1px solid #5a2a2a; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">✕</button>
        </div>
        <div style="display:flex; align-items:center; gap:8px; font-size:0.7rem; color:#8a8a98; flex-wrap: wrap;">
          <span>Abs X:</span>
          <input type="number" id="absX_${index}" step="1" value="${w.absX || 0}" oninput="updateWordAbsolutePosition(${index}, 'absX', parseFloat(this.value))" style="width:55px; padding:2px; font-size:0.7rem; background:#09090c; border:1px solid #22222a; color:#fff; border-radius:3px;">
          <span>Abs Y:</span>
          <input type="number" id="absY_${index}" step="1" value="${w.absY || 0}" oninput="updateWordAbsolutePosition(${index}, 'absY', parseFloat(this.value))" style="width:55px; padding:2px; font-size:0.7rem; background:#09090c; border:1px solid #22222a; color:#fff; border-radius:3px;">
          <button onclick="resetWordPosition(${index})" style="background:#222230; color:#aaa; border:1px solid #333345; padding:2px 8px; border-radius:3px; cursor:pointer; font-size:0.65rem; margin-left:auto;">Reset Pos</button>
        </div>
      </div>
    `;
  });

  html += `</div>`;

  editorContent.innerHTML = html;

  // Force the browser to recalculate the layout/scroll height immediately
  void editorContent.offsetHeight;

  editorContent.scrollTop = 0;
}

function updateActiveWordHighlight(currentTime) {
  // 1. Remove 'active' class from all rows
  document.querySelectorAll('.word-editor-row').forEach(el => el.classList.remove('active'));

  if (!activeWordsData || activeWordsData.length === 0) return;

  // 2. Find the currently active word
  let activeIndex = -1;
  for (let i = 0; i < activeWordsData.length; i++) {
    const w = activeWordsData[i];
    const start = parseFloat(w.start);
    const end = parseFloat(w.end);

    if (currentTime >= start && currentTime <= end) {
      activeIndex = i;
      break;
    }
  }

  // 3. Apply 'active' class to the matching row
  if (activeIndex !== -1) {
    const row = document.getElementById(`word-row-${activeIndex}`);
    if (row) {
      row.classList.add('active');
    }
  }
}
