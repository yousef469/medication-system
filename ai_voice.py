import asyncio
import base64
import json
import os
from google import genai
from config import GEMINI_API_KEY

# Multimodal Live API Target
MODEL_ID = "gemini-2.5-flash-native-audio-dialog"

async def manage_voice_session(websocket):
    """
    Bridge between Frontend WebSocket and Gemini Multimodal Live.
    This manages the real-time audio/text loop.
    """
    if not GEMINI_API_KEY:
        print("[AI Voice] Error: GEMINI_API_KEY not found in config.")
        await websocket.close(code=1008)
        return

    # Initialize the new Google GenAI Client (supports Multimodal Live)
    client = genai.Client(
        api_key=GEMINI_API_KEY,
        http_options={'api_version': 'v1beta'}
    )

    # Configuration for Voice-to-Voice
    # We request AUDIO as response modality
    config = {
        "generation_config": {
            "response_modalities": ["AUDIO"]
        },
        "system_instruction": "You are a professional Medical AI Assistant. Keep your answers concise, helpful, and natural for a voice conversation. You are part of the MedicalHub network."
    }

    print(f"[AI Voice] INITIALIZING SESSION WITH MODEL: {MODEL_ID}")
    
    try:
        async with client.aio.live.connect(model=MODEL_ID, config=config) as session:
            print(f"[AI Voice] SUCCESS: Session Active with {MODEL_ID}")

            async def receive_from_client():
                """Listen to frontend WebSocket and forward to Gemini."""
                try:
                    async for message in websocket.iter_json():
                        if message.get("type") == "audio":
                            # Forward base64 audio data to Gemini
                            await session.send(input={"mime_type": "audio/pcm;rate=16000", "data": message["data"]}, end_of_turn=False)
                        elif message.get("type") == "text":
                            # Forward text command
                            await session.send(input=message["text"], end_of_turn=True)
                except Exception as e:
                    print(f"[AI Voice] Client Receive Error: {e}")

            async def send_to_client():
                """Listen to Gemini stream and forward to frontend."""
                try:
                    async for response in session:
                        if response.data:
                            # response.data is raw bytes (PCM)
                            audio_b64 = base64.b64encode(response.data).decode("utf-8")
                            await websocket.send_json({
                                "type": "audio",
                                "data": audio_b64
                            })
                        if response.text:
                            # Optional text transcript from Gemini
                            await websocket.send_json({
                                "type": "text",
                                "text": response.text
                            })
                except Exception as e:
                    print(f"[AI Voice] Gemini Response Error: {e}")

            # Run both bidirectional streams
            await asyncio.gather(receive_from_client(), send_to_client())

    except Exception as e:
        print(f"[AI Voice] Session Critical Error: {e}")
        await websocket.send_json({"type": "error", "message": str(e)})
    finally:
        print("[AI Voice] Session Closed.")
