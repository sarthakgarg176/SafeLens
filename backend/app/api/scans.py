from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.models import Asset, Alert
from datetime import datetime, timezone
import os, shutil, uuid
import imagehash
from PIL import Image
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

UPLOAD_DIR = "app/storage/uploads"
THUMB_DIR = "app/storage/thumbnails"

class BBox(BaseModel):
    x: float
    y: float
    width: float
    height: float
    confidence: float

class Detection(BaseModel):
    type: str
    value: str
    ocrConfidence: float
    regexConfidence: float
    fusedConfidence: float
    severity: str
    bboxes: List[BBox]
    source: str

class LogScanPayload(BaseModel):
    scanId: str
    fileName: str
    size: int
    riskLevel: str
    confidence: float
    piiCount: int
    processingTime: int
    status: str
    detections: List[Detection]

@router.post("/v1/scans/log", status_code=201)
async def log_scan(
    payload: LogScanPayload,
    db: Session = Depends(get_db)
):
    # Save as asset in database
    new_asset = Asset(
        filename=payload.fileName,
        status=payload.status.capitalize(),
        timestamp=datetime.now(timezone.utc)
    )
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)

    return {
        "success": True,
        "scanId": payload.scanId,
        "syncedAt": datetime.now(timezone.utc).isoformat()
    }

@router.post("/v1/scans/upload")
async def upload_scan(
    file: UploadFile = File(...),
    phash: str = Form(...),
    whash: str = Form(...),
    riskLevel: str = Form(...),
    db: Session = Depends(get_db)
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(THUMB_DIR, exist_ok=True)

    asset_id = str(uuid.uuid4())[:8]
    filename = f"secured_scan_{asset_id}_{file.filename}"
    file_path = f"{UPLOAD_DIR}/{filename}"

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Save thumbnail
    img = Image.open(file_path)
    thumb_path = f"{THUMB_DIR}/{asset_id}_thumb.png"
    img.thumbnail((200, 200))
    img.save(thumb_path)

    # Save to database
    new_asset = Asset(
        filename=file.filename,
        thumbnail_path=thumb_path,
        phash=phash,
        whash=whash,
        status="Protected",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(new_asset)
    db.commit()

    return {
        "success": True,
        "fileUrl": f"http://localhost:8000/uploads/{filename}",
        "fingerprint": {
            "phash": phash,
            "whash": whash
        }
    }

from ..database.ledger import SCAN_LEDGER

class ExtensionScanPayload(BaseModel):
    scan_id: str
    document_context: str
    risk_score: float
    hits_count: int
    recommendation: str
    has_redacted_image: bool

@router.post("/scans", status_code=201)
async def create_scan(payload: ExtensionScanPayload):
    if hasattr(payload, "model_dump"):
        data = payload.model_dump()
    else:
        data = payload.dict()
    
    # Inject a fresh ISO UTC timestamp field
    data["timestamp"] = datetime.now(timezone.utc).isoformat()
    
    # Append the validated dictionary directly into global SCAN_LEDGER list
    SCAN_LEDGER.append(data)
    
    return {"status": "success", "message": "Scan logged successfully"}