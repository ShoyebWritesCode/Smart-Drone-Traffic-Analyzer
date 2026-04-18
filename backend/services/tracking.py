from .detection import get_model, ALLOWED_CLASSES

def run_tracking(frame):
    """
    Run object tracking on the frame using YOLO's built-in ByteTrack.
    Returns a list of tracked objects with consistent IDs.
    """
    model = get_model()
    
    # YOLO's track method does both detection and tracking.
    # persist=True maintains tracking state across frames.
    results = model.track(
        frame, 
        persist=True, 
        classes=ALLOWED_CLASSES, 
        tracker="bytetrack.yaml", 
        verbose=False
    )
    
    tracked_objects = []
    
    if len(results) > 0:
        result = results[0]
        if result.boxes and result.boxes.id is not None:
            # We only process objects that have been assigned a track ID
            boxes = result.boxes.xyxy.cpu().numpy()
            track_ids = result.boxes.id.cpu().numpy()
            class_ids = result.boxes.cls.cpu().numpy()
            confs = result.boxes.conf.cpu().numpy()
            
            for box, track_id, cls_id, conf in zip(boxes, track_ids, class_ids, confs):
                tracked_objects.append({
                    'bbox': box.tolist(),
                    'track_id': int(track_id),
                    'class_id': int(cls_id),
                    'confidence': float(conf)
                })
                
    return tracked_objects
