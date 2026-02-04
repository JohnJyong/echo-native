import os
import httpx
from typing import Optional

class TextToSpeechService:
    """
    Service for converting Text to Audio (TTS).
    Integrates with ElevenLabs for high-quality Voice Cloning.
    """
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("ELEVENLABS_API_KEY")
        self.base_url = "https://api.elevenlabs.io/v1"

    async def generate_audio(self, text: str, voice_id: str) -> bytes:
        """
        Generates audio for the given text using the specific voice_id.
        Returns raw audio bytes (MP3).
        """
        if not self.api_key:
             print("Warning: Missing ELEVENLABS_API_KEY")
             return b""

        url = f"{self.base_url}/text-to-speech/{voice_id}"
        
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return response.content
            except Exception as e:
                print(f"TTS Error: {e}")
                return b""
