import pytest
import base64
from app.services.pitch import PitchService

# Mock WAV header and data to create a valid-looking file for Parselmouth
# This is a minimal valid wav file structure base64 encoded
MOCK_WAV_B64 = "UklGRhYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="

class TestPitchService:
    def test_extract_pitch_invalid_data(self):
        service = PitchService()
        result = service.extract_pitch("invalid_base64_string")
        assert result["status"] == "error"

    def test_extract_pitch_valid_structure(self):
        # We test that the function runs without crashing on a minimal wav
        service = PitchService()
        result = service.extract_pitch(MOCK_WAV_B64)
        # It might error on "Audio too short" from Praat, but it shouldn't crash python
        if result["status"] == "error":
            assert "File too short" in result["message"] or "Error" in result["message"]
        else:
            assert "data" in result
