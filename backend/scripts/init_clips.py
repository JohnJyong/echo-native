import subprocess
import os

def generate_sample_clip():
    """
    Generates a 5-second sample video using FFmpeg.
    Simple blue background, suitable for testing audio swap.
    """
    output_path = "backend/static/clips/godfather_demo.mp4"
    
    if os.path.exists(output_path):
        os.remove(output_path) # Clean up previous failed attempts

    # Simple solid color video
    cmd = [
        "ffmpeg",
        "-f", "lavfi", "-i", "color=c=darkblue:s=640x360:d=5",
        "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", 
        "-c:v", "libx264", "-c:a", "aac", "-shortest",
        output_path
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print(f"Sample clip generated: {output_path}")
    except Exception as e:
        print(f"Failed to generate sample clip: {e}")

if __name__ == "__main__":
    generate_sample_clip()
