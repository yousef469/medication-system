import google.generativeai as genai
import os
import sys

# Try to import GEMINI_API_KEY from config if it exists
try:
    from config import GEMINI_API_KEY
except ImportError:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def test_gemini():
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY not found in environment or config.py")
        return

    print(f"Testing Gemini with key: {GEMINI_API_KEY[:10]}...")
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        
        # List models to see if API key works
        print("Attempting to list models...")
        models = genai.list_models()
        available_models = [m.name for m in models]
        print(f"Connection Successful! Available models: {available_models[:5]}...")
        
        # Test generation
        print("Testing basic generation with gemini-1.5-flash...")
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Hello")
        print("SUCCESS! Gemini response:", response.text)
        
    except Exception as e:
        print("----------------------------------------")
        print("GEMINI DIAGNOSTIC FAILURE")
        print(f"Type: {type(e).__name__}")
        print(f"Message: {str(e)}")
        print("----------------------------------------")
        
        if "429" in str(e):
            print("CAUSE: Quota exceeded. You are on the free tier.")
        elif "API_KEY_INVALID" in str(e) or "API key not found" in str(e):
            print("CAUSE: Invalid API Key.")
        elif "400" in str(e):
            print("CAUSE: Bad Request. Possibly model not supported or check your region.")

if __name__ == "__main__":
    test_gemini()
