from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.models import Asset
from datetime import datetime, timezone

router = APIRouter()

@router.get("/assets")
def get_assets(db: Session = Depends(get_db)):
    assets = db.query(Asset).all()
    return {
        "success": True,
        "message": "Assets fetched",
        "data": [
            {
                "asset_id": a.id,
                "filename": a.filename,
                "thumbnail_path": a.thumbnail_path,
                "website": a.source_website,
                "status": a.status,
                "watermark_id": a.watermark_id,
                "created_at": a.timestamp.isoformat() if a.timestamp else None
            } for a in assets
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/assets/{asset_id}")
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {
        "success": True,
        "message": "Asset fetched",
        "data": {
            "asset_id": asset.id,
            "filename": asset.filename,
            "website": asset.source_website,
            "thumbnail_path": asset.thumbnail_path,
            "watermark_id": asset.watermark_id,
            "phash": asset.phash,
            "whash": asset.whash,
            "status": asset.status,
            "confidence_before": asset.confidence_before,
            "confidence_after": asset.confidence_after,
            "created_at": asset.timestamp.isoformat() if asset.timestamp else None
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }