from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.models import Asset
from ..services.similarity_service import find_similar_assets
from datetime import datetime, timezone
import os, shutil, uuid

router = APIRouter()

UPLOAD_DIR = "app/storage/uploads"

@router.post("/scan")
async def scan_image(
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    temp_id = str(uuid.uuid4())[:8]
    temp_path = f"{UPLOAD_DIR}/temp_{temp_id}_{image.filename}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    with open(temp_path, "wb") as f:
        shutil.copyfileobj(image.file, f)

    stored_assets = db.query(Asset).all()
    matches = find_similar_assets(temp_path, stored_assets)
    os.remove(temp_path)

    return {
        "success": True,
        "message": "Scan complete",
        "data": {
            "matches_found": len(matches),
            "matches": matches,
            "scanned_at": datetime.now(timezone.utc).isoformat()
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }