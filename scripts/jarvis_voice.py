"""
JARVIS Voice Engine - Smart Caching System
Pre-generates and caches voice for instant playback

Features:
- Pre-generate common phrases with JARVIS voice
- Cache all generated audio for instant replay
- SEMANTIC MATCHING - finds closest cached phrase for similar text
- Background generation for new phrases
- Falls back to fast TTS for uncached phrases
"""

import os
import time
import hashlib
import threading
import queue
import numpy as np
from pathlib import Path
from typing import Optional, Dict
import sounddevice as sd
import psutil


def get_memory_mb():
    """Get current process memory in MB"""
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / 1024 / 1024


def print_memory_status(label: str, before_mb: float = None):
    """Print memory status with optional delta"""
    current = get_memory_mb()
    if before_mb:
        delta = current - before_mb
        print(f"  [Memory] {label}: {delta:.1f} MB (total: {current:.1f} MB)")
    else:
        print(f"  [Memory] {label}: {current:.1f} MB")
    return current

print("[JarvisVoice] Initialized voice engine modules...")

# TTS imports
COQUI_AVAILABLE = False
try:
    from TTS.api import TTS
    COQUI_AVAILABLE = True
except ImportError:
    pass

# PIPER REMOVED - was loaded but never used, just wasted ~50MB RAM


