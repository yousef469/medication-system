import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"--- Gemini Registry Diagnostic ---")
print(f"API Key (start): {api_key[:10]}...")

try:
    genai.configure(api_key=api_key)
    print("\n[MODELS FOUND]:")
    for m in genai.list_models():
        print(f"- {m.name}")
        print(f"  Methods: {m.supported_generation_methods}")
        print(f"  Details: {m.description[:100]}...")
        print("-" * 30)

    print("\n[VERSION INFO]:")
    import google.generativeai as sdk
    print(f"SDK Version: {sdk.__version__}")

except Exception as e:
    print(f"\n[FATAL ERROR]: {e}")
