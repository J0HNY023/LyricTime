/* ==========================================================================
   audio.js — Audio playback, timeline, mic input & Groq Whisper transcription
   ========================================================================== */

// Helper: Fetch API Key
async function getApiKey() {
  try {
    const response = await fetch('./api');
    if (!response.ok) throw new Error('Could not read "api" file in directory.');
    const key = await response.text();
    return key.trim();
  } catch (err) {
    throw new Error('Failed to fetch API key from "./api". Ensure file exists.');
  }
}

// --- Web Speech Recognition Integration ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    micBtn.textContent = '🛑 Stop Mic';
    micStatus.textContent = 'Listening...';
    micStatus.style.color = '#00e5ff';
  };

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    textInput.value = transcript;
    saveState();
    isAudioSyncMode = false;
    startAnimation();
  };

  recognition.onerror = (event) => {
    micStatus.textContent = 'Error: ' + event.error;
    stopListening();
  };

  recognition.onend = () => { stopListening(); };
} else {
  micBtn.disabled = true;
  micStatus.textContent = 'Speech API Unsupported';
}

function toggleListening() {
  if (!recognition) return;
  if (isListening) {
    recognition.stop();
  } else {
    if (!audioElement.paused) audioElement.pause();
    recognition.start();
  }
}

function stopListening() {
  isListening = false;
  micBtn.classList.remove('listening');
  micBtn.textContent = '🎙️ Live Mic';
  micStatus.textContent = 'Mic Idle';
  micStatus.style.color = '#8a8a98';
}

micBtn.addEventListener('click', toggleListening);

// --- Loop Toggle ---
function updateLoopButtonUI() {
  if (isLooping) {
    loopBtn.style.background = '#00e5ff';
    loopBtn.style.color = '#000';
    loopBtn.style.borderColor = '#00e5ff';
  } else {
    loopBtn.style.background = '#22222a';
    loopBtn.style.color = '#fff';
    loopBtn.style.borderColor = '#333342';
  }
}

loopBtn.addEventListener('click', () => {
  isLooping = !isLooping;
  updateLoopButtonUI();
  saveState();
});

// --- Timeline Controls ---
playPauseBtn.addEventListener('click', async () => {
  if (audioElement.paused) {
    try {
      await audioElement.play();
      playPauseBtn.textContent = '❚❚';
      animationFrame = requestAnimationFrame(animate);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        console.warn('Playback requires user interaction first.');
      } else {
        console.error('Play error:', err);
      }
    }
  } else {
    audioElement.pause();
    playPauseBtn.textContent = '▶';
  }
});

timelineSlider.addEventListener('input', () => {
  isSeeking = true;
  if (audioElement.duration) {
    const seekTime = (timelineSlider.value / 100) * audioElement.duration;
    timeDisplay.textContent = `${formatTime(seekTime)} / ${formatTime(audioElement.duration)}`;

    audioElement.currentTime = seekTime;
    updateActiveWordHighlight(seekTime);
    drawFrameAtCurrentTime();
  }
});

timelineSlider.addEventListener('change', () => {
  if (audioElement.duration) {
    audioElement.currentTime = (timelineSlider.value / 100) * audioElement.duration;
  }
  isSeeking = false;
  if (!audioElement.paused) {
    animationFrame = requestAnimationFrame(animate);
  } else {
    drawFrameAtCurrentTime();
  }
});

audioElement.addEventListener('timeupdate', () => {
  if (!isSeeking && audioElement.duration) {
    timelineSlider.value = (audioElement.currentTime / audioElement.duration) * 100;
    timeDisplay.textContent = `${formatTime(audioElement.currentTime)} / ${formatTime(audioElement.duration)}`;
  }
});

audioElement.addEventListener('ended', async () => {
  if (isLooping && isAudioSyncMode) {
    audioElement.currentTime = 0;
    try {
      await audioElement.play();
      playPauseBtn.textContent = '❚❚';
      animationFrame = requestAnimationFrame(animate);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        console.warn('Autoplay on loop requires user interaction.');
      } else {
        console.error('Play error on loop:', err);
      }
    }
  } else {
    playPauseBtn.textContent = '▶';
  }
});

