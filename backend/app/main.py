import os

from app.core.models import ProcessingRequest, ProcessingResponse
from app.services.engine import VoiceProcessor
from fastapi import FastAPI

app = FastAPI(title="EchoNative Backend", version="0.1.0")
mock_mode = os.getenv("MOCK_MODE", "true").lower() == "true"
processor = VoiceProcessor(mock_mode=mock_mode)

@app.get("/")
def read_root():
    return {"status": "ok", "service": "EchoNative API"}

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
    return result
