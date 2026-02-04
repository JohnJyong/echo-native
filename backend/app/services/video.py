import subprocess
import os
import uuid
import base64
import tempfile

class VideoService:
    """
    Service for video manipulation (Magic Clip).
    Handles replacing audio tracks in video templates.
    """
    
    def __init__(self, static_dir: str = "backend/static"):
        self.static_dir = static_dir
        self.clips_dir = os.path.join(static_dir, "clips")
        self.outputs_dir = os.path.join(static_dir, "outputs")
        
        # Ensure directories exist
        os.makedirs(self.clips_dir, exist_ok=True)
        os.makedirs(self.outputs_dir, exist_ok=True)

    def get_clips(self):
        """
        Returns a list of available video templates.
        For MVP, we hardcode the metadata but check file existence.
        """
        # In a real app, this comes from DB
        clips = [
            {
                "id": "godfather_demo",
                "title": "The Godfather",
                "quote": "I'm gonna make him an offer he can't refuse.",
                "filename": "godfather_demo.mp4",
                "cover_url": "/static/clips/godfather_cover.jpg" # Placeholder
            }
        ]
        
        # Filter only existing files
        available = []
        for clip in clips:
            if os.path.exists(os.path.join(self.clips_dir, clip['filename'])):
                available.append(clip)
        
        return available

    async def swap_audio(self, clip_filename: str, audio_data_b64: str) -> str:
        """
        Replaces audio in the video clip with the provided base64 audio.
        Returns the path to the output video (relative to static root).
        """
        input_video = os.path.join(self.clips_dir, clip_filename)
        if not os.path.exists(input_video):
            raise FileNotFoundError(f"Clip {clip_filename} not found")

        # Create temp file for new audio
        audio_bytes = base64.b64decode(audio_data_b64)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio_path = temp_audio.name

        # Generate output filename
        output_filename = f"magic_{uuid.uuid4().hex}.mp4"
        output_path = os.path.join(self.outputs_dir, output_filename)

        # FFmpeg command: Replace audio
        # -c:v copy: Don't re-encode video (fast!)
        # -map 0:v:0: Use video from file 0
        # -map 1:a:0: Use audio from file 1
        # -shortest: Stop when the shortest stream ends (usually audio if it's shorter)
        # -y: Overwrite output
        cmd = [
            "ffmpeg",
            "-i", input_video,
            "-i", temp_audio_path,
            "-c:v", "copy",
            "-c:a", "aac",
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-shortest",
            "-y",
            output_path
        ]

        try:
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return f"/static/outputs/{output_filename}"
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg Error: {e}")
            raise RuntimeError("Video processing failed")
        finally:
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
