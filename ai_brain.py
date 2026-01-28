import json
import os
import base64
import io
from PIL import Image
from config import GEMINI_API_KEY

import google.generativeai as genai
import time

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

SYSTEM_PROMPT = """You are a High-Precision Medical AI Assistant.
Talk like a professional medical assistant (concise, reassuring, and helpful).
Keep your answers relatively short and structured for natural speech conversation.
You are part of the MedicalHub ecosystem.
Output JSON only.
"""

MODEL_IDS = [
    'gemini-2.5-flash',
    'gemini-3-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.5-flash-lite'
]

# Clinical safety settings to avoid over-blocking
SAFETY_SETTINGS = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_NONE",
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_NONE",
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_NONE",
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_NONE",
    },
]

def process_command(user_text: str, history: list = None, use_online: bool = True) -> dict:
    history_context = ""
    if history:
        history_context = "\nPATIENT HISTORY:\n" + "\n".join([f"- {h.get('diagnosis', 'Consultation')}: {h.get('created_at', '')}" for h in history])
    
    prompt = f"{SYSTEM_PROMPT}\n{history_context}\n\nUser: {user_text}"
    
    last_error = "Unknown error"
    for model_id in MODEL_IDS:
        for attempt in range(2):
            try:
                model = genai.GenerativeModel(model_id, safety_settings=SAFETY_SETTINGS)
                result = model.generate_content(prompt)
                print(f"[AI Brain] Success with {model_id}")
                return _clean_json(result.text)
            except Exception as e:
                last_error = str(e)
                error_msg = last_error.lower()
                print(f"[AI Brain] {model_id} failed (Attempt {attempt+1}): {error_msg[:100]}")
                
                if "429" in error_msg or "quota" in error_msg:
                    if attempt == 0:
                        print(f"[AI Brain] Rate limited on {model_id}. Retrying after 2s...")
                        time.sleep(2)
                        continue
                break # Next model
            
    # Final fallback message with real error
    return {
        "response": f"AI Error: {last_error}",
        "action": "none",
        "urgency": "medium",
        "error_type": "exhausted_all_models"
    }

def _get_mime_type(data: bytes) -> str:
    """Detect MIME type from header bytes."""
    if data.startswith(b'%PDF'):
        return "application/pdf"
    if data.startswith(b'\x89PNG\r\n\x1a\n'):
        return "image/png"
    if data.startswith(b'\xff\xd8\xff'):
        return "image/jpeg"
    if data.startswith(b'GIF87a') or data.startswith(b'GIF89a'):
        return "image/gif"
    if data.startswith(b'RIFF') and data[8:12] == b'WEBP':
        return "image/webp"
    # Fallback to image/jpeg for Gemini
    return "image/jpeg"

def analyze_image(image_bytes, prompt="Analyze this medical image.", use_online: bool = True):
    print(f"[AI Brain] Analyzing Content with prompt: {prompt[:50]}...")
    last_error = "Unknown"
    for base_id in MODEL_IDS:
        # Check both the direct ID and the models/ prefix
        for model_id in [f"models/{base_id}" if not base_id.startswith('models/') else base_id, base_id]:
            for attempt in range(2):
                try:
                    model = genai.GenerativeModel(model_id, safety_settings=SAFETY_SETTINGS)
                    
                    # Direct bytes-to-Gemini (Bypasses PIL identification issues)
                    mime_type = _get_mime_type(image_bytes)
                    content = [{"mime_type": mime_type, "data": image_bytes}, prompt]

                    response = model.generate_content(content)
                    print(f"[AI Brain] Content Success with {model_id}")
                    return {"response": response.text, "source": f"Gemini {model_id}"}
                except Exception as e:
                    last_error = str(e)
                    error_msg = last_error.lower()
                    print(f"[AI Brain] Analysis for {model_id} failed (Attempt {attempt+1}): {error_msg[:100]}")
                    if "429" in error_msg or "quota" in error_msg:
                        if attempt == 0:
                            time.sleep(2)
                            continue
                    break # Next model
            
    return {"response": f"Content analysis unavailable: {last_error}", "source": "Error"}

def analyze_license(image_bytes):
    prompt_text = """Analyze this medical license or hospital registration document.
    Perform OCR and extract:
    - Entity Name (Doctor name or Hospital name)
    - License Number
    - Expiry Date
    - Document Type (e.g., Medical Practice License, Hospital Operation License)
    
    Determine if the document looks authentic and valid (not expired).
    
    Output JSON ONLY in this format:
    {
        "is_valid": true/false,
        "entity_name": "string",
        "license_number": "string",
        "expiry_date": "string",
        "document_type": "string",
        "confidence_score": 0.0 to 1.0,
        "reasoning": "brief explanation"
    }
    """
    
    if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("AIzaSyBZdc"):
         # Fallback for placeholder keys only
         print("[AI Brain] Using Mock Analysis (Placeholder Key)")
         return {
            "is_valid": True,
            "entity_name": "Verified Professional",
            "license_number": "MOCK-12345",
            "expiry_date": "2030-01-01",
            "document_type": "Medical Practice License",
            "confidence_score": 0.9,
            "reasoning": "Mock verification for system testing."
         }

    # Try preferred models in order with retries for free tier
    last_error = "Unknown"
    for base_id in MODEL_IDS:
        for model_id in [f"models/{base_id}", base_id]:
            for attempt in range(2):
                try:
                    model = genai.GenerativeModel(model_id, safety_settings=SAFETY_SETTINGS)
                    img = Image.open(io.BytesIO(image_bytes))
                    response = model.generate_content([prompt_text, img])
                    print(f"[AI Brain] License Success with {model_id}", flush=True)
                    return _clean_json(result_text=response.text)
                except Exception as e:
                    last_error = str(e)
                    error_msg = last_error.lower()
                    print(f"[AI Brain] License analysis for {model_id} failed (Attempt {attempt+1}): {error_msg[:100]}", flush=True)
                    if "429" in error_msg or "quota" in error_msg:
                        if attempt == 0:
                            time.sleep(2)
                            continue
                    break # Next model variant
 
    return {
        "is_valid": False, 
        "confidence_score": 0.0, 
        "reasoning": f"AI Failure: {last_error}",
        "entity_name": "Error"
    }

def analyze_clinical_request(request_text: str, history: list, image_bytes=None):
    history_summary = "No previous history found."
    if history:
        history_summary = "\n".join([f"- {h.get('created_at', '')}: {h.get('diagnosis', 'Unknown')}" for h in history])

    prompt = f"""You are a High-Precision Medical AI. 
    Analyze the CURRENT REQUEST and any ATTACHED DOCUMENTS against the PATIENT HISTORY.
    
    PATIENT HISTORY:
    {history_summary}
    
    CURRENT REQUEST:
    {request_text}
    
    TASKS:
    1. Synthesize a clinical conclusion. Be CONCISE.
    2. Identify anatomical areas for 3D visualization. 
       **CRITICAL: BE SPECIFIC.** Do NOT generalize to "Left Leg" if the problem is "ACL" or "Knee".
       
       MAPPING TARGETS (Examples):
       - Knee -> "Knee", "Patella", "Ligament"
       - ACL -> "ACL", "Knee"
       - Femur -> "Femur"
       - Lungs -> "Lung"
       - Heart -> "Heart"
       
       Only use broad regions (Left Leg, Right Arm) if the location is vague.
    
    Output JSON ONLY:
    {{
        "conclusion": "Clinical synthesis with bullet points",
        "markers": [
            {{"part": "string", "status": "RED/ORANGE", "reason": "brief explanation"}}
        ]
    }}
    """
    
    last_error = "Unknown"
    # Try preferred models with prefix priority
    for base_id in MODEL_IDS:
        for model_id in [f"models/{base_id}" if not base_id.startswith('models/') else base_id, base_id]:
            for attempt in range(2):
                try:
                    model = genai.GenerativeModel(model_id, safety_settings=SAFETY_SETTINGS)
                    items = [prompt]
                    if image_bytes:
                        mime_type = _get_mime_type(image_bytes)
                        items.append({"mime_type": mime_type, "data": image_bytes})
                    
                    response = model.generate_content(
                        items,
                        generation_config=genai.types.GenerationConfig(
                            response_mime_type="application/json"
                        )
                    )
                    print(f"[AI Brain] Clinical Success with {model_id}", flush=True)
                    return _clean_json(result_text=response.text)
                except Exception as e:
                    last_error = str(e)
                    error_msg = last_error.lower()
                    print(f"[AI Brain] Clinical analysis for {model_id} failed (Attempt {attempt+1}): {error_msg[:100]}", flush=True)
                    if "429" in error_msg or "quota" in error_msg:
                        if attempt == 0:
                            time.sleep(2)
                            continue
                    break # Next model or variant
                
    return {
        "conclusion": f"Clinical Analysis Failed: {last_error}",
        "markers": [],
        "error": "exhausted_all_models"
    }

