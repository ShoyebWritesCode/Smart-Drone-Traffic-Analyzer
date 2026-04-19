import os
import cv2

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

def process_video(input_path, output_dir):
    """
    Main pipeline orchestrator for video processing.
    
    Args:
        input_path (str): Path to the input video file.
        output_dir (str): Directory where outputs (videos and reports) will be saved.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input video not found: {input_path}")
        
    # Set up directories
    video_output_dir = os.path.join(output_dir, "videos")
    report_output_dir = os.path.join(output_dir, "reports")
    os.makedirs(video_output_dir, exist_ok=True)
    os.makedirs(report_output_dir, exist_ok=True)

    # Initialize video capture
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise RuntimeError(f"Failed to open video: {input_path}")

    # Video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    orig_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    orig_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames_in_video = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    # Optimization: Resize dimensions (e.g., width=640 for YOLOv8n)
    target_width = 640
    r = target_width / float(orig_width)
    target_height = int(orig_height * r)

    # Define counting line at the middle of the resized frame
    counting_line_y = int(target_height * 0.6)
    init_counter(counting_line_y)

    # Output video writer
    output_filename = "processed_" + os.path.basename(input_path)
    output_video_path = os.path.join(video_output_dir, output_filename)
    writer = create_video_writer(output_video_path, fps, target_width, target_height)

    # Pre-load model to avoid loading time during frame loop
    print("Loading YOLO model...")
    get_model()

    print(f"Processing video: {input_path}")
    print(f"Original size: {orig_width}x{orig_height}, Resized to: {target_width}x{target_height}")

    frame_count = 0
    final_counts = {}

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        
        # Optimization: Frame skipping (e.g., process every 2nd frame)
        # Uncomment below to implement frame skipping for even faster CPU processing
        # if frame_count % 2 != 0:
        #     continue

        # Resize frame for CPU optimization
        frame = resize_frame(frame, width=target_width)

        # 1. & 2. Run Detection & Tracking (Combined via YOLO ByteTrack)
        tracked_objects = run_tracking(frame)

        # 3. Run Counting
        current_counts = run_counting(tracked_objects)
        final_counts = current_counts

        # 4. Draw overlays
        frame = draw_boxes_and_ids(frame, tracked_objects)
        frame = draw_counting_line(frame, counting_line_y)
        frame = draw_counts(frame, current_counts)

        # Write processed frame
        writer.write(frame)

        # Optional: Print progress every 100 frames
        if frame_count % 100 == 0:
            print(f"Processed {frame_count}/{total_frames_in_video} frames...")

    # Cleanup video resources
    cap.release()
    writer.release()
    print(f"Video processing complete. Saved to: {output_video_path}")

    # 5. Generate Reports
    generate_report(final_counts, frame_count, fps, report_output_dir)
    
    return {
        "counts": final_counts,
        "processed_video_filename": output_filename
    }
