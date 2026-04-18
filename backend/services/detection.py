from ultralytics import YOLO

# Global singleton for the model
_model = None

# Allowed classes: car (2), motorcycle (3), bus (5), truck (7)
# Note: In COCO dataset (used by YOLOv8):
# 2: car, 3: motorcycle, 5: bus, 7: truck
ALLOWED_CLASSES = [2, 3, 5, 7]

def get_model():
    """Load and return the YOLO model (singleton)."""
    global _model
    if _model is None:
        # Use YOLOv8n (nano) for lightweight CPU inference
        _model = YOLO('yolov8n.pt')
    return _model

def run_detection(frame):
    """
    Run object detection on a single frame.
    (Note: If using YOLO's built-in tracking, this standalone detection 
    is often skipped in favor of model.track(), but provided here for modularity).
    """
    model = get_model()
    # Run inference, filtering only vehicle classes, optimized for CPU
    results = model.predict(frame, classes=ALLOWED_CLASSES, verbose=False)
    
    detections = []
    if len(results) > 0:
        result = results[0]
        if result.boxes:
            for box in result.boxes:
                # Extract coordinates, class, and confidence
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                cls_id = int(box.cls[0].cpu().numpy())
                conf = float(box.conf[0].cpu().numpy())
                
                detections.append({
                    'bbox': [x1, y1, x2, y2],
                    'class_id': cls_id,
                    'confidence': conf
                })
                
    return detections