def analyze_medical_report(image_bytes: bytes) -> dict:
    """
    Analyzes a medical report or scan image.
    Extracts diagnosis, conclusion, and anatomical parts.
    """
    prompt = f"""
    Perform a deep clinical analysis of this medical report/scan image.
    1. Identify the primary diagnosis.
    2. Synthesize a professional CONCLUSION (2-3 sentences). **This field is required**.
    3. Map findings to EXACT 3D MESH NAMES using these prefixes:
       - ArmL | ArmR | HandL | HandR | LegL | LegR | Torso | Vertebrae
       
    EXAMPLES of valid mesh names:
    "ArmL: Humerusr", "ArmR: Brachialis_muscler", "HandL: 1st_metacarpal_bone", "HandR: Scaphoid", 
    "LegL: Femurr", "LegR: Tibiar", "Torso: Frontal_bone", "Vertebrae: Lumbar_vertebra_(L3)".
    
    CRITICAL: Only include the mesh_names for the parts that HAVE the diagnosis.
    If a general "Left Arm" is mentioned, include all major bones/muscles with the "ArmL" prefix.

    Return valid JSON ONLY:
    {{
      "title": "Diagnosis Title",
      "diagnosis": "Detailed Diagnosis",
      "conclusion": "The AI MUST provide a detailed synthesis here...",
      "suggested_layer": "SKELETAL | MUSCULAR | SYSTEMIC",
      "mesh_names": ["Prefix: PartName1", "Prefix: PartName2"], 
      "markers": []
    }}
    """
    
    last_error = "Unknown"
    for base_id in MODEL_IDS:
        for model_id in [f"models/{base_id}" if not base_id.startswith('models/') else base_id, base_id]:
            for attempt in range(2):
                try:
                    model = genai.GenerativeModel(model_id, safety_settings=SAFETY_SETTINGS)
                    
                    # Direct bytes-to-Gemini
                    mime_type = _get_mime_type(image_bytes)
                    data_part = {"mime_type": mime_type, "data": image_bytes}
                    response = model.generate_content([prompt, data_part])
                        
                    print(f"[AI Brain] Report Analysis Success with {model_id}", flush=True)
                    return _clean_json(result_text=response.text)
                except Exception as e:
                    last_error = str(e)
                    print(f"[AI Brain] Report analysis for {model_id} failed: {last_error[:100]}", flush=True)
                    if "429" in last_error or "quota" in last_error:
                        if attempt == 0:
                            time.sleep(2)
                            continue
                    break
                    
    return {
        "title": "Analysis Failed",
        "diagnosis": "Unknown",
        "conclusion": f"AI Synthesis failed: {last_error}",
        "markers": [],
        "error": "analysis_failed"
    }

def _clean_json(text=None, result_text=None):
    # Support both argument names for backward compatibility or clarity
    raw = result_text if result_text else text
    if not raw: return {}
    
    raw = raw.strip()
    if raw.startswith('```json'):
        raw = raw.replace('```json', '').replace('```', '')
    elif raw.startswith('```'):
        raw = raw.replace('```', '')
    try:
        data = json.loads(raw)
        # Ensure minimum required fields for Clinical Context
        if "markers" not in data: data["markers"] = []
        if "conclusion" not in data: data["conclusion"] = data.get("response", "Analysis complete.")
        return data
    except:
        # If valid JSON parsing fails, assume the AI returned just the text conclusion
        # This prevents "JSON_PARSE_ERROR" from hiding a valid text response
        return {
            "conclusion": raw,
            "markers": [],
            "error": None
        }

