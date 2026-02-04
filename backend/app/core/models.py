from pydantic import BaseModel
from typing import List, Optional, Any

class ProcessingRequest(BaseModel):
    user_id: str
    audio_data: str  # Base64 encoded or URL
    mode: str  # 'shadowing', 'completion', 'panic'
    context_text: Optional[str] = None

class ProcessingResponse(BaseModel):
    original_text: str
    corrected_text: str
    explanation: Optional[str] = None
    audio_url: str
    pitch_data: List[dict]
    diff: List[dict]

class MagicClipRequest(BaseModel):
    audio_data: str # User recording
    clip_filename: str # "godfather_demo.mp4"
    clip_text: str # "I'm gonna make him an offer..."

class MagicClipResponse(BaseModel):
    video_url: str
    audio_url: str
    corrected_text: str
