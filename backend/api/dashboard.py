from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import Asset, Alert
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

@router.get("/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    total_files_processed = db.query(Asset).count()
    total_threats_intercepted = db.query(Alert).count()

    avg_score = db.query(func.avg(Asset.confidence_before)).scalar()
    average_risk_score = round(avg_score, 2) if avg_score is not None else 0.0

    recent_assets = db.query(Asset).order_by(Asset.timestamp.desc()).limit(20).all()
    
    recent_scans = []
    for asset in recent_assets:
        alert = db.query(Alert).filter(Alert.asset_id == asset.id).first()
        recent_scans.append({
            "scan_id": asset.filename.replace("scan_", "") if asset.filename.startswith("scan_") else asset.filename,
            "document_context": alert.matched_url if alert else "Safe Document",
            "risk_score": asset.confidence_before or 0.0,
            "hits_count": int(alert.match_confidence * 10) if (alert and alert.match_confidence) else 0,
            "recommendation": "REDACT_MANDATORY" if alert else "PASS_SAFE",
            "has_redacted_image": asset.status == "Redacted",
            "timestamp": asset.timestamp.isoformat()
        })

    return {
        "total_files_processed": total_files_processed,
        "total_threats_intercepted": total_threats_intercepted,
        "average_risk_score": average_risk_score,
        "recent_scans": recent_scans
    }