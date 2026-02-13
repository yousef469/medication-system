import google.generativeai as genai
import os
import sys
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"DEBUG: Key starts with {api_key[:10]}...")

models_to_test = [
    'gemini-1.5-flash', 
    'gemini-1.5-pro', 
    'gemini-1.5-flash-8b', 
    'gemini-2.0-flash-exp'
]

results = []

for model_name in models_to_test:
    print(f"\n[TESTING] {model_name}")
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Ping")
        text = response.text
        print(f"SUCCESS: {model_name} responded: {text[:20]}...")
        results.append(f"PASS: {model_name}")
    except Exception as e:
        err_str = str(e)
        print(f"FAIL: {model_name} Error: {err_str[:200]}")
        results.append(f"FAIL: {model_name} -> {err_str[:50]}")

print("\n--- FINAL SUMMARY ---")
for r in results:
    print(r)
