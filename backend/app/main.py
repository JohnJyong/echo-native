import os

from app.core.models import ProcessingRequest, ProcessingResponse
from app.services.engine import VoiceProcessor
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="EchoNative Backend", version="0.1.0")

# Determine mode from env
# Default to True if not set, to prevent accidental API costs during dev
# But .env.example suggests False. Let's respect the env var strictness.
# If MOCK_MODE is not set, default to True for safety.
mock_mode_env = os.getenv("MOCK_MODE", "true").lower() == "true"
print(f"Starting VoiceProcessor with mock_mode={mock_mode_env}")

processor = VoiceProcessor(mock_mode=mock_mode_env)

@app.get("/")
def read_root():
    return {"status": "ok", "service": "EchoNative API", "mock_mode": mock_mode_env}

@app.post("/process", response_model=ProcessingResponse)
async def process_voice(request: ProcessingRequest):
    """
    Process user voice: STT -> LLM Fix -> TTS Clone
    """
    result = await processor.process_audio(
        request.audio_data, 
        request.mode, 
        request.context_text
    )
    
    # Handle error cases
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result
