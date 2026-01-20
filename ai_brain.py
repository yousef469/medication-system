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

SYSTEM_PROMPT = """You are a Medical Triage Assistant powered by Google Gemini.
Ensure safety first. NEVER diagnose or prescribe. 
If the user asks for medical advice, provide triage guidance and suggest seeing a doctor.
Output JSON only.

Response Format:
{
    "response": "Text response to user",
    "action": "none" or "search_hospital" or "analyze_symptoms",
    "urgency": "low" | "medium" | "high"
}
"""

MODEL_IDS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3-flash-preview',
    'gemini-2.0-flash',
    'gemini-flash-latest',
    'gemini-1.5-flash', # High Quota Fallback (1500 RPM)
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-8b',
    'gemini-2.5-pro',
    'gemini-pro-latest'
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
    
    # Try preferred models in order, with and without prefix
    # Try preferred models in order with retries for free tier
    # Prefer 'models/' prefix to avoid v1beta registration issues
    last_error = "Unknown error"
    for base_id in MODEL_IDS:
        for model_id in [f"models/{base_id}", base_id]:
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
                    break # Next model variant
            
    # Final fallback message with real error
    return {
        "response": f"AI Error: {last_error}",
        "action": "none",
        "urgency": "medium",
        "error_type": "exhausted_all_models"
    }

def analyze_image(image_bytes, prompt="Analyze this medical image.", use_online: bool = True):
    print(f"[AI Brain] Analyzing Image with prompt: {prompt[:50]}...")
    # Try preferred models in order with retries
    last_error = "Unknown"
    for base_id in MODEL_IDS:
        for model_id in [f"models/{base_id}", base_id]:
            for attempt in range(2):
                try:
                    model = genai.GenerativeModel(model_id, safety_settings=SAFETY_SETTINGS)
                    img = Image.open(io.BytesIO(image_bytes))
                    response = model.generate_content([prompt, img])
                    print(f"[AI Brain] Image Success with {model_id}")
                    return {"response": response.text, "source": f"Gemini {model_id}"}
                except Exception as e:
                    last_error = str(e)
                    error_msg = last_error.lower()
                    print(f"[AI Brain] Image analysis for {model_id} failed (Attempt {attempt+1}): {error_msg[:100]}")
                    if "429" in error_msg or "quota" in error_msg:
                        if attempt == 0:
                            time.sleep(2)
                            continue
                    break # Next model variant
            
    return {"response": f"Image analysis unavailable: {last_error}", "source": "Error"}

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
                    print(f"[AI Brain] License Success with {model_id}")
                    return _clean_json(result_text=response.text)
                except Exception as e:
                    last_error = str(e)
                    error_msg = last_error.lower()
                    print(f"[AI Brain] License analysis for {model_id} failed (Attempt {attempt+1}): {error_msg[:100]}")
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
    Analyze the CURRENT REQUEST against the PATIENT HISTORY.
    
    PATIENT HISTORY:
    {history_summary}
    
    CURRENT REQUEST:
    {request_text}
    
    TASKS:
    1. Synthesize a clinical conclusion for the doctor.
    2. Identify anatomical areas of interest:
       - RED: Current problematic area (linked to the request).
       - ORANGE: Areas that maybe have issues based on symptoms/history that should be checked.
       - GREEN: Areas that had problems in history but are now cured/stable.
    
    Valid anatomical parts (Use these exact names): 
    Head, Neck, Chest, Abdomen, Back, Left Arm, Right Arm, Left Leg, Right Leg.
    
    Output JSON ONLY:
    {{
        "conclusion": "brief summary",
        "markers": [
            {{"part": "string", "status": "RED/ORANGE/GREEN", "reason": "brief explanation"}}
        ]
    }}
    """
    
    last_error = "Unknown"
    # Try preferred models with prefix priority
    for base_id in MODEL_IDS:
        for model_id in [f"models/{base_id}", base_id]:
            for attempt in range(2):
                try:
                    model = genai.GenerativeModel(model_id, safety_settings=SAFETY_SETTINGS)
                    items = [prompt]
                    if image_bytes:
                        img = Image.open(io.BytesIO(image_bytes))
                        items.append(img)
                    
                    response = model.generate_content(items)
                    print(f"[AI Brain] Clinical Success with {model_id}")
                    return _clean_json(result_text=response.text)
                except Exception as e:
                    last_error = str(e)
                    error_msg = last_error.lower()
                    print(f"[AI Brain] Clinical analysis for {model_id} failed (Attempt {attempt+1}): {error_msg[:100]}")
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
        for model_id in [f"models/{base_id}", base_id]:
            for attempt in range(2):
                try:
                    model = genai.GenerativeModel(model_id, safety_settings=SAFETY_SETTINGS)
                    
                    # MIME DETECTION & MULTI-MODAL DATA
                    # If it starts with %PDF, treat as PDF
                    if image_bytes.startswith(b'%PDF'):
                        data_part = {"mime_type": "application/pdf", "data": image_bytes}
                        response = model.generate_content([prompt, data_part])
                    else:
                        # Default to Image
                        img = Image.open(io.BytesIO(image_bytes))
                        response = model.generate_content([prompt, img])
                        
                    print(f"[AI Brain] Report Analysis Success with {model_id}")
                    return _clean_json(result_text=response.text)
                except Exception as e:
                    last_error = str(e)
                    print(f"[AI Brain] Report analysis for {model_id} failed: {last_error[:100]}")
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
        return {
            "response": raw,
            "conclusion": "AI response format mismatch.",
            "markers": [],
            "error": "JSON_PARSE_ERROR"
        }

