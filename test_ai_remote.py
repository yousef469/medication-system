import requests
import os

url = "https://sharp-clouds-decide.loca.lt/api/analyze_report"
img_path = r"c:\Users\Yousef\MedicationSystem\public\professional_portal_hero.png"

print(f"Testing Remote URL: {url}")

with open(img_path, "rb") as f:
    files = {"file": f}
    try:
        # Note: Localtunnel sometimes requires bypassing a "reminder" page.
        # But for API calls it usually works with headers.
        headers = {
            "Bypass-Tunnel-Reminder": "true"
        }
        response = requests.post(url, files=files, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response URL: {response.url}")
        print(f"Response Body: {response.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")
