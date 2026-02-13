"""Wake Word Engine - Using OpenWakeWord for 'Hey Jarvis' detection"""
import numpy as np
import time

try:
    from openwakeword.model import Model
    OWW_AVAILABLE = True
except ImportError:
    OWW_AVAILABLE = False
    print("[WakeWord] openwakeword not installed")

try:
    import pyaudio
    PYAUDIO_AVAILABLE = True
except ImportError:
    PYAUDIO_AVAILABLE = False
    print("[WakeWord] pyaudio not installed")

# Global PyAudio instance to avoid conflicts
_pyaudio_instance = None

def get_pyaudio():
    global _pyaudio_instance
    if _pyaudio_instance is None:
        _pyaudio_instance = pyaudio.PyAudio()
    return _pyaudio_instance


def listen_for_wake_word():
    """
    Blocks until 'Hey Jarvis' is heard.
    Returns True when detected.
    Properly releases microphone after detection.
    """
    if not OWW_AVAILABLE or not PYAUDIO_AVAILABLE:
        print("[WakeWord] Required libraries not available")
        return False
    
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 16000
    CHUNK = 1280
    
    print("[WakeWord] Loading model...")
    model = Model(wakeword_models=["hey_jarvis"], inference_framework="onnx")
    
    audio = pyaudio.PyAudio()
    stream = None
    
    try:
        stream = audio.open(
            format=FORMAT,
            channels=CHANNELS,
            rate=RATE,
            input=True,
            frames_per_buffer=CHUNK
        )
        
        print("[WakeWord] 🎤 Listening for 'Hey Jarvis'...")
        
        while True:
            audio_data = np.frombuffer(stream.read(CHUNK, exception_on_overflow=False), dtype=np.int16)
            prediction = model.predict(audio_data)
            
            score = prediction.get('hey_jarvis', 0)
            if score >= 0.5:
                print(f"[WakeWord] ✨ Wake word detected! (score: {score:.2f})")
                # IMPORTANT: Close stream and audio BEFORE returning
                stream.stop_stream()
                stream.close()
                audio.terminate()
                time.sleep(0.1)  # Small delay to ensure mic is released
                return True
                
    except KeyboardInterrupt:
        return False
    except Exception as e:
        print(f"[WakeWord] Error: {e}")
        return False
    finally:
        # Make sure to clean up
        if stream:
            try:
                stream.stop_stream()
                stream.close()
            except:
                pass
        try:
            audio.terminate()
        except:
            pass


__all__ = ["listen_for_wake_word", "OWW_AVAILABLE"]
