from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.models import Asset, Alert, Action
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
        "fileUrl": f"https://safelens-zttx.onrender.com/uploads/{filename}",
        "fingerprint": {
            "phash": phash,
            "whash": whash
        }
    }

class ExtensionScanPayload(BaseModel):
    scan_id: str
    document_context: str
    risk_score: float
    hits_count: int
    recommendation: str
    has_redacted_image: bool

@router.post("/scans", status_code=201)
async def create_scan(payload: ExtensionScanPayload, db: Session = Depends(get_db)):
    # 1. Create a new record in the Asset table
    new_asset = Asset(
        filename=f"scan_{payload.scan_id}",
        status="Redacted" if payload.has_redacted_image else "Protected",
        confidence_before=payload.risk_score,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(new_asset)
    db.flush()

    # 2. Conditionally insert corresponding rows into Alert and Action tables when threats are found
    if payload.risk_score > 0.0 or payload.hits_count > 0:
        new_alert = Alert(
            asset_id=new_asset.id,
            matched_url=payload.document_context,
            match_confidence=payload.risk_score / 10.0,
            severity="Serious" if payload.risk_score >= 3.0 else "Normal",
            status="Open",
            timestamp=datetime.now(timezone.utc)
        )
        db.add(new_alert)
        db.flush()

        new_action = Action(
            alert_id=new_alert.id,
            action_type="Canvas Redaction" if payload.has_redacted_image else "Pass",
            status="Completed" if payload.has_redacted_image else "Allowed",
            timestamp=datetime.now(timezone.utc)
        )
        db.add(new_action)

    db.commit()
    return {"status": "success", "message": "Scan logged successfully"}