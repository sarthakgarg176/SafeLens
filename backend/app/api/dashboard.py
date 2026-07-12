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

from ..database.ledger import SCAN_LEDGER

@router.get("/dashboard/stats")
async def get_dashboard_stats():
    total_files_processed = len(SCAN_LEDGER)
    
    total_threats_intercepted = sum(
        1 for scan in SCAN_LEDGER 
        if scan.get("risk_score", 0) > 0 or scan.get("hits_count", 0) > 0
    )
    
    if total_files_processed > 0:
        average_risk_score = sum(scan.get("risk_score", 0.0) for scan in SCAN_LEDGER) / total_files_processed
        average_risk_score = round(average_risk_score, 2)
    else:
        average_risk_score = 0.0
        
    recent_scans = SCAN_LEDGER[-20:][::-1]
    
    return {
        "total_files_processed": total_files_processed,
        "total_threats_intercepted": total_threats_intercepted,
        "average_risk_score": average_risk_score,
        "recent_scans": recent_scans
    }