from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter()

current_settings = {
    "auto_blur": True,
    "watermark_enabled": True,
    "ai_cloak_enabled": True,
    "notifications": True,
    "similarity_threshold": 85
}

class SettingsUpdate(BaseModel):
    auto_blur: bool = True
    watermark_enabled: bool = True
    ai_cloak_enabled: bool = True
    notifications: bool = True
    similarity_threshold: int = 85

@router.get("/settings")
def get_settings():
    return {
        "success": True,
        "message": "Settings fetched",
        "data": current_settings,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.put("/settings")
def update_settings(settings: SettingsUpdate):
    current_settings.update(settings.dict())
    return {
        "success": True,
        "message": "Settings updated successfully",
        "data": current_settings,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }