import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock
from app.services.engine import VoiceProcessor

@pytest.mark.asyncio
async def test_process_shadowing_mode_mocked():
    """
    Test the standard flow: Audio -> Correct -> Audio (Mock Mode)
    """
    processor = VoiceProcessor(mock_mode=True)
    
    result = await processor.process_audio(
        audio_data="base64_fake_data",
        mode="shadowing",
        context="I am thinking about quitting my job."
    )
    
    assert result is not None
    assert result["corrected_text"] == "I am thinking about quitting my job."
    assert "audio_url" in result
    assert "pitch_data" in result

@pytest.mark.asyncio
async def test_process_flow_with_service_mocks():
    """
    Test the orchestration logic with mocked services (mock_mode=False)
    """
    processor = VoiceProcessor(mock_mode=False)
    
    # Mock internal services
    processor.stt_service.transcribe = AsyncMock(return_value="Hello world")
    processor.llm_service.correct_grammar = AsyncMock(return_value={
        "corrected": "Hello world.", "explanation": "Added punctuation", "diff": []
    })
    processor.tts_service.generate_audio = AsyncMock(return_value=b"fake_mp3_bytes")
    processor.pitch_service.extract_pitch = MagicMock(return_value={"data": [{"t":0, "f":100}]})

    result = await processor.process_audio("base64_audio", "free_talk")

    # Assertions
    assert result["original_text"] == "Hello world"
    assert result["corrected_text"] == "Hello world."
    assert result["audio_url"].startswith("data:audio/mpeg;base64,")
    assert len(result["pitch_data"]) == 1
    
    # Verify calls
    processor.stt_service.transcribe.assert_called_once()
    processor.llm_service.correct_grammar.assert_called_once()
    processor.tts_service.generate_audio.assert_called_once()
