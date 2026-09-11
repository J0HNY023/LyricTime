<<<<<<< HEAD
# Minimalist Per-Word Dust Dissolve Animation

A web-based tool for creating synchronized word-by-word animation effects with audio transcription support.
=======
# Minimalist Per-Word Dust Dissolve Animation with Speech Recognition

A web-based tool for creating synchronized word-by-word text animations with audio, featuring real-time speech recognition and multiple visual effects.
>>>>>>> 0cfbbcb (Add comprehensive README documentation for web-based text animation tool)

## Features

### Core Functionality
<<<<<<< HEAD
- **Audio Synchronization**: Upload audio files and automatically generate word-level timestamps using Groq Whisper
- **Live Speech Recognition**: Real-time microphone input for transcription guidance
- **Multiple Text Effects**: Choose from 8 different visual effects (Dust Dissolve, RGB Glitch, Blur Fade, etc.)
- **Layout Modes**: Standard, Subtitle, and Focused Center layouts
- **Interactive Canvas**: Drag, resize, rotate, and multi-select words with intuitive controls

### Accessibility Improvements
- ARIA labels on all interactive elements
- Keyboard navigation support (Tab, Enter, Space)
- Screen reader announcements for dynamic content
- Semantic HTML structure

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` or `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Save state |
| `Ctrl+A` | Select/Deselect all words |
| `Space` | Play/Pause audio |
| `Arrow Left/Right` | Scrub timeline |
| `Arrow Keys` | Fine-position selected words |
| `Delete/Backspace` | Remove selected words |
| `Alt+Drag` | Resize words |
| `Ctrl+Alt+Drag` | Rotate words |
| `Ctrl+Drag` | Marquee selection |
=======
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
>>>>>>> 0cfbbcb (Add comprehensive README documentation for web-based text animation tool)

## Project Structure

```
<<<<<<< HEAD
/workspace
├── index.html          # Main HTML file
├── css/
│   └── Lstyle.css      # Stylesheet
└── js/
    ├── config.js       # Configuration & constants
    ├── state.js        # Global state management
    ├── utils.js        # Utility functions
    ├── canvas.js       # Canvas rendering
    ├── main.js         # Core animation loop
    ├── ui-handlers.js  # Event handlers & keyboard shortcuts
    ├── text-effects.js # Visual effect implementations
    ├── layouts.js      # Layout algorithms
    ├── audio.js        # Audio processing
    ├── storage.js      # LocalStorage persistence
    ├── word-manager.js # Word chip management
    └── timestamp-editor.js # Timestamp editing UI
=======
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
>>>>>>> 0cfbbcb (Add comprehensive README documentation for web-based text animation tool)
```

## Usage

<<<<<<< HEAD
1. Open `index.html` in a modern web browser
2. Enter text in the prompt field or use live mic for transcription
3. Upload an audio file (optional) and click "Sync Audio & Transcribe"
4. Adjust typography, effects, and layout settings
5. Use canvas interactions to position words manually
6. Export or save your configuration

## Technical Details

### Performance Optimizations
- Cached computed values (font size, measurements)
- Efficient render loop with requestAnimationFrame
- Dirty-rectangle rendering consideration for future improvements

### Browser Support
- Modern browsers with ES6+ support
- Canvas API
- Web Audio API
- Speech Recognition API (Chrome/Edge recommended)

## Contributing

When making changes:
1. Follow existing code style (camelCase for variables/functions)
2. Add JSDoc comments for new functions
3. Test keyboard accessibility
4. Verify ARIA attributes on new interactive elements
=======
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
>>>>>>> 0cfbbcb (Add comprehensive README documentation for web-based text animation tool)
