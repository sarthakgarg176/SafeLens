import unittest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import the actual FastAPI app and db sessions
from app.main import app
from app.database.connection import Base, get_db
from app.database.models import Asset, Alert, Action
from app.api.incidents import IncidentCreate
from datetime import datetime, timezone

# We will override the database dependency to use a clean test database file
class TestBackendAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db_file = "./test_safelens.db"
        if os.path.exists(cls.db_file):
            try:
                os.remove(cls.db_file)
            except Exception:
                pass

        cls.engine = create_engine(f"sqlite:///{cls.db_file}", connect_args={"check_same_thread": False})
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        Base.metadata.create_all(bind=cls.engine)

        # Override get_db in FastAPI
        def override_get_db():
            db = cls.SessionLocal()
            try:
                yield db
            finally:
                db.close()
        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=cls.engine)
        app.dependency_overrides.clear()
        
        # Close engine connections to unlock the file
        cls.engine.dispose()
        if os.path.exists(cls.db_file):
            try:
                os.remove(cls.db_file)
            except Exception:
                pass

    def setUp(self):
        # Seed test data for each run
        self.db = self.SessionLocal()
        
        # Clean existing rows
        self.db.query(Action).delete()
        self.db.query(Alert).delete()
        self.db.query(Asset).delete()
        self.db.commit()

        # Seed mock asset
        self.mock_asset = Asset(
            id=1,
            filename="test.png",
            status="Protected",
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(self.mock_asset)
        self.db.commit()
        self.db.refresh(self.mock_asset)

    def tearDown(self):
        self.db.close()

    def test_create_incident_uniqueness_and_idempotency(self):
        payload = {
            "asset_id": 1,
            "matched_url": "http://site1.com",
            "match_confidence": 0.95,
            "severity": "Normal",
            "status": "Open"
        }

        # 1. First POST: Incident is created successfully
        res1 = self.client.post("/api/incidents", json=payload)
        self.assertEqual(res1.status_code, 200)
        data1 = res1.json()
        self.assertTrue(data1["success"])
        self.assertEqual(data1["message"], "Incident created successfully")
        incident_id = data1["data"]["incident_id"]

        # 2. Second POST: Try to create again for same asset_id, should return "already logged" (idempotency)
        res2 = self.client.post("/api/incidents", json=payload)
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        self.assertTrue(data2["success"])
        self.assertEqual(data2["message"], "Incident already logged")
        self.assertEqual(data2["data"]["incident_id"], incident_id)

        # 3. Database check: Verify only 1 row exists
        alerts = self.db.query(Alert).filter(Alert.asset_id == 1).all()
        self.assertEqual(len(alerts), 1)

    def test_report_generation_and_static_serving(self):
        # 1. Create a mock alert (incident) and decision (action)
        alert = Alert(
            id=10,
            asset_id=1,
            matched_url="http://site1.com",
            match_confidence=0.9,
            severity="Normal",
            status="Open",
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(alert)
        self.db.commit()

        action = Action(
            id=20,
            alert_id=10,
            action_type="Confirm",
            status="Pending",
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(action)
        self.db.commit()

        # 2. Call /api/report to generate report
        res = self.client.post("/api/report?incident_id=10")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["message"], "Report generated")
        
        download_url = data["data"]["download_url"]
        report_id = data["data"]["report_id"]
        
        # Verify download URL structure
        self.assertEqual(download_url, f"http://localhost:8000/storage/reports/report_{report_id}.pdf")

        # 3. Physically create the mock report file in the local filesystem storage path
        report_filename = f"report_{report_id}.pdf"
        report_file_dir = "app/storage/reports"
        os.makedirs(report_file_dir, exist_ok=True)
        report_file_path = os.path.join(report_file_dir, report_filename)
        
        with open(report_file_path, "w") as f:
            f.write("Mock PDF Content")

        try:
            # 4. Request the download URL statically via TestClient (request path /storage/reports/...)
            relative_url = f"/storage/reports/report_{report_id}.pdf"
            res_download = self.client.get(relative_url)
            self.assertEqual(res_download.status_code, 200)
            self.assertEqual(res_download.text, "Mock PDF Content")
        finally:
            # Clean up test file
            if os.path.exists(report_file_path):
                try:
                    os.remove(report_file_path)
                except Exception:
                    pass

if __name__ == "__main__":
    unittest.main()
