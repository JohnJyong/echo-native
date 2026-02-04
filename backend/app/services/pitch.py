import parselmouth
import numpy as np
import base64
import tempfile
import os

class PitchService:
    """
    Service for extracting pitch (F0) data from audio.
    Used for the 'Guitar Hero' visualization mode.
    """

    def extract_pitch(self, audio_data_b64: str) -> dict:
        """
        Decodes base64 audio, saves to temp file, and extracts pitch using Praat.
        Returns a list of {time, frequency} points.
        """
        try:
            # Decode base64 to temp file
            audio_bytes = base64.b64decode(audio_data_b64)
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
                temp_audio.write(audio_bytes)
                temp_path = temp_audio.name

            # Load into Parselmouth (Praat)
            snd = parselmouth.Sound(temp_path)
            
            # Extract Pitch
            # time_step=None (auto), pitch_floor=75.0, pitch_ceiling=600.0 (standard for human speech)
            pitch = snd.to_pitch(pitch_floor=75.0, pitch_ceiling=600.0)
            
            # Convert to JSON-friendly format
            pitch_values = pitch.selected_array['frequency']
            times = pitch.xs()
            
            # Filter unvoiced segments (frequency = 0)
            result = []
            for t, f in zip(times, pitch_values):
                if f > 0:  # Only voiced parts
                    result.append({"t": round(t, 3), "f": round(f, 2)})
            
            # Cleanup
            os.remove(temp_path)
            
            return {"status": "success", "data": result}

        except Exception as e:
            return {"status": "error", "message": str(e)}
