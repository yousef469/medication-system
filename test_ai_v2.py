import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"Key found: {api_key[:10]}...{api_key[-5:]}")

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    response = model.generate_content("Hello, this is a test. Reply with 'Success'.")
    print(f"Response: {response.text}")
except Exception as e:
    import traceback
    print("FAILED with exception:")
    traceback.print_exc()
