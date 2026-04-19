import pandas as pd
import os
from datetime import datetime

def generate_report(counts, total_frames, fps, output_dir, events=None, processing_duration=0):
    """
    Generate professional CSV and Excel reports including total counts, 
    breakdowns, processing duration, and detailed detection logs.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Vehicle class mapping
    class_names = {
        2: "Car",
        3: "Motorcycle",
        5: "Bus",
        7: "Truck"
    }
    
    total_vehicles = sum(counts.values())
    video_duration = round(total_frames / fps, 2) if fps > 0 else 0
    
    # 1. SUMMARY DATA (Counts & Analytics)
    summary_data = []
    for cls_id, count in counts.items():
        name = class_names.get(cls_id, f"Class {cls_id}")
        summary_data.append({
            "Vehicle Type": name,
            "Count": count,
            "Percentage": f"{(count/total_vehicles*100):.1f}%" if total_vehicles > 0 else "0%"
        })
    df_summary = pd.DataFrame(summary_data)
    
    # 2. METADATA (Performance & Stats)
    metadata_data = [{
        "Report Generated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "Total Vehicles Detected": total_vehicles,
        "Processing Duration (s)": processing_duration,
        "Video Duration (s)": video_duration,
        "Total Frames": total_frames,
        "FPS": round(fps, 2)
    }]
    df_metadata = pd.DataFrame(metadata_data)
    
    # 3. DETAILED DETECTION LOG (Events)
    if events:
        log_data = []
        for event in events:
            log_data.append({
                "Timestamp (s)": event['timestamp'],
                "Frame Number": event['frame'],
                "Vehicle Type": class_names.get(event['class_id'], f"Class {event['class_id']}"),
                "Unique Track ID": event['track_id']
            })
        df_log = pd.DataFrame(log_data)
    else:
        df_log = pd.DataFrame(columns=["Timestamp (s)", "Frame Number", "Vehicle Type", "Unique Track ID"])

    # Output paths
    csv_path = os.path.join(output_dir, "report.csv")
    excel_path = os.path.join(output_dir, "report.xlsx")
    
    # SAVE CSV: We'll save the detailed log as the primary CSV
    # but include the summary as a header-like block
    with open(csv_path, 'w') as f:
        f.write("# SMART DRONE TRAFFIC ANALYZER - SUMMARY REPORT\n")
        f.write(f"# Generated: {metadata_data[0]['Report Generated']}\n")
        f.write(f"# Total Vehicles: {total_vehicles}\n")
        f.write(f"# AI Processing Duration: {processing_duration}s\n\n")
        df_log.to_csv(f, index=False)
    
    # SAVE EXCEL: Separate sheets for a professional look
    with pd.ExcelWriter(excel_path) as writer:
        df_summary.to_excel(writer, sheet_name="Vehicle Summary", index=False)
        df_metadata.to_excel(writer, sheet_name="Performance Stats", index=False)
        df_log.to_excel(writer, sheet_name="Detection Log", index=False)
        
    print(f"Detailed reports (CSV & Excel) generated in {output_dir}")
