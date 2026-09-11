/* ==========================================================================
   timestamp-editor.js — Bottom "Synced Words & Positions" editor UI
   ========================================================================== */

// Store selected word indices for batch operations
let selectedTimestampIndices = [];

// --- Timestamp Selection Functions ---
window.toggleTimestampSelection = function(index, event) {
  // Prevent scrolling to top when checkbox is clicked
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  const pos = selectedTimestampIndices.indexOf(index);
  if (pos === -1) {
    selectedTimestampIndices.push(index);
  } else {
    selectedTimestampIndices.splice(pos, 1);
  }
  
  // Sync selection with canvas
  selectedWordIndices = [...selectedTimestampIndices];
  isAllSelected = selectedTimestampIndices.length === activeWordsData.length;
  
  renderTimestampEditorUI();
  drawFrameAtCurrentTime();
};

window.selectAllTimestamps = function() {
  selectedTimestampIndices = activeWordsData.map((_, i) => i);
  renderTimestampEditorUI();
  // Also sync with canvas selection
  selectedWordIndices = [...selectedTimestampIndices];
  drawFrameAtCurrentTime();
};

window.deselectAllTimestamps = function() {
  selectedTimestampIndices = [];
  renderTimestampEditorUI();
  // Also sync with canvas selection
  selectedWordIndices = [];
  isAllSelected = false;
  drawFrameAtCurrentTime();
};

window.batchShiftTimestamps = function(direction) {
  if (selectedTimestampIndices.length === 0) {
    alert('No words selected. Use the checkboxes to select words first.');
    return;
  }
  
  const shiftInput = document.getElementById('batchShiftAmountInput');
  const amount = (parseFloat(shiftInput.value) || 0.1) * direction;
  
  if (amount === 0) return;
  
  selectedTimestampIndices.forEach(index => {
    const w = activeWordsData[index];
    w.start = Math.max(0, parseFloat((w.start + amount).toFixed(2)));
    w.end = Math.max(0.1, parseFloat((w.end + amount).toFixed(2)));
  });
  
  saveState();
  renderTimestampEditorUI();
  buildWordStructuresFromAudio(activeWordsData);
  drawFrameAtCurrentTime();
  
  // Save the shift amount to localStorage for persistence
  localStorage.setItem('batchShiftAmount', Math.abs(amount).toFixed(2));
};

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
    <!-- Combined Timestamp Controls Container -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:8px; background:#0e0e14; padding:8px; border-radius:4px; border:1px solid #22222a; font-size:0.75rem; color:#aaa; margin-bottom: 12px;">
      <!-- Shift All Times -->
      <div style="display:flex; align-items:center; gap:6px; flex-wrap: wrap;">
        <span title="Shift all timestamps by specified amount">Shift All:</span>
        <input type="number" id="shiftAmountInput" value="0.5" step="0.1" style="width:45px; padding:2px 4px; font-size:0.75rem; background:#09090c; border:1px solid #333; color:#fff; border-radius:3px;">
        <span>s</span>
        <button onclick="shiftAllTimestamps(1)" title="Shift all times forward" style="background:#222230; color:#00e5ff; border:1px solid #333345; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">+</button>
        <button onclick="shiftAllTimestamps(-1)" title="Shift all times backward" style="background:#222230; color:#ff7777; border:1px solid #333345; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">-</button>
        <button onclick="applyTimestampEdits()" class="btn-primary" title="Apply changes and sort timestamps" style="margin-left:auto; padding:4px 12px; font-size:0.7rem; background:#8a2be2; color:#fff;">Apply & Sort</button>
      </div>
      
      <!-- Timestamp Step -->
      <div style="display:flex; align-items:center; gap:6px; flex-wrap: wrap;">
        <span title="Increment step for timestamp arrow keys">Step:</span>
        <input type="number" id="timestampStepInput" value="0.1" step="0.05" min="0.01" onchange="updateTimestampSteps()" style="width:50px; padding:2px 4px; font-size:0.75rem; background:#09090c; border:1px solid #333; color:#fff; border-radius:3px;">
        <span>s</span>
      </div>
      
      <!-- Selection Controls -->
      <div style="display:flex; align-items:center; gap:6px; flex-wrap: wrap;">
        <span title="Select or deselect all words">Select:</span>
        <button onclick="selectAllTimestamps()" title="Select all words" style="background:#222230; color:#00e5ff; border:1px solid #333345; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">All</button>
        <button onclick="deselectAllTimestamps()" title="Deselect all words" style="background:#222230; color:#aaa; border:1px solid #333345; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">None</button>
        <span style="margin-left:auto;" id="selectedCountDisplay">0 selected</span>
      </div>
      
      <!-- Batch Shift Selected -->
      <div style="display:flex; align-items:center; gap:6px; flex-wrap: wrap;">
        <span title="Shift only selected words">Batch Shift:</span>
        <input type="number" id="batchShiftAmountInput" value="${localStorage.getItem('batchShiftAmount') || '0.1'}" step="0.05" style="width:45px; padding:2px 4px; font-size:0.75rem; background:#09090c; border:1px solid #333; color:#fff; border-radius:3px;">
        <span>s</span>
        <button onclick="batchShiftTimestamps(1)" title="Shift selected words forward" style="background:#222230; color:#00e5ff; border:1px solid #333345; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">+</button>
        <button onclick="batchShiftTimestamps(-1)" title="Shift selected words backward" style="background:#222230; color:#ff7777; border:1px solid #333345; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">-</button>
      </div>
    </div>

    <div class="word-editor-list-below">
  `;

  activeWordsData.forEach((w, index) => {
    const isSelected = selectedTimestampIndices.includes(index);
    html += `
      <div id="word-row-${index}" class="word-editor-row ${isSelected ? 'selected' : ''}" style="display:flex; flex-direction:column; gap:4px; background:#121218; padding:8px; border-radius:4px; border:1px solid ${isSelected ? '#00e5ff' : '#1a1a24'}; margin-bottom: 8px;">
        <div style="display:flex; align-items:center; gap:6px; flex-wrap: wrap;">
          <input type="checkbox" data-index="${index}" ${isSelected ? 'checked' : ''} style="cursor:pointer;">
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

  // Attach checkbox listeners to prevent scroll jumping
  const checkboxes = editorContent.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const index = parseInt(cb.getAttribute('data-index'));
      toggleTimestampSelection(index, e);
    });
  });
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
