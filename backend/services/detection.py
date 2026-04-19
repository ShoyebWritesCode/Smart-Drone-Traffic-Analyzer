from ultralytics import YOLO

# Global singleton for the model
_model = None

# Allowed classes: car (2), motorcycle (3), bus (5), truck (7)
# Note: In COCO dataset (used by YOLOv8):
# 2: car, 3: motorcycle, 5: bus, 7: truck
ALLOWED_CLASSES = [2, 3, 5, 7]

# Model configuration
MODEL_NAME = 'yolo11n'  # Stable and fast version for CPU efficiency

def get_model():
    """
    Load and return the YOLO model (singleton).
    Uses the standard PyTorch (.pt) format.
    """
    global _model
    if _model is None:
        print(f"Loading YOLO model: {MODEL_NAME}.pt...")
        _model = YOLO(f'{MODEL_NAME}.pt')
    
    return _model

def run_detection(frame):
    """
    Run object detection on a single frame.
    """
    model = get_model()
    # Run inference, filtering only vehicle classes
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
