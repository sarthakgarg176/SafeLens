from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from ..database.connection import get_db
from datetime import datetime, timezone
import os, shutil, uuid

router = APIRouter()

UPLOAD_DIR = "app/storage/uploads"

@router.post("/scan")
async def scan_image(image: UploadFile = File(...)):
    # Save temp file
    temp_id = str(uuid.uuid4())[:8]
    temp_path = f"{UPLOAD_DIR}/temp_{temp_id}_{image.filename}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    with open(temp_path, "wb") as f:
        shutil.copyfileobj(image.file, f)

    return {
        "success": True,
        "message": "Image scanned",
        "data": {
            "asset_preview_id": f"temp_{temp_id}",
            "detections": [],
            "total_detections": 0,
            "processing_time_ms": 100
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }