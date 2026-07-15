import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    client = TestClient(app)
    
    print("=== Testing FastAPI In-Memory Scan Ledger ===")
    
    # 1. Fetch initial stats (should be empty/0)
    print("\n1. Fetching initial dashboard stats...")
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200, f"Failed to get stats: {response.text}"
    stats = response.json()
    print("Initial stats:", stats)
    
    assert stats["total_files_processed"] == 0
    assert stats["total_threats_intercepted"] == 0
    assert stats["average_risk_score"] == 0.0
    assert len(stats["recent_scans"]) == 0
    print("[PASS] Initial stats verified.")
    
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
    
    # 3. Log second scan (threat: risk_score=7.5, hits_count=3)
    print("\n3. Logging second scan (threat)...")
    payload2 = {
        "scan_id": "scan_test_002",
        "document_context": "Government ID",
        "risk_score": 7.5,
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
    
    assert stats["total_files_processed"] == 2
    assert stats["total_threats_intercepted"] == 1  # only payload2 has risk_score > 0 or hits_count > 0
    assert stats["average_risk_score"] == 3.75     # (0.0 + 7.5) / 2
    assert len(stats["recent_scans"]) == 2
    assert stats["recent_scans"][0]["scan_id"] == "scan_test_002"  # reverse chronological order
    assert "timestamp" in stats["recent_scans"][0]
    print("[PASS] Updated stats verified.")
    
    print("\n=== ALL FASTAPI ENDPOINT TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_tests()
