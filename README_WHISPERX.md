# WhisperX Integration Guide

This project now supports two AI transcription modes for audio files:

## 1. Groq Whisper (Cloud API) - Default
- **Fast cloud-based transcription**
- Requires a Groq API key in the `api` file
- No server setup needed
- Works directly from the browser

## 2. WhisperX (Local Server) - NEW!
- **Local processing with your own hardware**
- No API costs
- Better privacy (audio never leaves your machine)
- Requires Python server to be running

### Setup Instructions for WhisperX Mode

#### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

Note: WhisperX requires PyTorch with CUDA support for GPU acceleration. For CPU-only mode, it will work but slower.

#### Step 2: Create the API File (Optional for WhisperX)
For Groq mode, create an `api` file with your Groq API key:
```bash
echo "your-groq-api-key-here" > api
```

For WhisperX mode, this file is not required.

#### Step 3: Start the Flask Server
```bash
python server.py
```

The server will start on `http://localhost:5000`

#### Step 4: Configure Environment Variables (Optional)
```bash
export WHISPERX_MODEL=base  # Options: tiny, base, small, medium, large-v2, large-v3
export PORT=5000
export DEBUG=true
```

#### Step 5: Use the Web Interface
1. Open your browser to `http://localhost:5000`
2. In the sidebar, select **"WhisperX (Local Server)"** from the Transcription Model dropdown
3. Upload your audio file
4. Click "Sync Audio & Transcribe"

### Supported Audio Formats
- MP3
- WAV
- OGG
- M4A
- FLAC
- WebM

### Troubleshooting

**Error: "WhisperX not installed"**
- Make sure you ran `pip install -r requirements.txt`
- Check that whisperx is installed: `pip show whisperx`

**Error: "CUDA out of memory"**
- Try a smaller model: `export WHISPERX_MODEL=tiny`
- Or use CPU mode by ensuring no CUDA-capable GPU is detected

**Server won't start**
- Check if port 5000 is already in use
- Try: `export PORT=8080 && python server.py`

**Transcription is slow**
- GPU acceleration recommended for WhisperX
- Install PyTorch with CUDA: `pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118`

### Architecture

```
┌─────────────────┐
│   Browser UI    │
│  (index.html)   │
└────────┬────────┘
         │
         │ Select Mode
         ▼
┌─────────────────┐
│  audio.js       │
│  - Groq API     │
│  - WhisperX API │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌────────────────┐ ┌──────────────────┐
│ Groq Cloud API │ │ Flask Server     │
│ (HTTPS)        │ │ (server.py)      │
└────────────────┘ │    └──────────┐  │
                   │               ▼  │
                   │      ┌─────────────────┐
                   │      │  WhisperX Model │
                   │      │  (Local Python) │
                   │      └─────────────────┘
                   └──────────────────┘
```

### Code Changes Summary

1. **index.html**: Added transcription mode selector dropdown
2. **config.js**: Added `transcriptionModeSelect` reference
3. **audio.js**: 
   - Added `transcribeWithWhisperX()` function
   - Modified process button handler to check mode selection
4. **server.py**: New Flask server with `/transcribe` endpoint
5. **requirements.txt**: Python dependencies

### Future Enhancements

- [ ] Add model size selector in UI
- [ ] Show GPU/CPU status indicator
- [ ] Add batch processing for multiple files
- [ ] Support for speaker diarization
- [ ] Progress bar with actual transcription progress
