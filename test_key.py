import google.generativeai as genai
import os
from config import GEMINI_API_KEY

print(f"Testing Key: {GEMINI_API_KEY[:8]}...")

genai.configure(api_key=GEMINI_API_KEY)

try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hello, respond with 'KEY_VALID'")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
