"""
JARVIS Vision Engine - Enhanced Screen Analysis
================================================
Small VL model + Python helpers for low-RAM, high-quality vision.

Architecture:
- Qwen3-VL:4b: ~2.5GB - scene understanding & analysis
- Python OCR (pytesseract): ~100MB - extract text
- Python helpers: detect windows, buttons, structure
- Qwen3 Brain: interprets structured data, generates response

Total RAM: ~4GB peak (fits 8GB systems)

Usage:
    from vision_engine import analyze_screen, enhanced_vision
    
    # Quick analysis
    result = analyze_screen()
    
    # Full enhanced analysis
    result = enhanced_vision("What's on my screen?")
"""

import os
import gc
import json
from pathlib import Path
from typing import Dict, Optional, List
from PIL import Image
import numpy as np

# Lazy imports
mss = None
pytesseract = None
pytesseract = None
ollama = None
from model_manager import model_manager

# Vision model config
VL_MODEL = "qwen3-vl:4b"  # Request: Qwen3-VL:4b
VL_LOADED = False

# Output directory
TEMP_DIR = Path("./temp_vision")
TEMP_DIR.mkdir(exist_ok=True)


def _lazy_import_mss():
    """Lazy import mss for screenshots"""
    global mss
    if mss is None:
        try:
            import mss as _mss
            mss = _mss
        except ImportError:
            print("[Vision] mss not installed, screenshots disabled")
            return None
    return mss


def _lazy_import_ocr():
    """Lazy import pytesseract for OCR"""
    global pytesseract
    if pytesseract is None:
        try:
            import pytesseract as _pytesseract
            pytesseract = _pytesseract
        except ImportError:
            print("[Vision] pytesseract not installed, OCR disabled")
            return None
    return pytesseract


def _lazy_import_ollama():
    """Lazy import ollama"""
    global ollama
    if ollama is None:
        import ollama as _ollama
        ollama = _ollama
    return ollama


# =============================================================================
# SCREENSHOT CAPTURE
# =============================================================================

def capture_screen(
    output_path: str = None,
    region: str = "full",  # "full", "active", "center"
    downscale: int = 512,  # Downscale to this size for VL
) -> str:
    """
    Capture screenshot with optional region cropping and downscaling.
    
    Args:
        output_path: Where to save (default: temp file)
        region: "full" (entire screen), "active" (active window), "center" (center region)
        downscale: Max dimension for VL processing (smaller = faster)
    
    Returns:
        Path to saved screenshot
    """
    sct_lib = _lazy_import_mss()
    if sct_lib is None:
        print("[Vision] Cannot capture: mss not available")
        return ""
    
    if output_path is None:
        output_path = str(TEMP_DIR / "screen.png")
    
    with sct_lib.mss() as sct:
        monitor = sct.monitors[1]  # Primary monitor
        screenshot = sct.grab(monitor)
        img = Image.frombytes("RGB", screenshot.size, screenshot.rgb)
    
    # Region cropping
    if region == "center":
        # Crop center 60% of screen
        w, h = img.size
        left = int(w * 0.2)
        top = int(h * 0.2)
        right = int(w * 0.8)
        bottom = int(h * 0.8)
        img = img.crop((left, top, right, bottom))
    elif region == "active":
        # Try to get active window (Windows only)
        try:
            import pygetwindow as gw
            active = gw.getActiveWindow()
            if active:
                img = img.crop((active.left, active.top, active.right, active.bottom))
        except:
            pass  # Fall back to full screen
    
    # Downscale for VL (smaller = faster, less RAM)
    if downscale and max(img.size) > downscale:
        ratio = downscale / max(img.size)
        new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
        img = img.resize(new_size, Image.LANCZOS)
    
    img.save(output_path)
    return output_path


# =============================================================================
# OCR - TEXT EXTRACTION
# =============================================================================

def extract_text(image_path: str) -> str:
    """Extract text from image using OCR"""
    ocr = _lazy_import_ocr()
    if ocr is None:
        return ""
    
    try:
        img = Image.open(image_path)
        text = ocr.image_to_string(img)
        # Clean up
        text = " ".join(text.split())  # Remove extra whitespace
        return text[:1000]  # Limit length
    except Exception as e:
        print(f"[Vision] OCR error: {e}")
        return ""


