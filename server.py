from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import ai_brain
import os
import json
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

# Allow CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "online", "mode": "hybrid"}

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
    file: UploadFile = File(None)
):
    """
    Synthesize medical request with history and imaging.
    """
    try:
        history = json.loads(history_json)
        image_bytes = await file.read() if file else None
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
