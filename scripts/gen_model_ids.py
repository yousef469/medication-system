import google.generativeai as genai
from config import GEMINI_API_KEY
import os

genai.configure(api_key=GEMINI_API_KEY)

try:
    with open("model_ids.py", "w") as f:
        f.write("MODELS = [\n")
        cnt = 0
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                f.write(f"    '{m.name}',\n")
                cnt += 1
        f.write("]\n")
    print(f"Successfully wrote {cnt} models to model_ids.py")
except Exception as e:
    print(f"Error: {e}")
