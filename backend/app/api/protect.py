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

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
MAX_SIZE_MB = 10

@router.post("/protect")
async def protect_image(
    image: UploadFile = File(...),
    blur_enabled: bool = Form(False),
    ai_cloak: bool = Form(False),
    watermark: bool = Form(False),
    db: Session = Depends(get_db)
):
    # Validate MIME type
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error": f"Unsupported file type: {image.content_type}",
                "code": "INVALID_FILE_TYPE",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(THUMB_DIR, exist_ok=True)

    asset_id = str(uuid.uuid4())[:8]
    filename = f"protected_{asset_id}_{image.filename}"
    file_path = f"{UPLOAD_DIR}/{filename}"

    # Save file
    content = await image.read()

    # Validate file size
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error": f"File too large. Max size is {MAX_SIZE_MB}MB",
                "code": "FILE_TOO_LARGE",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

    with open(file_path, "wb") as f:
        f.write(content)

    # Validate image can be opened
    try:
        img = Image.open(file_path)
        img.verify()
        img = Image.open(file_path)
    except Exception:
        os.remove(file_path)
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error": "Corrupted or invalid image file",
                "code": "INVALID_IMAGE",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

    # Generate hashes from ORIGINAL image
    phash = str(imagehash.phash(img))
    whash = str(imagehash.whash(img))

    # Watermark ID
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