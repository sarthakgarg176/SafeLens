from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "success": True,
        "message": "Backend running",
        "data": {
            "status": "running",
            "version": "1.0.0",
            "database": "connected",
            "scheduler": "running",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }