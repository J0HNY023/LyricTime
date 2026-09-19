/* ==========================================================================
   timestamp-editor.js — Bottom "Synced Words & Positions" editor UI
   ========================================================================== */

// Store selected word indices for batch operations
let selectedTimestampIndices = [];

// Track first selected index for shift-click range selection
let firstSelectedIndex = null;

// --- Timestamp Selection Functions ---
window.toggleTimestampSelection = function(index, event, isShiftKey = false) {
  // Prevent scrolling to top when checkbox is clicked
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // Handle Shift+Click for range selection
  if (isShiftKey && firstSelectedIndex !== null) {
    const start = Math.min(firstSelectedIndex, index);
    const end = Math.max(firstSelectedIndex, index);
    
    // Add all indices in range to selection
    for (let i = start; i <= end; i++) {
      if (!selectedTimestampIndices.includes(i)) {
        selectedTimestampIndices.push(i);
      }
    }
  } else {
    // Normal toggle behavior
    const pos = selectedTimestampIndices.indexOf(index);
    if (pos === -1) {
      selectedTimestampIndices.push(index);
      // Set first selected index if this is the first selection
      if (selectedTimestampIndices.length === 1) {
        firstSelectedIndex = index;
      }
    } else {
      selectedTimestampIndices.splice(pos, 1);
      // Reset firstSelectedIndex if we deselected it or if selection is empty
      if (selectedTimestampIndices.length === 0) {
        firstSelectedIndex = null;
      } else if (firstSelectedIndex === index) {
        firstSelectedIndex = selectedTimestampIndices[0];
      }
    }
  }
  
  // Sync selection with canvas
  selectedWordIndices = [...selectedTimestampIndices];
  isAllSelected = selectedTimestampIndices.length === activeWordsData.length;
  
  renderTimestampEditorUI();
  if (typeof drawFrameAtCurrentTime === 'function') drawFrameAtCurrentTime();
};

window.selectAllTimestamps = function() {
  selectedTimestampIndices = activeWordsData.map((_, i) => i);
  renderTimestampEditorUI();
  // Also sync with canvas selection
  selectedWordIndices = [...selectedTimestampIndices];
  if (typeof drawFrameAtCurrentTime === 'function') drawFrameAtCurrentTime();
};

window.deselectAllTimestamps = function() {
  selectedTimestampIndices = [];
  renderTimestampEditorUI();
  // Also sync with canvas selection
  selectedWordIndices = [];
  isAllSelected = false;
  if (typeof drawFrameAtCurrentTime === 'function') drawFrameAtCurrentTime();
};

