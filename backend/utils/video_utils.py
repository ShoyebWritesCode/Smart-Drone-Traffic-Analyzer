import cv2
import os

def resize_frame(frame, width=None, height=None):
    """Resize frame to a specific width or height while maintaining aspect ratio."""
    if width is None and height is None:
        return frame
    
    (h, w) = frame.shape[:2]
    
    if width is None:
        r = height / float(h)
        dim = (int(w * r), height)
    else:
        r = width / float(w)
        dim = (width, int(h * r))
        
    return cv2.resize(frame, dim, interpolation=cv2.INTER_AREA)

def draw_boxes_and_ids(frame, tracked_objects):
    """Draw bounding boxes and track IDs on the frame."""
    for obj in tracked_objects:
        x1, y1, x2, y2 = map(int, obj['bbox'])
        track_id = obj['track_id']
        class_id = obj['class_id']
        
        # Draw bounding box
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        # Draw track ID and class ID (for debugging)
        label = f"ID: {track_id} C: {class_id}"
        cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # Draw center point
        cx = int((x1 + x2) / 2)
        cy = int((y1 + y2) / 2)
        cv2.circle(frame, (cx, cy), 4, (0, 0, 255), -1)

    return frame

def draw_counting_line(frame, line_y):
    """Draw the virtual counting line on the frame."""
    height, width = frame.shape[:2]
    cv2.line(frame, (0, line_y), (width, line_y), (0, 255, 255), 2)
    cv2.putText(frame, "Counting Line", (10, line_y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
    return frame

def draw_counts(frame, counts):
    """Draw the current counts on the frame."""
    y_offset = 30
    cv2.putText(frame, "Counts:", (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    
    for cls_id, count in counts.items():
        y_offset += 30
        label = f"Class {cls_id}: {count}"
        cv2.putText(frame, label, (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    
    return frame

def create_video_writer(output_path, fps, width, height):
    """Initialize OpenCV VideoWriter."""
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    return cv2.VideoWriter(output_path, fourcc, fps, (width, height))
