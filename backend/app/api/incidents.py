from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..database.connection import get_db
from ..database.models import Alert, Asset
from datetime import datetime, timezone
from pydantic import BaseModel

router = APIRouter(prefix="/incidents", tags=["incidents"])

class IncidentCreate(BaseModel):
    asset_id: int
    matched_url: str
    match_confidence: float
    severity: str = "Normal"
    status: str = "Open"

@router.post("")
def create_incident(incident: IncidentCreate, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == incident.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset reference target not found")
        
    existing_alert = db.query(Alert).filter(Alert.asset_id == incident.asset_id).first()
    if existing_alert:
        return {
            "success": True,
            "message": "Incident already logged",
            "data": {
                "incident_id": existing_alert.id,
                "asset_id": existing_alert.asset_id,
                "status": existing_alert.status,
                "timestamp": existing_alert.timestamp.isoformat() if existing_alert.timestamp else None
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    new_alert = Alert(
        asset_id=incident.asset_id,
        matched_url=incident.matched_url,
        match_confidence=incident.match_confidence,
        severity=incident.severity,
        status=incident.status,
        timestamp=datetime.now(timezone.utc)
    )
    try:
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)
    except IntegrityError:
        db.rollback()
        existing_alert = db.query(Alert).filter(Alert.asset_id == incident.asset_id).first()
        if existing_alert:
            return {
                "success": True,
                "data": {"incident_id": existing_alert.id}
            }
        raise HTTPException(status_code=500, detail="Database transactional failure")

    return {
        "success": True,
        "message": "Incident logged successfully",
        "data": {
            "incident_id": new_alert.id,
            "asset_id": new_alert.asset_id,
            "status": new_alert.status
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }