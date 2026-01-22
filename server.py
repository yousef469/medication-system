from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import ai_brain
import os
import json
import httpx
from contextlib import asynccontextmanager

# --- Data Models ---
class ChatRequest(BaseModel):
    message: str
    history: list = []
    use_online: bool = False

# --- Lifespan (Startup/Shutdown) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Server] Medical AI Logic Server Starting...")
    yield
    print("[Server] Server Shutting Down...")

# --- App Setup ---
app = FastAPI(title="MediLink AI Backend", lifespan=lifespan)

# Global HTTP Client for Proxying to avoid socket exhaustion
http_client = httpx.AsyncClient(
    base_url="http://127.0.0.1:5174",
    timeout=httpx.Timeout(30.0, connect=10.0), # Extended timeout for large 3D assets
    limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
)

# Allow CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.head("/")
async def health_check():
    # If not an API request, proxy to Vite (Development Mode)
    try:
        resp = await http_client.get("/")
        from fastapi.responses import HTMLResponse
        return HTMLResponse(content=resp.text, status_code=resp.status_code)
    except Exception:
        return {"status": "online", "mode": "hybrid", "frontend": "offline_or_starting"}

@app.get("/api/health")
async def api_health():
    """Explicit JSON health check for Clinical Hub"""
    return {"status": "online", "mode": "hybrid", "timestamp": datetime.utcnow().isoformat()}

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """
    Text consultation.
    """
    try:
        response = ai_brain.process_command(req.message, req.history, req.use_online)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze_image")
async def analyze_image_endpoint(
    file: UploadFile = File(...), 
    prompt: str = Form("Analyze this medical image for triage."),
    use_online: bool = Form(False)
):
    """
    Image analysis (X-ray, MRI, etc).
    """
    try:
        contents = await file.read()
        response = ai_brain.analyze_image(contents, prompt, use_online)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze_license")
async def analyze_license_endpoint(file: UploadFile = File(...)):
    """
    Medical License OCR and Verification.
    """
    try:
        contents = await file.read()
        response = ai_brain.analyze_license(contents)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze_clinical_request")
async def analyze_clinical_endpoint(
    request_text: str = Form(...),
    history_json: str = Form("[]"),
    file: UploadFile = File(None),
    file_url: str = Form(None)
):
    """
    Synthesize medical request with history and imaging.
    Accepts direct file upload OR a file_url (for stored Supabase files).
    """
    try:
        history = json.loads(history_json)
        image_bytes = None

        if file:
            image_bytes = await file.read()
        elif file_url:
            print(f"[Server] Downloading clinical file from URL: {file_url}")
            async with httpx.AsyncClient() as client:
                resp = await client.get(file_url)
                if resp.status_code == 200:
                    image_bytes = resp.content
                else:
                    print(f"[Server] Failed to download file from URL: {resp.status_code}")

        response = ai_brain.analyze_clinical_request(request_text, history, image_bytes)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze_report")
async def analyze_report_endpoint(file: UploadFile = File(...)):
    """
    Detailed OCR and clinical analysis of medical reports/scans.
    """
    print(f"\n[Server] === NEW REPORT REQUEST ===", flush=True)
    print(f"[Server] Filename: {file.filename}", flush=True)
    print(f"[Server] Content-Type: {file.content_type}", flush=True)
    try:
        contents = await file.read()
        print(f"[Server] File Size: {len(contents)} bytes", flush=True)
        
        print(f"[Server] Starting AI Brain analysis...", flush=True)
        response = ai_brain.analyze_medical_report(contents)
        print(f"[Server] AI Brain analysis complete.", flush=True)
        
        if "error" in response:
            print(f"[Server] !!! AI Brain returned error: {response['error']}", flush=True)
        
        return response
    except Exception as e:
        print(f"[Server] !!! CRITICAL ENDPOINT ERROR: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# --- Mock Database for Prescriptions (In-Memory for Prototype) ---
PRESCRIPTIONS_MockDB = {}

# --- Data Models for Prescriptions ---
class PrescriptionRequest(BaseModel):
    doctor_id: str
    hospital_id: str
    patient_id: str
    patient_name: str
    medications: list
    diagnosis_context: str # Not shown to pharmacy
    insurance_data: dict # {provider, id, status}
    request_id: str = None # Link to the appointment/request ID

class DispenseRequest(BaseModel):
    token: str
    pharmacy_id: str
    pharmacist_id: str

import uuid
from datetime import datetime, timedelta

@app.post("/api/generate_prescription")
async def generate_prescription_endpoint(req: PrescriptionRequest):
    """
    Generates a secure, time-limited prescription token.
    """
    try:
        token = str(uuid.uuid4())
        expiry = datetime.utcnow() + timedelta(hours=24)
        
        # Store in Mock DB (Replace with Real DB insert in production)
        PRESCRIPTIONS_MockDB[token] = {
            "token": token,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": expiry.isoformat(),
            "status": "ACTIVE",
            "data": req.dict(),
            "request_id": req.request_id # Store the request_id
        }
        
        print(f"[Server] Generated Prescription: {token} for {req.patient_name}")
        return {
            "token": token,
            "qr_data": f"MED_RX:{token}",
            "expires_at": expiry.isoformat(),
            "status": "generated"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pharmacy/scan/{token}")
async def scan_prescription_endpoint(token: str):
    """
    Pharmacy scans token. returns MASKED data (No diagnosis).
    """
    # Allow passing "MED_RX:" prefix or raw token
    clean_token = token.replace("MED_RX:", "")
    
    record = PRESCRIPTIONS_MockDB.get(clean_token)
    
    if not record:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    if record['status'] == 'DISPENSED':
        return {"status": "DISPENSED", "dispensed_at": record.get('dispensed_at'), "error": "Already used"}
        
    if datetime.fromisoformat(record['expires_at']) < datetime.utcnow():
         return {"status": "EXPIRED", "error": "Token expired"}

    # MASK SENSITIVE DATA
    full_data = record['data']
    masked_data = {
        "status": "ACTIVE",
        "doctor_id": full_data['doctor_id'],
        "hospital_id": full_data['hospital_id'],
        "patient_name": full_data['patient_name'], # In real world, maybe partial mask?
        "medications": full_data['medications'],
        "insurance_status": "APPROVED" if full_data['insurance_data'].get('status') == 'active' else "PENDING",
        "copay": full_data['insurance_data'].get('copay', 0.0),
        "patient_id": full_data['patient_id'],
    }
    
    return masked_data

@app.post("/api/pharmacy/dispense")
async def dispense_prescription_endpoint(req: DispenseRequest):
    """
    Pharmacy marks as dispensed.
    """
    clean_token = req.token.replace("MED_RX:", "")
    record = PRESCRIPTIONS_MockDB.get(clean_token)
    
    if not record:
        raise HTTPException(status_code=404, detail="Prescription not found")
        
    if record['status'] != 'ACTIVE':
        raise HTTPException(status_code=400, detail=f"Cannot dispense. Status: {record['status']}")

    # Update Status
    record['status'] = 'DISPENSED'
    record['dispensed_at'] = datetime.utcnow().isoformat()
    record['pharmacy_info'] = {
        "pharmacy_id": req.pharmacy_id,
        "pharmacist_id": req.pharmacist_id
    }
    
    print(f"[Server] Prescription {clean_token} DISPENSED by {req.pharmacy_id}")
    return {"status": "success", "dispensed_at": record['dispensed_at']}

@app.get("/api/patient/{patient_id}/prescriptions")
async def get_patient_prescriptions(patient_id: str):
    """
    Returns active prescriptions for a patient (For their Mobile App QR).
    """
    results = []
    
    # Inefficient linear search for Mock DB (Fine for prototype)
    for token, record in PRESCRIPTIONS_MockDB.items():
        if record['data']['patient_id'] == patient_id:
             # Only show valid ones? Or all history?
             # Let's show all for now, frontend filters active
             results.append({
                 "token": token,
                 "qr_data": f"MED_RX:{token}",
                 "status": record['status'],
                 "request_id": record.get('request_id'),
                 "created_at": record['created_at'],
                 "expires_at": record['expires_at'],
                 "doctor_id": record['data']['doctor_id'],
                 "medications": record['data']['medications']
             })
             
    return results

from fastapi import Request
from fastapi.responses import Response

@app.api_route("/{path:path}", methods=["GET", "HEAD"])
async def proxy_frontend(request: Request, path: str):
    # Specialized catch-all to serve Vite frontend through Python
    # Includes query parameters for versioning/JS modules
    try:
        query_string = request.url.query
        target_path = f"/{path}" if not path.startswith('/') else path
        if query_string:
            target_path += f"?{query_string}"
            
        # Pass through some headers but exclude host/encoding to avoid decompression/compression issues
        headers = {k: v for k, v in request.headers.items() if k.lower() not in ['host', 'accept-encoding']}
        
        # ADDED LOGGING FOR DIAGNOSTICS
        # print(f"[Proxy] {request.method} {target_path}")
        
        resp = await http_client.request(
            method=request.method,
            url=target_path,
            headers=headers
        )
        
        return Response(
            content=resp.content, 
            status_code=resp.status_code, 
            media_type=resp.headers.get("content-type")
        )
    except Exception as e:
        import traceback
        print(f"[Proxy Error] Failed to reach Vite at {path}: {str(e)}")
        # traceback.print_exc()
        raise HTTPException(status_code=503, detail="Frontend server starting or unavailable.")

if __name__ == "__main__":
    import traceback
    try:
        print(f"[Server] Attempting to start on port {os.getenv('PORT', 8001)}...")
        port = int(os.getenv("PORT", 8001))
        uvicorn.run(app, host="0.0.0.0", port=port, log_level="debug")
    except Exception:
        print("[Server] Fatal error during startup:")
        traceback.print_exc()
        os._exit(1)
