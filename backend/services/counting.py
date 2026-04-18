class CountingLogic:
    def __init__(self, line_y):
        """
        Initialize the counting logic.
        
        Args:
            line_y (int): The y-coordinate of the horizontal counting line.
        """
        self.line_y = line_y
        self.counted_ids = set()
        self.previous_y = {}
        
        # Keep track of counts per class (2: car, 3: motorcycle, 5: bus, 7: truck)
        self.counts = {2: 0, 3: 0, 5: 0, 7: 0}

    def process_tracks(self, tracked_objects):
        """
        Process tracks to count objects crossing the line.
        
        Args:
            tracked_objects (list): List of dictionaries containing tracking data.
            
        Returns:
            dict: Current counts per class.
        """
        current_y_positions = {}
        
        for obj in tracked_objects:
            track_id = obj['track_id']
            class_id = obj['class_id']
            x1, y1, x2, y2 = obj['bbox']
            
            # Calculate the center y-coordinate of the bounding box
            cy = int((y1 + y2) / 2)
            current_y_positions[track_id] = cy
            
            # If we've seen this object before and haven't counted it yet
            if track_id in self.previous_y and track_id not in self.counted_ids:
                prev_cy = self.previous_y[track_id]
                
                # Check if it crossed the line
                # Cross from top to bottom OR bottom to top
                crossed = (prev_cy < self.line_y and cy >= self.line_y) or \
                          (prev_cy > self.line_y and cy <= self.line_y)
                          
                if crossed:
                    self.counted_ids.add(track_id)
                    if class_id in self.counts:
                        self.counts[class_id] += 1
                    else:
                        self.counts[class_id] = 1
        
        # Update previous y positions for the next frame
        # Only keep tracks that are still visible to prevent memory leak
        self.previous_y = current_y_positions
        
        return self.counts

# Singleton instance to be initialized by the video processor
_counter = None

def init_counter(line_y):
    global _counter
    _counter = CountingLogic(line_y)

def run_counting(tracked_objects):
    """
    Run counting logic on the tracked objects.
    
    Args:
        tracked_objects (list): Tracks from the current frame.
        
    Returns:
        dict: Counts per vehicle class.
    """
    global _counter
    if _counter is None:
        raise ValueError("Counter not initialized. Call init_counter(line_y) first.")
        
    return _counter.process_tracks(tracked_objects)
