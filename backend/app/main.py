from fastapi import FastAPI
from app.core.models import ProcessingRequest, ProcessingResponse
from app.services.engine import VoiceProcessor

app = FastAPI(title="EchoNative Backend", version="0.1.0")
processor = VoiceProcessor(mock_mode=True)

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
