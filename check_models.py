import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro', 'gemini-pro']

print(f"Key: {api_key[:5]}...{api_key[-5:]}")

for m in models:
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(m)
        res = model.generate_content("Hi")
        print(f"{m}: OK")
    except Exception as e:
        print(f"{m}: FAILED ({str(e)[:50]})")
