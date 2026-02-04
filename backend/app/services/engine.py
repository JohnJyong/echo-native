import base64
from typing import Dict

from app.services.llm import LLMService
from app.services.pitch import PitchService
from app.services.stt import SpeechToTextService
from app.services.tts import TextToSpeechService


class VoiceProcessor:
    """
    Core logic for EchoNative Voice Processing.
    Orchestrates STT -> LLM -> TTS pipeline.
    """
    
    def __init__(self, mock_mode=True):
        self.mock_mode = mock_mode
        self.pitch_service = PitchService()
        # Only initialize external services when not in mock mode
        if not mock_mode:
            self.llm_service = LLMService()
            self.stt_service = SpeechToTextService()
            self.tts_service = TextToSpeechService()
        else:
            self.llm_service = None
            self.stt_service = None
            self.tts_service = None

    async def process_audio(self, audio_data: str, mode: str, context: str = "") -> Dict:
        """
        Main entry point for processing user voice.
        """
        # 1. STT: Audio -> Text
        if self.mock_mode:
            transcript = "I am think about quit my job."
        else:
            transcript = await self.stt_service.transcribe(audio_data)
            if not transcript:
                return {"error": "STT failed"}

        # 2. LLM: Grammar Correction & Diff
        if self.mock_mode:
            correction = {
                "corrected": "I am thinking about quitting my job.",
                "explanation": "Corrected verb forms.",
                "diff": [{"old": "think", "new": "thinking", "type": "replace"}, {"old": "quit", "new": "quitting", "type": "replace"}]
            }
        else:
            correction = await self.llm_service.correct_grammar(transcript, context)
        
        corrected_text = correction.get('corrected', transcript)

        # 3. TTS: Voice Cloning (Text -> Audio)
        # TODO: In a real app, we retrieve the user's voice_id from DB based on user_id
        user_voice_id = "21m00Tcm4TlvDq8ikWAM" # Example ID (Rachel)
        
        if self.mock_mode:
            audio_url = "https://cdn.echonative.app/audio/demo_123.mp3"
            # For pitch mock, we just return dummy data
            pitch_result = {"data": [{"t": 0.1, "f": 120}, {"t": 0.2, "f": 125}]}
        else:
            audio_bytes = await self.tts_service.generate_audio(corrected_text, user_voice_id)
            
            if audio_bytes:
                # Convert to Data URI for immediate playback on frontend
                b64_audio = base64.b64encode(audio_bytes).decode('utf-8')
                audio_url = f"data:audio/mpeg;base64,{b64_audio}"
                
                # 4. Pitch Extraction (from the NEW perfect audio)
                # We need to analyze the audio we just generated to show the "Target" pitch curve
                pitch_result = self.pitch_service.extract_pitch(b64_audio)
            else:
                audio_url = ""
                pitch_result = {"data": []}

        return {
            "original_text": transcript,
            "corrected_text": corrected_text,
            "explanation": correction.get('explanation', ''),
            "audio_url": audio_url,
            "pitch_data": pitch_result.get('data', []),
            "diff": correction.get('diff', [])
        }