class JarvisVoice:
    """
    JARVIS Voice with Smart Caching
    
    - Cached phrases play instantly
    - New phrases use fast fallback, then cache JARVIS voice in background
    """
    
    # Common phrases to pre-generate
    COMMON_PHRASES = [
        # Greetings
        "Yes sir?",
        "At your service.",
        "How may I assist you?",
        "I'm listening, sir.",
        "Good morning, sir.",
        "Good evening, sir.",
        
        # Acknowledgments
        "Right away, sir.",
        "As you wish.",
        "Consider it done.",
        "Executing now.",
        "On it, sir.",
        "Certainly.",
        "Very good, sir.",
        "Understood.",
        
        # Actions
        "Opening Chrome.",
        "Opening YouTube.",
        "Opening Spotify.",
        "Opening Notepad.",
        "Searching now.",
        "Screenshot taken.",
        "Playing music.",
        "Stopping playback.",
        
        # Status
        "All systems operational.",
        "Processing your request.",
        "Analysis complete.",
        "Task completed.",
        "Running diagnostics.",
        
        # Errors
        "I didn't catch that.",
        "I didn't hear anything.",
        "I couldn't complete that request.",
        "Something went wrong.",
        "Please try again.",
        
        # Time/Date
        "Let me check the time.",
        "Here's the current date.",
        
        # Goodbye
        "Standing by, sir.",
        "I'll be here when you need me.",
        "Going quiet. Say my name when you need me.",
        
        # JARVIS personality
        "I am JARVIS, Just A Rather Very Intelligent System.",
        "I was created by Tony Stark.",
        "How may I be of assistance?",
        "Shall I run a diagnostic?",
        "All systems are functioning normally.",
    ]
    
    def __init__(
        self,
        voice_sample: str = None,
        cache_dir: str = None,
        use_xtts: bool = True
    ):
        # [MINIMAL MODE] Check environment variable
        if os.environ.get("JARVIS_MINIMAL_MODE") == "True":
            use_xtts = False
            print("[JarvisVoice] MINIMAL MODE: XTTS disabled")

        self.use_xtts = use_xtts
        # Find cache directory - check multiple locations
        if cache_dir:
            self.cache_dir = Path(cache_dir)
        else:
            # Check for cache in project root first (where it actually is)
            script_dir = Path(__file__).parent
            project_root = script_dir.parent.parent  # Go up to project root
            
            possible_cache_dirs = [
                project_root / "jarvis_voice_cache",  # Project root (ACTUAL LOCATION)
                script_dir / "jarvis_voice_cache",    # Backend folder
                Path("./jarvis_voice_cache"),         # Current directory
            ]
            
            # Use first existing cache dir, or create in project root
            self.cache_dir = None
            for cache_path in possible_cache_dirs:
                if cache_path.exists() and any(cache_path.glob("*.npy")):
                    self.cache_dir = cache_path
                    print(f"[JarvisVoice] Found cache at: {cache_path}")
                    break
            
            if self.cache_dir is None:
                self.cache_dir = project_root / "jarvis_voice_cache"
        
        self.cache_dir.mkdir(exist_ok=True)
        
        self.voice_sample = voice_sample
        self.sample_rate = 24000
        
        # Threading
        self._lock = threading.Lock()
        self._is_speaking = False
        self._generation_queue = queue.Queue()
        self._generation_thread = None
        
        # Memory cache
        self._audio_cache: Dict[str, np.ndarray] = {}
        
        # Engines
        self.xtts = None
        
        # Initialize
        self._init_engines()
        self._load_cached_audio()
        self._start_background_generator()
    
    def _init_engines(self):
        """Initialize parameters without loading heavy models immediately (Lazy Loading)."""
        print("\n" + "="*60)
        print("JARVIS Voice Engine - Ready (Lazy Mode)")
        print("="*60)
        
        # Load voice sample path only
        if not self.voice_sample:
            script_dir = Path(__file__).parent
            project_root = script_dir.parent.parent
            sample_paths = [
                project_root / "Paul Bettany Breaks Down His Most Iconic Characters _ GQ-enhanced-v2.wav",
                script_dir / "jarvis_sample_enhanced.wav",
                Path("./jarvis_sample.wav"),
            ]
            for p in sample_paths:
                if p.exists():
                    self.voice_sample = str(p)
                    break
        
        self.last_used = time.time()
        # Thread for auto-unloading
        threading.Thread(target=self._unload_monitor, daemon=True).start()

    def _load_xtts(self):
        """Load XTTS into RAM when needed."""
        if self.xtts: return True
        if not COQUI_AVAILABLE or not self.use_xtts: return False
        
        try:
            print(f"  [Memory] 📢 Loading JARVIS Neural Voice (XTTS v2)...")
            mem_before = get_memory_mb()
            self.xtts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
            
            # Apply Phoneme fix
            if hasattr(self.xtts, 'synthesizer') and self.xtts.synthesizer:
                s = self.xtts.synthesizer
                if hasattr(s, 'args'): s.args.use_deterministic_seed = True
                if hasattr(s, 'tts_model') and hasattr(s.tts_model, 'config'):
                    s.tts_model.config.temperature = 0.35
                    s.tts_model.config.repetition_penalty = 2.0
            
            print_memory_status("XTTS Loaded", mem_before)
            return True
        except Exception as e:
            print(f"  [Error] XTTS failed: {e}")
            return False

    def _unload_xtts(self):
        """Unload XTTS to free 1.5GB RAM."""
        if self.xtts:
            print("  [Memory] 🍃 Unloading neural voice to free 1.5GB RAM...")
            del self.xtts
            import gc; gc.collect()
            self.xtts = None

    def _unload_monitor(self):
        """Monitors usage and unloads model after 5 mins of silence."""
        while True:
            time.sleep(60)
            if self.xtts and (time.time() - self.last_used > 300): # 5 min timeout
                self._unload_xtts()

    def _get_cache_key(self, text: str) -> str:
        """Generate cache key from text"""
        clean = text.lower().strip()
        return hashlib.md5(clean.encode()).hexdigest()[:16]
    
    def _get_cache_path(self, text: str) -> Path:
        """Get cache file path for text"""
        return self.cache_dir / f"{self._get_cache_key(text)}.npy"
    
    def _load_cached_audio(self):
        """Load all cached audio into memory with memory tracking"""
        print("\n[4/4] Loading voice cache...")
        mem_before = get_memory_mb()
        
        count = 0
        total_duration = 0
        for cache_file in self.cache_dir.glob("*.npy"):
            try:
                audio = np.load(cache_file)
                self._audio_cache[cache_file.stem] = audio
                total_duration += len(audio) / self.sample_rate
                count += 1
            except:
                pass
        
        if count > 0:
            mem_used = get_memory_mb() - mem_before
            print(f"       [OK] Loaded {count} cached phrases")
            print(f"       [OK] Total audio: {total_duration/60:.1f} minutes")
            print(f"  [Memory] Voice Cache: {mem_used:.1f} MB")
        else:
            print("       [INFO] No cached phrases found - will generate on first use")
            # Queue common phrases for background generation
            self._queue_common_phrases_for_generation()
        
        # Print final summary
        total_mem = get_memory_mb()
        print("\n" + "="*60)
        print(f"[OK] JARVIS Voice Ready | Total RAM: {total_mem:.1f} MB")
        print("="*60 + "\n")
    
    def _queue_common_phrases_for_generation(self):
        """Queue common phrases for background generation"""
        print("       [INFO] Queuing common phrases for background generation...")
        for phrase in self.COMMON_PHRASES[:20]:  # Start with first 20
            if not self._is_cached(phrase):
                self._generation_queue.put(phrase)
    
    def _save_to_cache(self, text: str, audio: np.ndarray):
        """Save audio to cache"""
        key = self._get_cache_key(text)
        self._audio_cache[key] = audio
        np.save(self.cache_dir / f"{key}.npy", audio)
    
    def _is_cached(self, text: str) -> bool:
        """Check if text is cached"""
        return self._get_cache_key(text) in self._audio_cache
    
    def _get_cached(self, text: str) -> Optional[np.ndarray]:
        """Get cached audio - EXACT MATCH ONLY"""
        key = self._get_cache_key(text)
        return self._audio_cache.get(key)
    
    def _generate_xtts(self, text: str) -> Optional[np.ndarray]:
        """Generate audio with XTTS (PHONEME LOOP FIX applied)"""
        if not self.xtts or not self.voice_sample:
            return None
        
        try:
            # Only use parameters supported by TTS.tts() API
            # Advanced settings are applied at model level in _init_engines()
            audio = self.xtts.tts(
                text=text,
                speaker_wav=self.voice_sample,
                language="en",
                speed=1.08,             # Slight speed boost (Jarvis-style)
                split_sentences=False,  # Remove unnatural pauses
            )
            
            return np.array(audio, dtype=np.float32)
        except Exception as e:
            print(f"[JarvisVoice] XTTS error: {e}")
            return None
    

    
    def _start_background_generator(self):
        """Start background thread for generating new phrases"""
        def worker():
            while True:
                try:
                    text = self._generation_queue.get(timeout=1)
                    self.last_used = time.time()
                    if text is None: break
                    
                    if self._is_cached(text): continue
                    
                    if self._load_xtts():
                        print(f"[Background] Generating: {text[:30]}...")
                        audio = self._generate_xtts(text)
                        if audio is not None:
                            self._save_to_cache(text, audio)
                            print(f"[Background] [OK] Cached: {text[:30]}...")
                    
                except queue.Empty:
                    continue
                except Exception as e:
                    print(f"[Background] Error: {e}")
        
        self._generation_thread = threading.Thread(target=worker, daemon=True)
        self._generation_thread.start()
    
    def queue_for_generation(self, text: str):
        """Queue text for background JARVIS voice generation"""
        if not self._is_cached(text):
            self._generation_queue.put(text)
    
    def speak(self, text: str, blocking: bool = True):
        """
        Speak EXACT text.
        - Cached → play instantly
        - Not cached → generate, play, then cache
        """
        if not text:
            return
        
        text = text.strip()
        
        if blocking:
            self._speak_sync(text)
        else:
            thread = threading.Thread(target=self._speak_sync, args=(text,))
            thread.daemon = True
            thread.start()
    
    def _speak_sync(self, text: str):
        """
        Speak text - cached plays instantly, uncached generates with XTTS.
        1. Exact cache hit -> play instantly
        2. Not cached -> load XTTS, generate, play, then cache
        """
        self.last_used = time.time()
        with self._lock:
            self._is_speaking = True
            try:
                # Check exact cache (instant!)
                cached = self._get_cached(text)
                if cached is not None:
                    sd.play(cached, self.sample_rate)
                    sd.wait()
                    return
                
                # Synchronous generation if not in cache (Lazy load XTTS)
                if self._load_xtts():
                    # Generate and play immediately (High Quality)
                    audio = self._generate_xtts(text)
                    if audio is not None:
                        sd.play(audio, self.sample_rate)
                        sd.wait()
                        self._save_to_cache(text, audio)
                    else:
                        print(f"[JarvisVoice] Could not generate audio for: {text[:30]}")
                else:
                    print(f"[JarvisVoice] Voice generator unavailable, text only: {text}")
                
            except Exception as e:
                print(f"[JarvisVoice] Error: {e}")
            finally:
                self._is_speaking = False
    
    def pregenerate_common_phrases(self):
        """Pre-generate all common phrases (run once, takes time)"""
        if not self.xtts or not self.voice_sample:
            print("[JarvisVoice] Cannot pre-generate: XTTS or voice sample not available")
            return
        
        total = len(self.COMMON_PHRASES)
        cached = sum(1 for p in self.COMMON_PHRASES if self._is_cached(p))
        
        print(f"[JarvisVoice] Pre-generating {total - cached} phrases...")
        print(f"[JarvisVoice] Already cached: {cached}/{total}")
        
        for i, phrase in enumerate(self.COMMON_PHRASES):
            if self._is_cached(phrase):
                continue
            
            print(f"[{i+1}/{total}] Generating: {phrase}")
            audio = self._generate_xtts(phrase)
            if audio is not None:
                self._save_to_cache(phrase, audio)
                print(f"[{i+1}/{total}] [OK] Done")
            else:
                print(f"[{i+1}/{total}] [FAIL] Failed")
        
        print("[JarvisVoice] Pre-generation complete!")
    
    def is_speaking(self) -> bool:
        return self._is_speaking
    
    def stop(self):
        try:
            sd.stop()
        except:
            pass
        self._is_speaking = False


# Convenience functions
_jarvis: Optional[JarvisVoice] = None

def get_jarvis_voice() -> JarvisVoice:
    global _jarvis
    if _jarvis is None:
        _jarvis = JarvisVoice()
    return _jarvis

def speak(text: str):
    get_jarvis_voice().speak(text)


# Test and pre-generation
if __name__ == "__main__":
    import sys
    
    print("=" * 60)
    print("JARVIS Voice - Smart Caching System")
    print("=" * 60)
    
    jarvis = JarvisVoice()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--pregenerate":
        # Pre-generate all common phrases
        print("\nPre-generating common phrases with JARVIS voice...")
        print("This will take a while but only needs to be done once!\n")
        jarvis.pregenerate_common_phrases()
    else:
        # Normal test
        print("\n[Test] Speaking cached phrase...")
        jarvis.speak("Yes sir?")
        time.sleep(0.5)
        
        print("\n[Test] Speaking another phrase...")
        jarvis.speak("All systems operational.")
        
        print("\n" + "=" * 60)
        print("To pre-generate all JARVIS phrases, run:")
        print("  python jarvis_voice.py --pregenerate")
        print("=" * 60)
