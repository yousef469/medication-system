import google.generativeai as genai
from config import GEMINI_API_KEY
import os

genai.configure(api_key=GEMINI_API_KEY)

try:
    models = list(genai.list_models())
    print(f"FOUND_{len(models)}_MODELS")
    for m in models:
        print(f"MODEL:{m.name}")
except Exception as e:
    print(f"ERROR:{e}")
