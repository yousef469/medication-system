import requests
import json

try:
    url = "http://localhost:8001/api/chat"
    payload = {"message": "Hello AI", "history": []}
    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print("STATUS:", response.status_code)
    print("RESPONSE:", response.text)
except Exception as e:
    print("ERROR:", e)
