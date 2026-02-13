"""TTS Engine - Text-to-Speech for Jarvis"""
import asyncio
import threading

# Try pyttsx3
PYTTSX3_AVAILABLE = False
try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    pass

from config import ELEVENLABS_API_KEY


class TTSEngine:
    """Text-to-Speech engine"""
    
    def __init__(self):
        self.provider = None
        self._lock = threading.Lock()
        self._init_provider()
    
    def _init_provider(self):
        """Initialize TTS provider"""
        if PYTTSX3_AVAILABLE:
            try:
                self.engine = pyttsx3.init()
                self.engine.setProperty('rate', 175)
                self.engine.setProperty('volume', 1.0)
                
                # Try to find a good voice
                voices = self.engine.getProperty('voices')
                for voice in voices:
                    if 'david' in voice.name.lower() or 'male' in voice.name.lower():
                        self.engine.setProperty('voice', voice.id)
                        break
                
                self.provider = "pyttsx3"
                print("[TTS] Using pyttsx3 (offline)")
                return
            except Exception as e:
                print(f"[TTS] pyttsx3 init failed: {e}")
        
        self.provider = "none"
        self.engine = None
        print("[TTS] No TTS available")

    async def speak(self, text: str):
        """Speak text"""
        if not text or self.provider == "none":
            return
        
        try:
            if self.provider == "pyttsx3":
                # Run in thread to not block
                loop = asyncio.get_event_loop()
                await loop.run_in_executor(None, self._speak_sync, text)
        except Exception as e:
            print(f"[TTS] Error: {e}")
    
    def _speak_sync(self, text: str):
        """Synchronous speak using pyttsx3"""
        if not self.engine:
            return
            
        with self._lock:
            try:
                self.engine.say(text)
                self.engine.runAndWait()
            except Exception as e:
                print(f"[TTS] Speak error: {e}")


__all__ = ["TTSEngine"]
