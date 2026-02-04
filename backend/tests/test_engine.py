import pytest
import asyncio
from app.services.engine import VoiceProcessor

@pytest.mark.asyncio
async def test_process_shadowing_mode():
    """
    Test the standard flow: Audio -> Correct -> Audio
    """
    processor = VoiceProcessor(mock_mode=True)
    
    result = await processor.process_audio(
        audio_data="base64_fake_data",
        mode="shadowing",
        context="I am thinking about quitting my job."
    )
    
    assert result is not None
    assert "original_text" in result
    assert "corrected_text" in result
    assert result["corrected_text"] == "I am thinking about quitting my job."
    assert "audio_url" in result
    assert len(result["pitch_data"]) > 0

@pytest.mark.asyncio
async def test_correction_logic():
    """
    Test that the engine identifies grammar mistakes (mocked).
    """
    processor = VoiceProcessor(mock_mode=True)
    result = await processor.process_audio("bad_grammar_audio", "free_talk")
    
    assert result["original_text"] != result["corrected_text"]
    assert len(result["diff"]) == 2  # Based on mock implementation
