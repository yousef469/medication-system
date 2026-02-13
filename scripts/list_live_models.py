from google import genai
from config import GEMINI_API_KEY
import os

client = genai.Client(api_key=GEMINI_API_KEY, http_options={'api_version': 'v1beta'})

try:
    print("--- Listing Models (v1beta) ---")
    for m in client.models.list():
        # Multimodal Live belongs to models that support 'bidiGenerateContent'
        if 'bidiGenerateContent' in m.supported_generation_methods:
            print(f"LIVE SUPPORTED: {m.name}")
        else:
            print(f"Other: {m.name}")
except Exception as e:
    print(f"Listing failed: {e}")