def extract_text_regions(image_path: str) -> List[Dict]:
    """Extract text with bounding boxes"""
    ocr = _lazy_import_ocr()
    if ocr is None:
        return []
    
    try:
        img = Image.open(image_path)
        data = ocr.image_to_data(img, output_type=ocr.Output.DICT)
        
        regions = []
        for i, text in enumerate(data['text']):
            if text.strip() and data['conf'][i] > 50:  # Confidence > 50%
                regions.append({
                    "text": text,
                    "x": data['left'][i],
                    "y": data['top'][i],
                    "w": data['width'][i],
                    "h": data['height'][i],
                    "conf": data['conf'][i]
                })
        return regions
    except Exception as e:
        print(f"[Vision] OCR regions error: {e}")
        return []


# =============================================================================
# PYTHON HELPERS - STRUCTURE DETECTION
# =============================================================================

def detect_ui_elements(image_path: str) -> Dict:
    """
    Detect UI elements using image analysis (no ML needed).
    Uses color detection, edge detection, etc.
    """
    try:
        img = Image.open(image_path)
        img_array = np.array(img)
        
        # Basic analysis
        width, height = img.size
        
        # Detect dominant colors (potential UI elements)
        from collections import Counter
        pixels = img.resize((100, 100)).getdata()
        color_counts = Counter(pixels)
        dominant_colors = color_counts.most_common(5)
        
        # Detect if there's a lot of white (document/text area)
        white_pixels = sum(1 for p in pixels if sum(p) > 700)
        is_document = white_pixels > 5000
        
        # Detect if there's a lot of dark (code editor/terminal)
        dark_pixels = sum(1 for p in pixels if sum(p) < 100)
        is_dark_theme = dark_pixels > 5000
        
        return {
            "size": f"{width}x{height}",
            "is_document": is_document,
            "is_dark_theme": is_dark_theme,
            "dominant_colors": len(dominant_colors),
        }
    except Exception as e:
        print(f"[Vision] UI detection error: {e}")
        return {}


def detect_windows(image_path: str) -> List[str]:
    """Detect open windows from taskbar/title bars"""
    # This uses OCR to find window titles
    text = extract_text(image_path)
    
    # Common app names to look for
    apps = ["Chrome", "Firefox", "Edge", "VSCode", "Visual Studio", "Notepad", 
            "Word", "Excel", "PowerPoint", "Discord", "Spotify", "Steam",
            "File Explorer", "Settings", "Terminal", "PowerShell", "CMD"]
    
    found = []
    text_lower = text.lower()
    for app in apps:
        if app.lower() in text_lower:
            found.append(app)
    
    return found


# =============================================================================
# SMALL VL MODEL - ROUGH SCENE UNDERSTANDING
# =============================================================================

def vl_describe(image_path: str, prompt: str = "Describe what you see") -> str:
    """
    Use small VL model for rough scene understanding.
    Loads on-demand, unloads after use.
    """
    global VL_LOADED
    _lazy_import_ollama()
    
    # Ensure Vision Model is loaded via Manager
    model_manager.switch_to_vision()
    
    print(f"[Vision] VL analyzing: {prompt[:50]}...")
    import time
    start_time = time.time()
    
    try:
        print(f"[Vision] ⏱️ Sending request to Ollama... (T+0s)")
        resp = ollama.chat(
            model=VL_MODEL,
            messages=[{
                "role": "user",
                "content": prompt,
                "images": [image_path]
            }],
            options={
                "temperature": 0.2,
                "num_predict": 200
            }
        )
        duration = time.time() - start_time
        print(f"[Vision] ✅ Inference complete in {duration:.1f}s")
        
        VL_LOADED = True
        return resp["message"]["content"].strip()
    except Exception as e:
        print(f"[Vision] ❌ VL error after {time.time() - start_time:.1f}s: {e}")
        return ""


def unload_vl_model():
    """Unload VL model to free RAM (Return to Brain)"""
    # Simply switch back to brain to maximize responsiveness
    model_manager.switch_to_brain()


# =============================================================================
# ENHANCED VISION - COMBINE ALL SOURCES
# =============================================================================

