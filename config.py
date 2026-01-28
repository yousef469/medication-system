"""Jarvis Configuration"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Paths
BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"
VOSK_MODEL_PATH = MODELS_DIR / "vosk-model-en-us-0.22"
WAKE_WORD_MODEL_PATH = MODELS_DIR / "openwakeword"

# User Settings
USER_NAME = os.getenv("USER_NAME", "Doctor")
WAKE_WORD = os.getenv("WAKE_WORD", "jarvis")
WAKE_WORD_SENSITIVITY = float(os.getenv("WAKE_WORD_SENSITIVITY", "0.5"))

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBUikZZSkNxp4ddI0BX8X8PxBIAQBUVDIY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

# Server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
API_PORT = int(os.getenv("API_PORT", "8765"))
WS_PORT = int(os.getenv("WS_PORT", "8766"))

# Audio Settings
SAMPLE_RATE = 16000
CHANNELS = 1
CHUNK_SIZE = 4096  # Larger chunk prevents "Input Overflow"

# MICROPHONE ID (Found via check_mic.py)
# Options: 1 = External Mic, 2 = Internal Mic, 0 = Default
MIC_INDEX = 2  # Internal Microphone (Cirrus Logic)

# Timeouts
LISTENING_TIMEOUT = 60  # seconds of silence before going idle
COMMAND_TIMEOUT = 10    # seconds to wait for command after wake word

# Jarvis Personality
JARVIS_GREETING = f"Yes {USER_NAME}?"
JARVIS_GOODBYE = f"Going quiet, {USER_NAME}. Say my name when you need me."
JARVIS_CONFIRM = "Right away, sir."
JARVIS_ERROR = "I'm sorry, I couldn't do that."

# Jarvis Responses (for personality)
MODEL_BRAIN = "phi3"     # Optimized for fast local text capability
MODEL_VISION = "qwen3-vl" # Optimized for local image analysis
JARVIS_RESPONSES = {
    "greeting": [
        f"Yes {USER_NAME}?",
        "At your service, sir.",
        "How can I help?",
        "I'm listening, sir.",
    ],
    "confirm": [
        "Right away, sir.",
        "On it.",
        "Consider it done.",
        "Executing now, sir.",
    ],
    "error": [
        "I'm sorry, I couldn't do that.",
        "That didn't work as expected, sir.",
        "I encountered an issue with that request.",
    ],
    "goodbye": [
        f"Going quiet, {USER_NAME}. Say my name when you need me.",
        "Standing by, sir.",
        "I'll be here when you need me.",
    ]
}
