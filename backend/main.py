import os
import uuid
import shutil
from typing import Dict
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import our video processor
from backend.services.video_processor import process_video

app = FastAPI(title="Smart Drone Traffic Analyzer API")

# --- CORS Configuration ---
# Allow requests from any origin (useful for local development with React/Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to specific origins (e.g., ["http://localhost:3000"]) in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Directories Setup ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)

# Mount the outputs directory so the frontend can fetch static files
app.mount("/static/videos", StaticFiles(directory=os.path.join(OUTPUTS_DIR, "videos")), name="videos")
app.mount("/static/reports", StaticFiles(directory=os.path.join(OUTPUTS_DIR, "reports")), name="reports")

# --- Simple In-Memory Task Store ---
# For a production app, use Redis or a Database.
# task_store format: { "task_id": {"status": "processing" | "completed" | "failed", "data": {...}, "error": "..."} }
task_store: Dict[str, dict] = {}

def run_ml_pipeline(task_id: str, file_path: str):
    """Background task that runs the video processing pipeline."""
    task_store[task_id]["status"] = "processing"
    task_store[task_id]["progress"] = 0
    
    def update_progress(pct: int):
        task_store[task_id]["progress"] = pct

    try:
        # Run the heavy ML pipeline
        result = process_video(file_path, OUTPUTS_DIR, progress_callback=update_progress)
        
        # Store the successful result
        task_store[task_id]["status"] = "completed"
        task_store[task_id]["data"] = {
            "counts": result["counts"],
            "processing_time": result.get("processing_time"),
            "backend_type": result.get("backend_type"),
            "events": result.get("events", []),
            # Provide URLs relative to the static mount points
            "processed_video_url": f"/static/videos/{result['processed_video_filename']}",
            "csv_report_url": "/static/reports/report.csv",
            "excel_report_url": "/static/reports/report.xlsx"
        }
    except Exception as e:
        task_store[task_id]["status"] = "failed"
        task_store[task_id]["error"] = str(e)
        import traceback
        traceback.print_exc()

@app.post("/api/upload")
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Upload a video file, start processing in the background, and return a task ID.
    """
    if not file.filename.endswith(('.mp4', '.avi', '.mov')):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a video.")

    task_id = str(uuid.uuid4())
    
    # Save the uploaded file to the uploads directory
    file_path = os.path.join(UPLOADS_DIR, f"{task_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Initialize task in our store
    task_store[task_id] = {
        "status": "pending",
        "original_filename": file.filename
    }

    # Dispatch the background task
    background_tasks.add_task(run_ml_pipeline, task_id, file_path)

    return {"message": "Video uploaded successfully", "task_id": task_id}

@app.get("/api/status/{task_id}")
async def get_task_status(task_id: str):
    """
    Check the status of a specific processing task.
    """
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return task_store[task_id]

@app.get("/api/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok"}

# To run: uvicorn backend.main:app --reload
