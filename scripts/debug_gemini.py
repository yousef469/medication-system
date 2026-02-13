import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"DEBUG: Using API Key starting with {api_key[:10]}")

genai.configure(api_key=api_key)

try:
    print("DEBUG: Listing models...")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f" - {m.name}")
    
    model_name = 'models/gemini-1.5-flash' # SDK often expects 'models/' prefix
    print(f"\nDEBUG: Testing {model_name}...")
    model = genai.GenerativeModel(model_name)
    response = model.generate_content("Hello")
    print(f"SUCCESS: {response.text}")
except Exception as e:
    print(f"\nERROR: {type(e).__name__}: {str(e)}")
    if hasattr(e, 'details'):
        print(f"DETAILS: {e.details}")
