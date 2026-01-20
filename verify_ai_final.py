import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

models_to_try = [
    'models/gemini-1.5-flash',
    'gemini-1.5-flash',
    'models/gemini-pro',
    'gemini-pro'
]

print(f"Testing API Key: {api_key[:10]}...")

for m_name in models_to_try:
    try:
        print(f"Testing {m_name}...", end=" ")
        model = genai.GenerativeModel(m_name)
        response = model.generate_content("test")
        print(f"SUCCESS: {response.text[:10]}...")
        break
    except Exception as e:
        print(f"FAILED: {str(e)[:50]}")
