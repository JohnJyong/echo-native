from pydantic import BaseModel
from typing import List, Optional

class ProcessingRequest(BaseModel):
    user_id: str
    audio_data: str  # Base64 encoded or URL
    mode: str  # 'shadowing', 'completion', 'panic'
    context_text: Optional[str] = None

class ProcessingResponse(BaseModel):
    original_text: str
    corrected_text: str
    audio_url: str
    pitch_data: List[float]
    diff: List[dict]
