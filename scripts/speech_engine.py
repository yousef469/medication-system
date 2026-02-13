"""Speech Recognition Engine - Faster-Whisper Integration (INT8 Optimized)"""
import os
from pathlib import Path

try:
    from faster_whisper import WhisperModel
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    print("[Speech] faster-whisper not installed. pip install faster-whisper")

# Shared model
_model = None

def get_model():
    """Get or load Faster-Whisper model (High Acc, Low RAM with INT8)"""
    global _model
    if _model is not None:
        return _model
    
    if WHISPER_AVAILABLE:
        print("[Speech] Loading Faster-Whisper (distil-large-v3, compute=int8)...")
        # distil-large-v3 is ~750MB in INT8, fits perfectly in 8GB systems
        _model = WhisperModel("distil-large-v3", device="cpu", compute_type="int8")
        print("[Speech] Model loaded!")
    return _model

def listen_for_command(timeout=8):
    """Placeholder: Transcription is now handled via SpeechEngine.transcribe_audio"""
    print("[Speech] listen_for_command is deprecated. Use SpeechEngine class.")
    return None

def smart_correction(text):
    """
    DEPRECATED: Whisper is smart enough to handle corrections natively.
    Returns text directly.
    """
    return text

class SpeechEngine:
    """Class-based speech engine using Faster-Whisper (Persisted for Speed)"""
    
    def __init__(self):
        # Load immediately to avoid latency when the user starts speaking
        self.model = get_model()
    
    def is_available(self):
        return WHISPER_AVAILABLE and self.model is not None
    
    def transcribe_audio(self, audio_data: str):
        """
        Transcribe audio file path.
        Whisper handles noise and clarity natively.
        """
        if not self.is_available():
            return None
            
        if self.model is None:
            self.model = get_model()
            
        try:
            segments, info = self.model.transcribe(audio_data, beam_size=5)
            text = " ".join([seg.text for seg in segments]).strip()
            return text if text else None
        except Exception as e:
            print(f"[Speech] Transcription error: {e}")
            return None

def reset():
    pass

__all__ = ["listen_for_command", "smart_correction", "SpeechEngine", "get_model", "WHISPER_AVAILABLE"]
