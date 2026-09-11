# Minimalist Per-Word Dust Dissolve Animation Tool

A web-based tool for creating synchronized word-by-word dust dissolve text animations, featuring speech recognition integration and audio timeline editing capabilities.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

### Core Animation
- **Dust Dissolve Effect**: Words appear and disappear with a particle-based erosion effect
- **Per-Word Timing**: Precise control over when each word appears/disappears
- **Multiple Layout Modes**:
  - Standard (Top-Down)
  - Subtitle (Bottom Anchored)
  - Focused Center (3-Line)
- **Real-time Canvas Rendering**: Smooth 60fps animation using HTML5 Canvas

### Audio Integration
- **Audio Upload & Sync**: Upload audio files and sync text to spoken words
- **Groq Whisper Transcription**: Automatic transcription with word-level timestamps
- **Timeline Player**: Interactive scrubbing, play/pause, and loop controls
- **Progress Overlay**: Visual feedback during audio processing

### Speech Recognition
- **Live Microphone Input**: Real-time speech-to-text capture
- **Manual Text Entry**: Type or paste lyrics/reference text directly
- **Word Chips**: Visual representation of individual words with timing data

### Typography Controls
- **Font Selection**: Multiple font families (Serif, Sans-Serif, Monospace, etc.)
- **Font Scaling**: Adjustable text size
- **Letter Spacing**: Fine-tune tracking between characters
- **Stagger Delay**: Control animation timing between words
- **Drift Speed**: Adjust particle movement speed

### Advanced Features
- **Timestamp Editor**: Collapsible bottom panel for precise word timing adjustments
- **Word Highlighting**: Drag and select words for batch operations
- **Debug Grid**: Toggle grid overlay for alignment reference
- **Fullscreen Mode**: Immersive preview experience
- **Sidebar Resizing**: Adjustable control panel width
- **State Persistence**: Save and restore project settings

## Project Structure

```
├── index.html              # Main HTML structure and UI
├── css/
│   └── Lstyle.css          # Stylesheet for all components
└── js/
    ├── config.js           # Constants and DOM references
    ├── main.js             # Core render loop and bootstrap
    ├── canvas.js           # Canvas rendering utilities
    ├── layouts.js          # Layout mode implementations
    ├── text-effects.js     # Particle and dissolve effects
    ├── audio.js            # Audio handling and playback
    ├── ui-handlers.js      # UI event handlers
    ├── timestamp-editor.js # Timestamp editing functionality
    ├── word-manager.js     # Word chip and selection management
    ├── storage.js          # LocalStorage persistence
    ├── state.js            # Application state management
    └── utils.js            # Utility functions
```

## Quick Start

1. **Open in Browser**: Simply open `index.html` in a modern web browser (Chrome, Firefox, Edge recommended)

2. **Add Text**: 
   - Type or paste text in the "Prompt reference" textarea
   - Or use the Live Mic button for speech input

3. **Configure Animation**:
   - Select layout mode from dropdown
   - Adjust typography settings (font, scale, spacing)
   - Tune effect parameters (drift speed, stagger delay)

4. **Preview**: Click "Replay Text" to see the animation

5. **Audio Sync** (Optional):
   - Upload an audio file
   - Click "Sync Audio & Transcribe"
   - Use the timeline slider to fine-tune word positions

## Configuration Options

### Layout Modes
| Mode | Description |
|------|-------------|
| Standard | Traditional top-to-bottom text flow |
| Subtitle | Bottom-anchored, ideal for video overlays |
| Focused Center | Highlights 3 lines at a time with smooth transitions |

### Typography
- **Font Style**: Georgia, Baskerville, System UI, Courier New, Impact, and more
- **Font Scale**: 0.5x to 3.0x multiplier
- **Letter Spacing**: -50 to 200 pixels
- **Word Life**: Duration each word stays visible

### Animation Effects
- **Text Effect**: Choose dissolution style
- **Drift Speed**: Particle movement velocity
- **Stagger Delay**: Time between word animations
- **Fade Out Delay**: Transition timing

## Usage Tips

1. **Character Limit**: Text input is limited to 896 characters for performance
2. **Tooltips**: Enable "Show Tooltips" for helpful hints while adjusting controls
3. **Debug Mode**: Toggle grid overlay for precise positioning
4. **Scrubbing**: Use the timeline scrubber with configurable step values (seconds/milliseconds)
5. **Loop**: Enable loop mode for continuous playback preview

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Edge 80+
- Safari 13+

Requires support for:
- HTML5 Canvas
- Web Audio API
- Speech Recognition API
- ES6+ JavaScript

## Technical Notes

### Known Issues
- The "Words Per Line" slider in focused-center mode is currently not wired up
- Some experimental features may have edge cases

### Bug Fixes
- Fixed undefined `currentTime` variable in text-only animation branch (see `main.js`)

## Development

### Adding New Font Styles
Edit the `<select id="fontStyle">` options in `index.html`:
```html
<option value='"YourFont", serif'>Display Name</option>
```

### Custom Layouts
Implement new layout logic in `js/layouts.js` following the existing pattern.

### New Text Effects
Add effect handlers in `js/text-effects.js` and register in the dropdown menu.

## License

MIT License - Feel free to use, modify, and distribute.

## Credits

Built with vanilla JavaScript, HTML5 Canvas, and Web Audio API. No external dependencies required.
