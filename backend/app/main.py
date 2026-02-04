from fastapi import FastAPI, Depends
from app.core.models import ProcessingRequest, ProcessingResponse
from app.services.engine import VoiceProcessor
from app.core.database import create_db_and_tables, get_session
from app.api import auth
from app.models.user import User
from sqlmodel import Session
from datetime import datetime, date
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="EchoNative Backend", version="0.1.0")

# Include Auth Router
app.include_router(auth.router)

# Determine mode from env
mock_mode_env = os.getenv("MOCK_MODE", "true").lower() == "true"
print(f"Starting VoiceProcessor with mock_mode={mock_mode_env}")

processor = VoiceProcessor(mock_mode=mock_mode_env)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def read_root():
    return {"status": "ok", "service": "EchoNative API", "mock_mode": mock_mode_env}

@app.post("/process", response_model=ProcessingResponse)
async def process_voice(
    request: ProcessingRequest, 
    current_user: User = Depends(auth.get_current_user),
    session: Session = Depends(get_session)
):
    """
    Process user voice: STT -> LLM Fix -> TTS Clone
    Updates user streak logic.
    """
    result = await processor.process_audio(
        request.audio_data, 
        request.mode, 
        request.context_text
    )
    
    # --- Streak Logic ---
    today = datetime.now().date()
    
    # 1. Update daily count
    if current_user.last_active_date and current_user.last_active_date.date() == today:
        current_user.daily_process_count += 1
    else:
        # New day, reset daily count
        current_user.daily_process_count = 1
        
        # Check if yesterday was active to maintain streak
        yesterday = today.replace(day=today.day - 1) # Simplification, needs proper timedelta
        # Better logic: if diff is 1 day
        if current_user.last_active_date:
            delta = today - current_user.last_active_date.date()
            if delta.days == 1:
                # Streak continues (will increment if they hit target 3 today)
                pass
            elif delta.days > 1:
                # Streak broken
                current_user.streak_count = 0
    
    current_user.last_active_date = datetime.now()
    
    # 2. Check if streak target (3 sentences) met today
    # Logic: Only increment streak ONCE per day when they cross the threshold
    if current_user.daily_process_count == 3:
        current_user.streak_count += 1

    session.add(current_user)
    session.commit()
    # ---------------------

    return result
