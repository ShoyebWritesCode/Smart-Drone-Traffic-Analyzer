import pandas as pd
import os
from datetime import datetime

def generate_report(counts, total_frames, fps, output_dir):
    """
    Generate CSV and Excel reports from the counting results.
    
    Args:
        counts (dict): Final counts per class.
        total_frames (int): Total number of frames processed.
        fps (float): Frames per second of the video.
        output_dir (str): Directory to save the reports.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Class mapping for YOLOv8 COCO dataset
    class_names = {
        2: "Car",
        3: "Motorcycle",
        5: "Bus",
        7: "Truck"
    }
    
    total_vehicles = sum(counts.values())
    duration_seconds = total_frames / fps if fps > 0 else 0
    
    # Prepare summary data
    data = []
    for cls_id, count in counts.items():
        name = class_names.get(cls_id, f"Class {cls_id}")
        data.append({
            "Vehicle Type": name,
            "Class ID": cls_id,
            "Count": count
        })
        
    df = pd.DataFrame(data)
    
    # Add metadata as a separate dataframe
    metadata = pd.DataFrame([{
        "Total Vehicles": total_vehicles,
        "Total Frames Processed": total_frames,
        "Video Duration (s)": round(duration_seconds, 2),
        "Processing Time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }])
    
    # Output paths
    csv_path = os.path.join(output_dir, "report.csv")
    excel_path = os.path.join(output_dir, "report.xlsx")
    
    # Save CSV (just the counts)
    df.to_csv(csv_path, index=False)
    
    # Save Excel (counts + metadata)
    with pd.ExcelWriter(excel_path) as writer:
        df.to_excel(writer, sheet_name="Counts", index=False)
        metadata.to_excel(writer, sheet_name="Metadata", index=False)
        
    print(f"Reports saved to {output_dir}")