// --- XMLHttpRequest with Forced Text Alignment & Progress ---
function transcribeAudioWithProgress(file, apiKey) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append('file', file);
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');

    const exactTextPrompt = textInput.value.trim();
    if (exactTextPrompt) {
      formData.append('prompt', exactTextPrompt);
    }

    let processInterval;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const uploadPercent = Math.round((e.loaded / e.total) * 50);
        progressBar.style.width = `${uploadPercent}%`;
        progressText.textContent = `${uploadPercent}%`;
        if (uploadPercent >= 50) {
          progressTitle.textContent = 'Processing Audio with Groq Whisper...';
        }
      }
    };

    xhr.onload = () => {
      clearInterval(processInterval);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          progressBar.style.width = '100%';
          progressText.textContent = '100%';
          resolve(data.words);
        } catch (e) {
          reject(new Error('Invalid JSON response from Groq API.'));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || 'Transcription failed.'));
        } catch (e) {
          reject(new Error(`Server returned status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      clearInterval(processInterval);
      reject(new Error('Network error during upload.'));
    };

    xhr.upload.onloadend = () => {
      let simulatedPercent = 50;
      progressTitle.textContent = 'Transcribing Speech to Timestamps...';
      processInterval = setInterval(() => {
        if (simulatedPercent < 95) {
          simulatedPercent += Math.floor(Math.random() * 3) + 1;
          progressBar.style.width = `${simulatedPercent}%`;
          progressText.textContent = `${simulatedPercent}%`;
        }
      }, 150);
    };

    xhr.open('POST', 'https://api.groq.com/openai/v1/audio/transcriptions');
    xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
    xhr.send(formData);
  });
}

// --- Audio File Input Handler ---
audioUpload.addEventListener('change', async () => {
  const file = audioUpload.files[0];
  if (file) {
    await saveAudioFileToDB(file);
    const rawAudioUrl = URL.createObjectURL(file);
    audioElement.src = rawAudioUrl;
    audioControls.classList.add('active');
  }
});

processAudioBtn.addEventListener('click', async () => {
  let file = audioUpload.files[0];
  if (!file) {
    file = await loadAudioFileFromDB();
  }

  // VALIDATION: Check prompt length before sending
  const promptText = textInput.value.trim();
  if (promptText.length > MAX_CHARS) {
    alert(`Prompt is too long! ${promptText.length} characters. Maximum is ${MAX_CHARS} characters. Please shorten your text.`);
    return;
  }

  if (!file) return alert('Please upload an audio file.');
  if (isListening) stopListening();

  processAudioBtn.textContent = 'Loading API key...';
  processAudioBtn.disabled = true;

  try {
    const apiKey = await getApiKey();

    if (!apiKey) {
      throw new Error('The "api" file was empty. Please add your key into it.');
    }

    progressOverlay.classList.add('active');
    progressTitle.textContent = 'Uploading Audio...';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';

    processAudioBtn.textContent = 'Transcribing...';

    const wordTimestamps = await transcribeAudioWithProgress(file, apiKey);

    isAudioSyncMode = true;
    saveState();
    resizeCanvas();
    buildWordStructuresFromAudio(wordTimestamps);

    setTimeout(async () => {
      progressOverlay.classList.remove('active');
      audioControls.classList.add('active');
      cancelAnimationFrame(animationFrame);
      audioElement.currentTime = 0;
      try {
        await audioElement.play();
        playPauseBtn.textContent = '❚❚';
        animationFrame = requestAnimationFrame(animate);
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          console.warn('Autoplay after transcription requires user interaction. Click Play to start.');
          playPauseBtn.textContent = '▶';
        } else {
          console.error('Play error after transcription:', err);
        }
      }

      const editorContainer = document.getElementById('timestampEditorContainer');
      if (editorContainer) {
        editorContainer.classList.remove('hidden');

        const toggleBtn = document.getElementById('editorToggleBtn');
        if (toggleBtn) {
          toggleBtn.textContent = '▲ Expand';
        }
      }
    }, 400);

  } catch (err) {
    alert(`Error: ${err.message}`);
    progressOverlay.classList.remove('active');
  } finally {
    processAudioBtn.textContent = 'Sync Audio & Transcribe';
    processAudioBtn.disabled = false;
  }
});
