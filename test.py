"""
Local testing entry point for the Smart Drone Traffic Analyzer ML Pipeline.

Usage:
    python test.py <input_video_path> [output_dir]

Example:
    python test.py backend/uploads/sample.mp4 backend/outputs/
"""

import sys
import os

# Add the root directory to sys.path to ensure backend modules can be imported
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from backend.services.video_processor import process_video

def main():
    if len(sys.argv) < 2:
        print("Usage: python test.py <input_video_path> [output_dir]")
        sys.exit(1)
        
    input_video = sys.argv[1]
    
    # Default to backend/outputs if not provided
    if len(sys.argv) >= 3:
        output_dir = sys.argv[2]
    else:
        output_dir = os.path.join(os.path.dirname(__file__), "backend", "outputs")
        
    print(f"Starting ML Pipeline test...")
    print(f"Input: {input_video}")
    print(f"Output Directory: {output_dir}")
    print("-" * 50)
    
    try:
        process_video(input_video, output_dir)
        print("-" * 50)
        print("Pipeline execution completed successfully.")
    except Exception as e:
        print(f"Error executing pipeline: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
