# Minimalist Per-Word Dust Dissolve Animation

A web-based tool for creating synchronized word-by-word animation effects with audio transcription support.

## Features

### Core Functionality
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

## Project Structure

```
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
```

## Usage

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
