from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.models import Asset, Alert
from datetime import datetime, timezone

router = APIRouter()

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    total_assets = db.query(Asset).count()
    protected_assets = db.query(Asset).filter(Asset.status == "Protected").count()
    active_alerts = db.query(Alert).filter(Alert.status == "Open").count()
    serious_alerts = db.query(Alert).filter(Alert.severity == "Serious", Alert.status == "Open").count()
    normal_alerts = db.query(Alert).filter(Alert.severity == "Normal", Alert.status == "Open").count()

    return {
        "success": True,
        "message": "Dashboard data fetched",
        "data": {
            "total_assets": total_assets,
            "protected_assets": protected_assets,
            "active_alerts": active_alerts,
            "serious_alerts": serious_alerts,
            "normal_alerts": normal_alerts,
            "reports_generated": 0,
            "storage_used_mb": 0,
            "last_scan": datetime.now(timezone.utc).isoformat()
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }