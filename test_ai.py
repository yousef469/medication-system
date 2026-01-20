import requests
import os

url = "http://127.0.0.1:8001/api/analyze_report"
img_path = r"c:\Users\Yousef\MedicationSystem\public\professional_portal_hero.png"

with open(img_path, "rb") as f:
    files = {"file": f}
    try:
        response = requests.post(url, files=files)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
