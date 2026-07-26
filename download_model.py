import os
import urllib.request

def setup_yolo_model():
    print("[INFO] Starting YOLOv8 Barcode Model download...")
    
    # Create the models directory if it doesn't exist
    base_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(base_dir, "backend", "models")
    os.makedirs(models_dir, exist_ok=True)
    
    model_path = os.path.join(models_dir, "yolov8n_barcode.pt")
    
    # Direct download link to a lightweight open-source YOLO Barcode/QR model
    # (Using a reliable HuggingFace community model link)
    model_url = "https://huggingface.co/Piero2411/YOLOV8s-Barcode-Detection/resolve/main/YOLOV8s_Barcode_Detection.pt"
    
    if os.path.exists(model_path):
        print(f"[OK] Model already exists at: {model_path}")
        return

    try:
        print(f"[INFO] Downloading model from Hugging Face (~22 MB)... Please wait.")
        urllib.request.urlretrieve(model_url, model_path)
        print(f"[SUCCESS] Success! YOLOv8 model saved to: {model_path}")
        print("[INFO] You are now ready to run the Redaction API!")
    except Exception as e:
        print(f"[ERROR] Error downloading the model: {e}")
        print("\nFallback: Please download any YOLOv8 barcode model manually from HuggingFace and place it in the 'models/' folder as 'yolov8n_barcode.pt'")

if __name__ == "__main__":
    setup_yolo_model()