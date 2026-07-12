import sys
import requests
import io
import json
from PIL import Image

def run_e2e_check():
    base_url = "http://127.0.0.1:8000"
    print("--- SafeLens E2E Validation ---")

    # 1. Health check
    try:
        res = requests.get(f"{base_url}/api/health")
        assert res.status_code == 200, f"Health check failed: {res.status_code}"
        print("[PASS] Health Check")
    except Exception as e:
        print(f"[FAIL] Health Check: {e}")
        sys.exit(1)

    # 2. Dashboard status check
    try:
        res = requests.get(f"{base_url}/api/dashboard")
        assert res.status_code == 200, f"Dashboard check failed: {res.status_code}"
        data = res.json()
        assert data["success"] is True
        print("[PASS] Dashboard Fetch")
    except Exception as e:
        print(f"[FAIL] Dashboard Fetch: {e}")
        sys.exit(1)

    # 3. Protect Image API check
    try:
        # Create a dummy image
        img_byte_arr = io.BytesIO()
        image = Image.new("RGB", (100, 100), color="blue")
        image.save(img_byte_arr, format="PNG")
        img_byte_arr.seek(0)

        files = {"image": ("dummy.png", img_byte_arr, "image/png")}
        data = {"settings": json.dumps({"autoProtect": True, "protectionMode": "redact"})}

        res = requests.post(f"{base_url}/api/protect", files=files, data=data)
        assert res.status_code == 200, f"Protect failed: {res.text}"
        res_data = res.json()
        assert res_data["success"] is True
        asset_id = res_data["data"]["asset_id"]
        thumbnail_url = res_data["data"]["thumbnail_path"]
        print(f"[PASS] Protect Image API (Generated asset ID: {asset_id})")
        print(f"       Thumbnail URL: {thumbnail_url}")

        # Try to download the thumbnail statically
        res_thumb = requests.get(thumbnail_url)
        assert res_thumb.status_code == 200, f"Thumbnail download failed: {res_thumb.status_code}"
        print("[PASS] Static Thumbnail Serving")
    except Exception as e:
        print(f"[FAIL] Protect / Static serving: {e}")
        sys.exit(1)

    # 4. Incident creation check
    try:
        payload = {
            "asset_id": asset_id,
            "matched_url": "https://test.com/upload",
            "match_confidence": 0.88,
            "severity": "Serious",
            "status": "Open"
        }
        res = requests.post(f"{base_url}/api/incidents", json=payload)
        assert res.status_code == 200, f"Incident creation failed: {res.text}"
        res_data = res.json()
        assert res_data["success"] is True
        incident_id = res_data["data"]["incident_id"]
        print(f"[PASS] Incident Creation API (Generated incident ID: {incident_id})")

        # Test idempotency (should return successfully with the same incident ID)
        res_idem = requests.post(f"{base_url}/api/incidents", json=payload)
        assert res_idem.status_code == 200
        assert res_idem.json()["data"]["incident_id"] == incident_id
        print("[PASS] Incident Uniqueness and Idempotency")
    except Exception as e:
        print(f"[FAIL] Incident creation: {e}")
        sys.exit(1)

    # 5. Report generation and download check
    try:
        res = requests.post(f"{base_url}/api/report?incident_id={incident_id}")
        assert res.status_code == 200, f"Report generation failed: {res.text}"
        res_data = res.json()
        assert res_data["success"] is True
        download_url = res_data["data"]["download_url"]
        print(f"[PASS] Report Generation API")
        print(f"       Download URL: {download_url}")

        # Request report statically
        res_report = requests.get(download_url)
        assert res_report.status_code == 200, f"Report download failed: {res_report.status_code}"
        print("[PASS] Static Report serving")
    except Exception as e:
        print(f"[FAIL] Report / serving: {e}")
        sys.exit(1)

    print("\n>>> ALL BACKEND E2E CHECKS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    run_e2e_check()
