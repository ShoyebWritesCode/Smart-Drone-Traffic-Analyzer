import os
import cv2
import time
from threading import Thread
from queue import Queue

# Import modules from services and utils
from .detection import get_model
from .tracking import run_tracking
from .counting import init_counter, run_counting
from .reporting import generate_report
from backend.utils.video_utils import (
    resize_frame,
    draw_boxes_and_ids,
    draw_counting_line,
    draw_counts,
    create_video_writer
)

class ThreadedVideoReader:
    """
    Reads video frames in a background thread so disk I/O 
    never blocks the main inference loop.
    """
    def __init__(self, path, queue_size=128):
        self.cap = cv2.VideoCapture(path)
        if not self.cap.isOpened():
            raise RuntimeError(f"Failed to open video: {path}")
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)
        self.queue = Queue(maxsize=queue_size)
        self.stopped = False

    def start(self):
        thread = Thread(target=self._read, daemon=True)
        thread.start()
        return self

    def _read(self):
        while not self.stopped:
            if not self.queue.full():
                ret, frame = self.cap.read()
                if not ret:
                    self.stopped = True
                    return
                self.queue.put(frame)
            else:
                time.sleep(0.01)

    def read(self):
        return self.queue.get()

    def running(self):
        return not self.stopped or not self.queue.empty()

    def get(self, prop):
        return self.cap.get(prop)

    def release(self):
        self.stopped = True
        self.cap.release()

def process_video(input_path, output_dir, progress_callback=None):
    """
    Main pipeline orchestrator for video processing.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input video not found: {input_path}")
        
    # Set up directories
    video_output_dir = os.path.join(output_dir, "videos")
    report_output_dir = os.path.join(output_dir, "reports")
    os.makedirs(video_output_dir, exist_ok=True)
    os.makedirs(report_output_dir, exist_ok=True)

    # Initialize threaded video reader
    reader = ThreadedVideoReader(input_path)

    # Video properties
    fps = reader.get(cv2.CAP_PROP_FPS)
    orig_width = int(reader.get(cv2.CAP_PROP_FRAME_WIDTH))
    orig_height = int(reader.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames_in_video = int(reader.get(cv2.CAP_PROP_FRAME_COUNT))

    # Optimization: Resize dimensions
    target_width = 640
    r = target_width / float(orig_width)
    target_height = int(orig_height * r)

    # Define counting line
    counting_line_y = int(target_height * 0.6)
    init_counter(counting_line_y)

    # Output video writer
    output_filename = "processed_" + os.path.basename(input_path).replace(" ", "_")
    output_video_path = os.path.join(video_output_dir, output_filename)
    writer = create_video_writer(output_video_path, fps, target_width, target_height)

    # Pre-load model
    get_model()

    print(f"Processing video: {input_path}")
    print(f"Optimization: Threaded frame reading & OpenVINO (if available) enabled")

    frame_count = 0
    final_counts = {}

    # Start the background frame reader
    reader.start()
    
    # Start timer
    start_time = time.time()

    while reader.running():
        try:
            frame = reader.read()
        except:
            break

        frame_count += 1

        # Resize frame
        frame = resize_frame(frame, width=target_width)

        # 1. & 2. Run Detection & Tracking
        tracked_objects = run_tracking(frame)

        # 3. Run Counting
        current_counts = run_counting(tracked_objects, frame_count, fps)
        final_counts = current_counts

        # 4. Draw overlays
        frame = draw_boxes_and_ids(frame, tracked_objects)
        frame = draw_counting_line(frame, counting_line_y)
        frame = draw_counts(frame, current_counts)

        # Write processed frame
        writer.write(frame)

        # Print progress every 100 frames
        if frame_count % 100 == 0:
            print(f"Processed {frame_count}/{total_frames_in_video} frames...")
            
        # Report progress
        if progress_callback and total_frames_in_video > 0 and frame_count % 5 == 0:
            percentage = min(99, int((frame_count / total_frames_in_video) * 100))
            progress_callback(percentage)

    # Calculate processing time
    processing_time = round(time.time() - start_time, 2)
    print(f"Analysis complete in {processing_time} seconds.")

    # Cleanup
    reader.release()
    writer.release()
    
    # Transcode video
    try:
        import imageio_ffmpeg
        import subprocess
        print("Transcoding video for browser compatibility...")
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        temp_path = output_video_path.replace(".mp4", "_temp.mp4")
        os.rename(output_video_path, temp_path)
        
        subprocess.run([
            ffmpeg_exe, '-y', '-i', temp_path, 
            '-vcodec', 'libx264', 
            '-pix_fmt', 'yuv420p', # Critical for many browsers
            '-preset', 'fast',
            output_video_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        os.remove(temp_path)
        print("Transcoding complete.")
    except Exception as e:
        print(f"Warning: Transcoding failed: {e}")

    # Generate Reports
    from .counting import get_detection_events
    events = get_detection_events()
    generate_report(final_counts, frame_count, fps, report_output_dir, events, processing_time)
    
    # Determine backend hardware for reporting
    from .detection import MODEL_NAME
    import torch
    device_name = "GPU (CUDA)" if torch.cuda.is_available() else "CPU"
    backend_type = f"{MODEL_NAME.upper()} ({device_name})"

    return {
        "counts": final_counts,
        "processed_video_filename": output_filename,
        "processing_time": processing_time,
        "backend_type": backend_type,
        "events": events,
        "video_dimensions": {
            "width": target_width,
            "height": target_height
        }
    }
