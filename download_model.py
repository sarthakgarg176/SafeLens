import os
import shutil
import urllib.request

try:
    from huggingface_hub import hf_hub_download
    HF_HUB_AVAILABLE = True
except ImportError:
    HF_HUB_AVAILABLE = False


def setup_models():
    print("==================================================")
    print("[START] Starting SafeLens Models Auto-Setup Engine")
    print("==================================================\n")

    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    if base_dir.endswith("backend"):
        models_dir = os.path.join(base_dir, "models")
    else:
        models_dir = os.path.join(base_dir, "backend", "models")
        
    os.makedirs(models_dir, exist_ok=True)

    # -------------------------------------------------------------
    # 1. DOWNLOAD YOLO BARCODE / QR MODEL
    # -------------------------------------------------------------
    barcode_path = os.path.join(models_dir, "yolov8n_barcode.pt")
    barcode_url = "https://huggingface.co/Piero2411/YOLOV8s-Barcode-Detection/resolve/main/YOLOV8s_Barcode_Detection.pt"

    print("[1/2] Checking YOLOv8 Barcode/QR Model...")
    if os.path.exists(barcode_path):
        print(f"   -> [OK] Barcode model already exists at: {barcode_path}\n")
    else:
        try:
            print(f"   -> [INFO] Downloading Barcode/QR model (~22 MB)... Please wait.")
            urllib.request.urlretrieve(barcode_url, barcode_path)
            print(f"   -> [SUCCESS] Barcode model saved to: {barcode_path}\n")
        except Exception as e:
            print(f"   -> [ERROR] Error downloading Barcode model: {e}\n")

    # -------------------------------------------------------------
    # 2. DOWNLOAD YOLO SIGNATURE DETECTION MODEL
    # -------------------------------------------------------------
    sig_path = os.path.join(models_dir, "yolov8n_signature.pt")
    
    print("[2/2] Checking YOLOv8 Signature Model...")
    if os.path.exists(sig_path):
        print(f"   -> [OK] Signature model already exists at: {sig_path}\n")
    else:
        print(f"   -> [INFO] Downloading Signature model (~5.5 MB)... Please wait.")
        download_success = False

        if HF_HUB_AVAILABLE:
            try:
                downloaded_file = hf_hub_download(
                    repo_id="liberty666/yolo11n-chinese-signature", 
                    filename="best.pt"
                )
                shutil.copy(downloaded_file, sig_path)
                download_success = True
                print(f"   -> [SUCCESS] Signature model saved to: {sig_path}\n")
            except Exception as e:
                print(f"   -> [WARNING] HF Hub download failed ({e}), falling back to direct URL...")

        if not download_success:
            try:
                sig_url = "https://huggingface.co/liberty666/yolo11n-chinese-signature/resolve/main/best.pt"
                urllib.request.urlretrieve(sig_url, sig_path)
                print(f"   -> [SUCCESS] Signature model saved via direct link to: {sig_path}\n")
            except Exception as e:
                print(f"   -> [ERROR] Error downloading Signature model: {e}\n")

    print("==================================================")
    print("[DONE] Model Setup Complete! You are ready to run SafeLens.")
    print("==================================================")


if __name__ == "__main__":
    setup_models()