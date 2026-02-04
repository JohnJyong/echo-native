from typing import List, Optional

from pydantic import BaseModel


class ProcessingRequest(BaseModel):
    user_id: str
    audio_data: str  # Base64 encoded or URL
    mode: str  # 'shadowing', 'completion', 'panic'
    context_text: Optional[str] = None

class PitchPoint(BaseModel):
    t: float  # time in seconds
    f: float  # frequency in Hz

class ProcessingResponse(BaseModel):
    original_text: str
    corrected_text: str
    audio_url: str
    pitch_data: List[PitchPoint]
    diff: List[dict]
