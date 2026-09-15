#!/usr/bin/env python3
"""
Flask server for handling audio transcription requests.
Supports both Groq API and local WhisperX model.
"""

import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import threading

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg', 'm4a', 'flac', 'webm'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 25 * 1024 * 1024  # 25MB max

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# WhisperX model (loaded lazily)
whisperx_model = None
whisperx_device = None


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def load_whisperx_model():
    """Load WhisperX model if not already loaded."""
    global whisperx_model, whisperx_device
    
    if whisperx_model is not None:
        return whisperx_model
    
    try:
        import whisperx
        import torch
        
        # Determine device
        if torch.cuda.is_available():
            whisperx_device = "cuda"
            print("Using CUDA for WhisperX")
        else:
            whisperx_device = "cpu"
            print("Using CPU for WhisperX")
        
        # Load model (default to base model, can be configured)
        model_size = os.environ.get('WHISPERX_MODEL', 'base')
        print(f"Loading WhisperX model: {model_size}")
        
        whisperx_model = whisperx.load_model(
            model_size, 
            whisperx_device,
            compute_type="float32" if whisperx_device == "cpu" else "float16"
        )
        
        print("WhisperX model loaded successfully")
        return whisperx_model
        
    except ImportError as e:
        print(f"Error importing whisperx: {e}")
        raise RuntimeError("WhisperX not installed. Run: pip install whisperx")
    except Exception as e:
        print(f"Error loading WhisperX model: {e}")
        raise


def transcribe_with_whisperx(audio_path):
    """Transcribe audio using local WhisperX model."""
    try:
        model = load_whisperx_model()
        
        # Transcribe
        result = model.transcribe(audio_path, batch_size=16)
        
        # Align whisper output
        import whisperx
        model_a, metadata = whisperx.load_align_model(
            language_code=result["language"], 
            device=whisperx_device
        )
        result = whisperx.align(
            result["segments"],
            model_a,
            metadata,
            audio_path,
            whisperx_device,
            return_char_alignments=False
        )
        
        # Convert to word-level timestamps format compatible with frontend
        words = []
        for segment in result.get('segments', []):
            if 'words' in segment:
                for word_info in segment['words']:
                    word = word_info.get('word', '').strip()
                    if word:
                        words.append({
                            'word': word,
                            'start': word_info.get('start', 0),
                            'end': word_info.get('end', 0)
                        })
        
        return words
        
    except Exception as e:
        print(f"WhisperX transcription error: {e}")
        raise


@app.route('/')
def serve_index():
    """Serve the main HTML file."""
    return send_from_directory('.', 'index.html')


@app.route('/api')
def serve_api_key():
    """Serve API key from file for frontend."""
    try:
        with open('api', 'r') as f:
            api_key = f.read().strip()
            return api_key
    except FileNotFoundError:
        return '', 404


@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """
    Handle audio transcription requests.
    Supports both Groq API (client-side) and local WhisperX (server-side).
    """
    
    # Check if file is present
    if 'file' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    # Get transcription mode
    mode = request.form.get('mode', 'groq')  # 'groq' or 'whisperx'
    
    # Get optional prompt for Groq
    prompt = request.form.get('prompt', '')
    
    try:
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        if mode == 'whisperx':
            # Use local WhisperX model
            print(f"Processing with WhisperX: {filename}")
            words = transcribe_with_whisperx(filepath)
            
        elif mode == 'groq':
            # For Groq, we'll return success and let client handle it
            # Or implement server-side Groq API call here
            return jsonify({
                'mode': 'groq',
                'message': 'Groq transcription handled client-side',
                'filepath': filepath
            })
        else:
            return jsonify({'error': f'Unknown mode: {mode}'}), 400
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify({
            'success': True,
            'words': words,
            'mode': mode
        })
        
    except Exception as e:
        print(f"Transcription error: {e}")
        
        # Clean up on error
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify({'error': str(e)}), 500


@app.route('/css/<path:filename>')
def serve_css(filename):
    """Serve CSS files."""
    return send_from_directory('css', filename)


@app.route('/js/<path:filename>')
def serve_js(filename):
    """Serve JavaScript files."""
    return send_from_directory('js', filename)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    print(f"Starting server on port {port}")
    print(f"Debug mode: {debug}")
    print("Supported transcription modes: groq (client-side), whisperx (server-side)")
    app.run(host='0.0.0.0', port=port, debug=debug)
