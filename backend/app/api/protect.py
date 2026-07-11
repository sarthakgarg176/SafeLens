from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.models import Asset
from datetime import datetime, timezone
import os, shutil, uuid
import imagehash
from PIL import Image

router = APIRouter()

UPLOAD_DIR = "app/storage/uploads"
THUMB_DIR = "app/storage/thumbnails"

@router.post("/protect")
async def protect_image(
    image: UploadFile = File(...),
    blur_enabled: bool = Form(False),
    ai_cloak: bool = Form(False),
    watermark: bool = Form(False),
    db: Session = Depends(get_db)
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(THUMB_DIR, exist_ok=True)

    # Save original image
    asset_id = str(uuid.uuid4())[:8]
    filename = f"protected_{asset_id}_{image.filename}"
    file_path = f"{UPLOAD_DIR}/{filename}"

    with open(file_path, "wb") as f:
        shutil.copyfileobj(image.file, f)

    # Generate hashes from ORIGINAL image
    img = Image.open(file_path)
    phash = str(imagehash.phash(img))
    whash = str(imagehash.whash(img))

    # Generate watermark ID
    watermark_id = f"WM{uuid.uuid4().hex[:6].upper()}"

    # Save thumbnail
    thumb_path = f"{THUMB_DIR}/{asset_id}_thumb.png"
    img.thumbnail((200, 200))
    img.save(thumb_path)

    # Save to database
    new_asset = Asset(
        filename=image.filename,
        source_website=None,
        thumbnail_path=f"http://localhost:8000/storage/thumbnails/{asset_id}_thumb.png",
        phash=phash,
        whash=whash,
        watermark_id=watermark_id,
        status="Protected",
        timestamp=datetime.now(timezone.utc)
    )
    try:
        db.add(new_asset)
        db.commit()
        db.refresh(new_asset)
    except Exception as e:
        db.rollback()
        # Clean up physically created files on database failure
        if os.path.exists(file_path):
            os.remove(file_path)
        if os.path.exists(thumb_path):
            os.remove(thumb_path)
        raise HTTPException(status_code=500, detail=f"Database registration failed: {str(e)}")

    return {
        "success": True,
        "message": "Image protected",
        "data": {
            "asset_id": new_asset.id,
            "status": "Protected",
            "watermark_id": watermark_id,
            "phash": phash,
            "whash": whash,
            "protected_image_path": f"http://localhost:8000/storage/uploads/{filename}",
            "thumbnail_path": f"http://localhost:8000/storage/thumbnails/{asset_id}_thumb.png",
            "created_at": new_asset.timestamp.isoformat()
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }