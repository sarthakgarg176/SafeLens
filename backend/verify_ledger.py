# SafeLens Backend SQLite Integration Verification Suite

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from database.connection import SessionLocal
from database.models import Asset, Alert, Action

def run_tests():
    # Clean up any previous test runs from the SQLite database
    db = SessionLocal()
    try:
        # Delete related Actions first due to FK constraints
        db.query(Action).filter(Action.alert_id.in_(
            db.query(Alert.id).filter(Alert.asset_id.in_(
                db.query(Asset.id).filter(Asset.filename.like("scan_scan_test_%"))
            ))
        )).delete(synchronize_session=False)

        # Delete related Alerts
        db.query(Alert).filter(Alert.asset_id.in_(
            db.query(Asset.id).filter(Asset.filename.like("scan_scan_test_%"))
        )).delete(synchronize_session=False)

        # Delete Assets
        db.query(Asset).filter(Asset.filename.like("scan_scan_test_%")).delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        db.rollback()
        print("Cleanup failed:", e)
    finally:
        db.close()

    client = TestClient(app)
    
    print("=== Testing FastAPI SQLite Database Integration ===")
    
    # 1. Fetch initial stats
    print("\n1. Fetching initial dashboard stats...")
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200, f"Failed to get stats: {response.text}"
    initial_stats = response.json()
    print("Initial stats:", initial_stats)
    
    init_files = initial_stats["total_files_processed"]
    init_threats = initial_stats["total_threats_intercepted"]
    
    # 2. Log first scan (no threat: risk_score=0.0, hits_count=0)
    print("\n2. Logging first scan (non-threat)...")
    payload1 = {
        "scan_id": "scan_test_001",
        "document_context": "Safe Document",
        "risk_score": 0.0,
        "hits_count": 0,
        "recommendation": "PASS_SAFE",
        "has_redacted_image": False
    }
    response = client.post("/api/scans", json=payload1)
    assert response.status_code == 201, f"Failed to post scan: {response.text}"
    print("POST /api/scans response:", response.json())
    assert response.json() == {"status": "success", "message": "Scan logged successfully"}
    
    # 3. Log second scan (threat: risk_score=8.0, hits_count=3)
    print("\n3. Logging second scan (threat)...")
    payload2 = {
        "scan_id": "scan_test_002",
        "document_context": "Government ID",
        "risk_score": 8.0,
        "hits_count": 3,
        "recommendation": "REDACT_MANDATORY",
        "has_redacted_image": True
    }
    response = client.post("/api/scans", json=payload2)
    assert response.status_code == 201, f"Failed to post scan: {response.text}"
    print("POST /api/scans response:", response.json())
    
    # 4. Fetch updated stats
    print("\n4. Fetching updated dashboard stats...")
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200, f"Failed to get stats: {response.text}"
    stats = response.json()
    print("Updated stats:", stats)
    
    assert stats["total_files_processed"] == init_files + 2
    assert stats["total_threats_intercepted"] == init_threats + 1
    
    # Let's verify that the values were correctly committed into SQLite
    db = SessionLocal()
    try:
        asset1 = db.query(Asset).filter(Asset.filename == "scan_scan_test_001").first()
        asset2 = db.query(Asset).filter(Asset.filename == "scan_scan_test_002").first()
        
        assert asset1 is not None, "scan_scan_test_001 not found in database!"
        assert asset2 is not None, "scan_scan_test_002 not found in database!"
        assert asset1.status == "Protected"
        assert asset2.status == "Redacted"
        assert asset1.confidence_before == 0.0
        assert asset2.confidence_before == 8.0
        
        # Verify Alert was created for scan 2
        alert2 = db.query(Alert).filter(Alert.asset_id == asset2.id).first()
        assert alert2 is not None, "Alert not found for scan_scan_test_002!"
        assert alert2.matched_url == "Government ID"
        assert alert2.match_confidence == 0.8
        
        # Verify Action was created for alert 2
        action2 = db.query(Action).filter(Action.alert_id == alert2.id).first()
        assert action2 is not None, "Action not found for alert!"
        assert action2.action_type == "Canvas Redaction"
        assert action2.status == "Completed"
        
        print("[PASS] SQLite transactional writes and constraints verified successfully.")
    finally:
        db.close()
        
    print("\n=== ALL FASTAPI DATABASE INTEGRATION TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_tests()