def analyze_screen(
    question: str = "What's on the screen?",
    use_ocr: bool = True,
    use_vl: bool = True,
    region: str = "full",
) -> Dict:
    """
    Full enhanced screen analysis.
    
    Combines:
    1. Screenshot capture (with optional cropping)
    2. OCR text extraction
    3. UI element detection
    4. Small VL rough description
    
    Returns structured data for Phi-3 to interpret.
    """
    print("[Vision] Starting enhanced analysis...")
    
    # 1. Capture screenshot
    img_path = capture_screen(region=region, downscale=512)
    print(f"[Vision] Screenshot: {img_path}")
    
    result = {
        "image_path": img_path,
        "ocr_text": "",
        "detected_apps": [],
        "ui_info": {},
        "vl_description": "",
    }
    
    # 2. OCR - extract text
    if use_ocr:
        print("[Vision] Running OCR...")
        result["ocr_text"] = extract_text(img_path)
        result["detected_apps"] = detect_windows(img_path)
        print(f"[Vision] OCR found {len(result['ocr_text'])} chars, {len(result['detected_apps'])} apps")
    
    # 3. UI detection
    result["ui_info"] = detect_ui_elements(img_path)
    
    # 4. VL description (if enabled)
    if use_vl:
        print("[Vision] Running VL model...")
        result["vl_description"] = vl_describe(img_path, question)
        # Unload VL to free RAM
        unload_vl_model()
    
    return result


def enhanced_vision(question: str) -> Dict:
    """
    Main entry point for vision queries.
    Returns structured JSON for Phi-3 to interpret.
    """
    # Analyze screen
    analysis = analyze_screen(question=question)
    
    # Build structured context for Phi-3
    context = {
        "question": question,
        "screen_analysis": {
            "text_on_screen": analysis["ocr_text"][:500] if analysis["ocr_text"] else "No text detected",
            "detected_apps": analysis["detected_apps"] or ["Unknown"],
            "visual_description": analysis["vl_description"] or "Could not analyze",
            "ui_type": "document" if analysis["ui_info"].get("is_document") else 
                      "dark_theme" if analysis["ui_info"].get("is_dark_theme") else "standard",
        }
    }
    
    return context


def format_for_brain(analysis: Dict) -> str:
    """Format LLaVA/Vision results for the Unified JARVIS brain."""
    parts = []
    
    sa = analysis.get("screen_analysis", {})
    
    if sa.get("visual_description"):
        parts.append(f"Visual: {sa['visual_description']}")
    
    if sa.get("detected_apps"):
        parts.append(f"Apps visible: {', '.join(sa['detected_apps'])}")
    
    if sa.get("text_on_screen") and sa["text_on_screen"] != "No text detected":
        # Truncate long text
        text = sa["text_on_screen"][:300]
        parts.append(f"Text on screen: {text}")
    
    if sa.get("ui_type"):
        parts.append(f"UI type: {sa['ui_type']}")
    
    return " | ".join(parts) if parts else "Could not analyze screen"


# =============================================================================
# CLEANUP
# =============================================================================

def cleanup():
    """Clean up temp files and unload models"""
    unload_vl_model()
    
    # Remove temp screenshots
    for f in TEMP_DIR.glob("*.png"):
        try:
            f.unlink()
        except:
            pass


# =============================================================================
# CLI TEST
# =============================================================================

if __name__ == "__main__":
    print("="*60)
    print("🔍 JARVIS Vision Engine Test")
    print("="*60)
    
    # Test screenshot
    print("\n[Test] Capturing screenshot...")
    path = capture_screen(downscale=512)
    print(f"Saved to: {path}")
    
    # Test OCR
    print("\n[Test] Running OCR...")
    text = extract_text(path)
    print(f"Text found: {text[:200]}..." if text else "No text found")
    
    # Test app detection
    print("\n[Test] Detecting apps...")
    apps = detect_windows(path)
    print(f"Apps: {apps}")
    
    # Test full analysis
    print("\n[Test] Full enhanced analysis...")
    result = enhanced_vision("What applications are open?")
    print(f"\nResult:\n{json.dumps(result, indent=2)}")
    
    # Format for Phi-3
    print("\n[Test] Formatted for Phi-3:")
    print(format_for_brain(result))
    
    # Cleanup
    cleanup()
    
    print("\n" + "="*60)
    print("✅ Vision Engine Test Complete")
    print("="*60)
