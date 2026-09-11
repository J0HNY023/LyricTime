# Minimalist Per-Word Dust Dissolve Animation with Speech Recognition

A web-based tool for creating synchronized word-by-word text animations with audio, featuring real-time speech recognition and multiple visual effects.

## Features

### Core Functionality
- **Per-Word Animation**: Each word animates independently with precise timing synchronization
- **Audio Integration**: Upload audio files and automatically generate word-level timestamps
- **Speech Recognition**: Live microphone input with Groq Whisper integration for transcription
- **Timeline Controls**: Full audio playback controls with scrubbing and loop functionality

### Visual Effects
- **Multiple Text Effects**:
  - Dust Dissolve (default)
  - RGB Glitch
  - Blur Fade
  - Sine Wave
  - Typewriter
  - Glitch Stack (Anaglyph)
  - Cinematic Glitch (Advanced)

### Layout Modes
- **Standard**: Top-down text layout
- **Subtitle**: Bottom-anchored experimental mode
- **Focused Center**: 3-line centered layout

### Customization Options
- Font style selection (8 options including Serif, Sans-Serif, Monospace, Impact)
- Font scale adjustment (0.5x - 2.0x)
- Letter spacing/tracking control
- Word gap adjustment
- Text stagger delay
- Word duration timing
- Fade out delay
- Upward drift speed
- Auto-align to canvas
- Capitalize all text option
- Debug mode with grid overlay

## Project Structure

```
├── index.html              # Main HTML file with UI structure
├── css/
│   └── Lstyle.css         # All styling and layout CSS
└── js/
    ├── config.js          # Configuration constants
    ├── state.js           # Application state management
    ├── utils.js           # Utility functions
    ├── canvas.js          # Canvas rendering logic
    ├── audio.js           # Audio handling and timeline
    ├── text-effects.js    # Visual text effect implementations
    ├── layouts.js         # Layout mode handlers
    ├── word-manager.js    # Word chip and text management
    ├── timestamp-editor.js # Synced words editor UI
    ├── storage.js         # Local storage persistence
    ├── ui-handlers.js     # UI event handlers
    └── main.js            # Main initialization and entry point
```

## Usage

1. **Open** `index.html` in a modern web browser
2. **Upload Audio**: Use the "Groq Whisper Sync" section to upload an audio file
3. **Sync & Transcribe**: Click "Sync Audio & Transcribe" to generate word timestamps
4. **Customize**: Adjust typography, effects, and layout using the right sidebar controls
5. **Edit Timestamps**: Expand the bottom editor to fine-tune word timing if needed
6. **Playback**: Use the timeline controls to preview your animation

### Live Microphone Input
- Click "🎙️ Live Mic" to enable speech recognition
- Speak while referencing lyrics/prompt text in the input field
- Word chips will appear showing recognized words

### Prompt Text Feature
- Paste reference lyrics or text (max 896 characters, ~150-180 words)
- Used for Grok transcription guidance
- Word chips display below the input for visual reference

## Technical Details

- **Pure Vanilla JavaScript**: No frameworks or build tools required
- **HTML5 Canvas**: High-performance rendering for animations
- **Web Audio API**: Precise audio timing and playback control
- **LocalStorage**: Settings and state persist between sessions
- **Responsive Design**: Sidebar is resizable, canvas adapts to viewport

## Browser Compatibility

Requires a modern browser with support for:
- HTML5 Canvas
- Web Audio API
- File API
- LocalStorage
- Speech Recognition API (optional, for mic feature)

Tested on Chrome, Firefox, and Edge.

## License

This project is provided as-is for educational and creative purposes.
