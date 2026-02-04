from typing import Dict
import base64
from app.services.pitch import PitchService
from app.services.llm import LLMService
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
        self.llm_service = LLMService()
        self.stt_service = SpeechToTextService()
        self.tts_service = TextToSpeechService()

    async def process_audio(self, audio_data: str, mode: str, context: str = "") -> Dict:
        """
        Main entry point for processing user voice.
        mode: 'shadowing' | 'completion' | 'panic'
        """
        # 1. STT: Audio -> Text
        if self.mock_mode:
            if mode == 'panic':
                transcript = "我要一杯拿铁，加燕麦奶。"
            else:
                transcript = "I am think about quit my job."
        else:
            transcript = await self.stt_service.transcribe(audio_data)
            if not transcript:
                return {"error": "STT failed"}

        # 2. Logic Branch based on Mode
        correction = {}
        target_text = ""
        explanation = ""

        if mode == 'panic':
            # Translate Logic
            if self.mock_mode:
                target_text = "I'd like a latte with oat milk, please."
                explanation = "Translated from Chinese"
            else:
                target_text = await self.llm_service.translate_text(transcript)
                explanation = "Translated Result"
        else:
            # Correction Logic (Standard)
            if self.mock_mode:
                correction = {
                    "corrected": "I am thinking about quitting my job.",
                    "explanation": "Corrected verb forms.",
                    "diff": [{"old": "think", "new": "thinking", "type": "replace"}, {"old": "quit", "new": "quitting", "type": "replace"}]
                }
                target_text = correction['corrected']
                explanation = correction['explanation']
            else:
                correction = await self.llm_service.correct_grammar(transcript, context)
                target_text = correction.get('corrected', transcript)
                explanation = correction.get('explanation', '')

        # 3. TTS: Voice Cloning (Text -> Audio)
        # TODO: In a real app, we retrieve the user's voice_id from DB based on user_id
        user_voice_id = "21m00Tcm4TlvDq8ikWAM" # Example ID (Rachel)
        
        if self.mock_mode:
            audio_url = "https://cdn.echonative.app/audio/demo_123.mp3"
            pitch_result = {"data": [{"t": 0.1, "f": 120}, {"t": 0.2, "f": 125}]}
        else:
            audio_bytes = await self.tts_service.generate_audio(target_text, user_voice_id)
            if audio_bytes:
                b64_audio = base64.b64encode(audio_bytes).decode('utf-8')
                audio_url = f"data:audio/mpeg;base64,{b64_audio}"
                pitch_result = self.pitch_service.extract_pitch(b64_audio)
            else:
                audio_url = ""
                pitch_result = {"data": []}

        return {
            "original_text": transcript,
            "corrected_text": target_text,
            "explanation": explanation,
            "audio_url": audio_url,
            "pitch_data": pitch_result.get('data', []),
            "diff": correction.get('diff', [])
        }