window.downloadTimestamps = function() {
  if (!activeWordsData || activeWordsData.length === 0) {
    alert('No timestamps to export. Please transcribe audio first.');
    return;
  }
  
  const jsonData = JSON.stringify(activeWordsData, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'word-timestamps.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

window.batchShiftTimestamps = function(direction) {
  if (selectedTimestampIndices.length === 0) {
    alert('No words selected. Use the checkboxes to select words first.');
    return;
  }
  
  const shiftInput = document.getElementById('batchShiftAmountInput');
  const amount = (parseFloat(shiftInput.value) || 0.1) * direction;
  
  if (amount === 0) return;
  
  pushToUndoStack();
  
  selectedTimestampIndices.forEach(index => {
    const w = activeWordsData[index];
    w.start = Math.max(0, parseFloat((w.start + amount).toFixed(2)));
    w.end = Math.max(0.1, parseFloat((w.end + amount).toFixed(2)));
  });
  
  saveState();
  renderTimestampEditorUI();
  if (typeof buildWordStructuresFromAudio === 'function') buildWordStructuresFromAudio(activeWordsData);
  if (typeof drawFrameAtCurrentTime === 'function') drawFrameAtCurrentTime();
  
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
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:6px; background:#0e0e14; padding:6px; border-radius:4px; border:1px solid #22222a; font-size:0.7rem; color:#aaa; margin-bottom: 10px;">
      <!-- Shift All Times -->
      <div style="display:flex; align-items:center; gap:4px; flex-wrap: wrap;">
        <span title="Shift all timestamps by specified amount">All:</span>
        <input type="number" id="shiftAmountInput" value="${localStorage.getItem('shiftAllAmount') || '0.5'}" step="0.1" style="width:40px; padding:2px 3px; font-size:0.7rem; background:#09090c; border:1px solid #333; color:#fff; border-radius:3px;">
        <span>s</span>
        <button onclick="shiftAllTimestamps(1)" title="Shift all times forward" style="background:#222230; color:#00e5ff; border:1px solid #333345; padding:3px 6px; border-radius:3px; cursor:pointer; font-size:0.65rem;">+</button>
        <button onclick="shiftAllTimestamps(-1)" title="Shift all times backward" style="background:#222230; color:#ff7777; border:1px solid #333345; padding:3px 6px; border-radius:3px; cursor:pointer; font-size:0.65rem;">-</button>
      </div>
      
      <!-- Timestamp Step -->
      <div style="display:flex; align-items:center; gap:4px; flex-wrap: wrap;">
        <span title="Increment step for timestamp arrow keys">Step:</span>
        <input type="number" id="timestampStepInput" value="0.1" step="0.05" min="0.01" onchange="updateTimestampSteps()" style="width:45px; padding:2px 3px; font-size:0.7rem; background:#09090c; border:1px solid #333; color:#fff; border-radius:3px;">
        <span>s</span>
      </div>
      
      <!-- Selection Controls -->
      <div style="display:flex; align-items:center; gap:4px; flex-wrap: wrap;">
        <span title="Select or deselect all words">Sel:</span>
        <button onclick="selectAllTimestamps()" title="Select all words" style="background:#222230; color:#00e5ff; border:1px solid #333345; padding:3px 6px; border-radius:3px; cursor:pointer; font-size:0.65rem;">All</button>
        <button onclick="deselectAllTimestamps()" title="Deselect all words" style="background:#222230; color:#aaa; border:1px solid #333345; padding:3px 6px; border-radius:3px; cursor:pointer; font-size:0.65rem;">None</button>
        <span style="margin-left:auto;" id="selectedCountDisplay">0 sel</span>
      </div>
      
      <!-- Batch Shift Selected -->
      <div style="display:flex; align-items:center; gap:4px; flex-wrap: wrap;">
        <span title="Shift only selected words">Batch:</span>
        <input type="number" id="batchShiftAmountInput" value="${localStorage.getItem('batchShiftAmount') || '0.1'}" step="0.05" style="width:40px; padding:2px 3px; font-size:0.7rem; background:#09090c; border:1px solid #333; color:#fff; border-radius:3px;">
        <span>s</span>
        <button onclick="batchShiftTimestamps(1)" title="Shift selected words forward" style="background:#222230; color:#00e5ff; border:1px solid #333345; padding:3px 6px; border-radius:3px; cursor:pointer; font-size:0.65rem;">+</button>
        <button onclick="batchShiftTimestamps(-1)" title="Shift selected words backward" style="background:#222230; color:#ff7777; border:1px solid #333345; padding:3px 6px; border-radius:3px; cursor:pointer; font-size:0.65rem;">-</button>
        <button onclick="applyTimestampEdits()" class="btn-primary" title="Apply changes and sort timestamps" style="margin-left:auto; padding:3px 8px; font-size:0.65rem; background:#8a2be2; color:#fff;">Apply</button>
      </div>
    </div>

    <!-- Line Breaks Reference Editor -->
    <div style="background:#0e0e14; padding:8px; border-radius:4px; border:1px solid #22222a; margin-bottom: 10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:0.75rem; color:#00e5ff; font-weight:bold;" title="Define line breaks for word batches. Each line represents a batch of words displayed together.">📝 LINE BREAKS REFERENCE</span>
        <button onclick="syncLineBreaksToWords()" class="btn-primary" title="Apply line breaks to word positions" style="padding:4px 10px; font-size:0.7rem; background:#00aa88; color:#fff;">Sync to Words</button>
      </div>
      <textarea id="lineBreaksEditor" rows="4" placeholder="Enter lyrics with line breaks&#10;Each line defines a batch of words&#10;Example:&#10;Hello world this is line one&#10;This is the second line&#10;And this is line three" style="width:100%; padding:8px; font-size:0.75rem; background:#09090c; border:1px solid #22222a; color:#fff; border-radius:3px; font-family:monospace; resize:vertical;" oninput="saveLineBreaksToStorage()"></textarea>
      <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:0.65rem; color:#8a8a98;">
        <span id="lineBreaksStatus">Lines: 0 | Words: 0</span>
        <button onclick="loadLineBreaksFromWords()" title="Generate line breaks from current word order" style="background:#222230; color:#aaa; border:1px solid #333345; padding:2px 8px; border-radius:3px; cursor:pointer; font-size:0.65rem;">Load from Words</button>
      </div>
    </div>

    <div class="word-editor-list-below">
  `;

  activeWordsData.forEach((w, index) => {
    const isSelected = selectedTimestampIndices.includes(index);
    html += `
      <div id="word-row-${index}" class="word-editor-row ${isSelected ? 'selected' : ''}" style="display:flex; flex-direction:column; gap:4px; background:#121218; padding:8px; border-radius:4px; border:1px solid ${isSelected ? '#00e5ff' : '#1a1a24'}; margin-bottom: 8px;">
        <div style="display:flex; align-items:center; gap:6px; flex-wrap: wrap;">
          <input type="checkbox" data-index="${index}" ${isSelected ? 'checked' : ''} class="theme-checkbox" style="cursor:pointer;">
          <span style="font-size:0.7rem; color:#aaa; min-width:24px;">${index}</span>
          <input type="text" value="${w.word.trim()}" onchange="updateWordData(${index}, 'word', this.value)" oncopy="return false;" oncut="return false;" style="flex:1; min-width:60px; max-width:120px; padding:4px; font-size:0.75rem; background:#09090c; border:1px solid #22222a; color:#fff; border-radius:3px;">
          <input type="number" step="0.1" value="${parseFloat(w.start).toFixed(2)}" onchange="updateWordData(${index}, 'start', parseFloat(this.value))" oncopy="return false;" oncut="return false;" style="width:50px; padding:4px; font-size:0.75rem; background:#09090c; border:1px solid #22222a; color:#fff; border-radius:3px;">
          <span style="font-size:0.7rem; color:#8a8a98;">-</span>
          <input type="number" step="0.1" value="${parseFloat(w.end).toFixed(2)}" onchange="updateWordData(${index}, 'end', parseFloat(this.value))" oncopy="return false;" oncut="return false;" style="width:50px; padding:4px; font-size:0.75rem; background:#09090c; border:1px solid #22222a; color:#fff; border-radius:3px;">

          <button onclick="duplicateWordData(${index})" title="Duplicate word" style="background:#1a3a2a; color:#00ffcc; border:1px solid #2a5a3a; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">📋</button>
          <button onclick="deleteWordData(${index})" style="background:#3a1a1a; color:#ff7777; border:1px solid #5a2a2a; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.7rem;">✕</button>
        </div>
        <div style="display:flex; align-items:center; gap:8px; font-size:0.7rem; color:#8a8a98; flex-wrap: wrap;">
          <span>Abs X:</span>
          <input type="number" id="absX_${index}" step="1" value="${w.absX || 0}" oninput="updateWordAbsolutePosition(${index}, 'absX', parseFloat(this.value))" oncopy="return false;" oncut="return false;" style="width:55px; padding:2px; font-size:0.7rem; background:#09090c; border:1px solid #22222a; color:#fff; border-radius:3px;">
          <span>Abs Y:</span>
          <input type="number" id="absY_${index}" step="1" value="${w.absY || 0}" oninput="updateWordAbsolutePosition(${index}, 'absY', parseFloat(this.value))" oncopy="return false;" oncut="return false;" style="width:55px; padding:2px; font-size:0.7rem; background:#09090c; border:1px solid #22222a; color:#fff; border-radius:3px;">
          <button onclick="resetWordPosition(${index})" style="background:#222230; color:#aaa; border:1px solid #333345; padding:2px 8px; border-radius:3px; cursor:pointer; font-size:0.65rem; margin-left:auto;">Reset Pos</button>
        </div>
      </div>
    `;
  });

  html += `</div>`;

  editorContent.innerHTML = html;

  // Restore scroll position for timestamp editor
  const savedEditorScroll = localStorage.getItem('timestamp_editor_scroll_position');
  if (savedEditorScroll !== null && editorContent) {
    editorContent.scrollTop = parseInt(savedEditorScroll, 10);
  }

  // Attach row click listeners for selection (without needing checkbox toggle)
  const rows = editorContent.querySelectorAll('.word-editor-row');
  rows.forEach(row => {
    row.addEventListener('click', (e) => {
      // Don't trigger if clicking on interactive elements
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      
      const index = parseInt(row.id.replace('word-row-', ''));
      toggleTimestampSelection(index, e, e.shiftKey);
    });
  });

  // Attach checkbox listeners to prevent scroll jumping
  const checkboxes = editorContent.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Prevent scrolling when checkbox is clicked
      const row = cb.closest('.word-editor-row');
      if (row) {
        row.scrollIntoView({ behavior: 'auto', block: 'nearest' });
      }
      const index = parseInt(cb.getAttribute('data-index'));
      toggleTimestampSelection(index, e, e.shiftKey);
    });
  });
  
  // Save scroll position on scroll
  editorContent.addEventListener('scroll', () => {
    localStorage.setItem('timestamp_editor_scroll_position', editorContent.scrollTop.toString());
  });
  
  // Initialize line breaks editor after rendering
  setTimeout(() => {
    initLineBreaksEditor();
  }, 100);
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

// --- Line Breaks Reference Editor Functions ---

window.saveLineBreaksToStorage = function() {
  const textarea = document.getElementById('lineBreaksEditor');
  if (!textarea) return;
  
  const text = textarea.value;
  localStorage.setItem('lyrics_line_breaks', text);
  updateLineBreaksStatus();
};

window.loadLineBreaksFromWords = function() {
  if (!activeWordsData || activeWordsData.length === 0) {
    alert('No words available. Please transcribe audio first.');
    return;
  }
  
  // Generate line breaks from current word order (one word per line as default)
  const lines = activeWordsData.map(w => w.word.trim()).join('\n');
  
  const textarea = document.getElementById('lineBreaksEditor');
  if (textarea) {
    textarea.value = lines;
    saveLineBreaksToStorage();
  }
};

window.syncLineBreaksToWords = function() {
  const textarea = document.getElementById('lineBreaksEditor');
  if (!textarea || !textarea.value.trim()) {
    alert('Please enter line breaks in the text area first.');
    return;
  }
  
  if (!activeWordsData || activeWordsData.length === 0) {
    alert('No words available. Please transcribe audio first.');
    return;
  }
  
  // Parse lines from textarea
  const lines = textarea.value.split('\n').filter(line => line.trim() !== '');
  
  // Extract words from each line
  const lineWordArrays = lines.map(line => line.trim().split(/\s+/).filter(w => w.length > 0));
  
  // Flatten to get all words in order
  const allLineWords = lineWordArrays.flat();
  
  // Check if word count matches
  if (allLineWords.length !== activeWordsData.length) {
    const confirmMsg = `Warning: Line breaks contain ${allLineWords.length} words, but you have ${activeWordsData.length} timestamped words.\n\nDo you want to proceed anyway? This may cause mismatches.`;
    if (!confirm(confirmMsg)) {
      return;
    }
  }
  
  pushToUndoStack();
  
  // Update word data based on line breaks
  let wordIndex = 0;
  lineWordArrays.forEach((lineWords, lineIndex) => {
    lineWords.forEach((lineWord, wordInLineIndex) => {
      if (wordIndex < activeWordsData.length) {
        // Update the word text to match the line break definition
        activeWordsData[wordIndex].word = lineWord;
        
        // Mark this word with its line number for batch positioning
        activeWordsData[wordIndex].lineIndex = lineIndex;
        
        wordIndex++;
      }
    });
  });
  
  saveState();
  renderTimestampEditorUI();
  if (typeof buildWordStructuresFromAudio === 'function') buildWordStructuresFromAudio(activeWordsData);
  if (typeof drawFrameAtCurrentTime === 'function') drawFrameAtCurrentTime();
  
  alert(`Successfully synced ${wordIndex} words to ${lines.length} lines.`);
};

function updateLineBreaksStatus() {
  const textarea = document.getElementById('lineBreaksEditor');
  const statusEl = document.getElementById('lineBreaksStatus');
  
  if (!textarea || !statusEl) return;
  
  const text = textarea.value;
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  
  statusEl.textContent = `Lines: ${lines.length} | Words: ${text.trim() ? words.length : 0}`;
}

function initLineBreaksEditor() {
  // Load saved line breaks from localStorage
  const savedLineBreaks = localStorage.getItem('lyrics_line_breaks');
  const textarea = document.getElementById('lineBreaksEditor');
  
  if (textarea && savedLineBreaks) {
    textarea.value = savedLineBreaks;
  }
  
  updateLineBreaksStatus();
}
