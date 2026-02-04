from openai import AsyncOpenAI
import base64
import tempfile
import os

class SpeechToTextService:
    """
    Service for converting Audio to Text (ASR).
    Currently supports OpenAI Whisper.
    """
    def __init__(self, api_key: str = None):
        self.client = AsyncOpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))

    async def transcribe(self, audio_data_b64: str) -> str:
        """
        Transcribes base64 encoded audio using Whisper-1.
        """
        temp_path = None
        try:
            # Decode base64 to temp file
            # Whisper API requires a file-like object or path
            audio_bytes = base64.b64decode(audio_data_b64)
            
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
                temp_audio.write(audio_bytes)
                temp_path = temp_audio.name

            # Call Whisper API
            with open(temp_path, "rb") as audio_file:
                transcription = await self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            
            return transcription.text

        except Exception as e:
            print(f"STT Error: {e}")
            # Fallback for when API fails or mock is needed implicitly
            return ""
        
        finally:
            # Cleanup
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)
