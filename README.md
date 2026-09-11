<<<<<<< HEAD
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
=======
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
>>>>>>> main

## Project Structure

```
<<<<<<< HEAD
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
=======
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
>>>>>>> main
