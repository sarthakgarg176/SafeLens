import os
import cv2
import numpy as np
import re
import uuid
import logging
import concurrent.futures
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, Response
from rapidocr_onnxruntime import RapidOCR

# 🚀 Ultra-Fast & High-Precision Barcode/QR Engine
try:
    import zxingcpp
    ZXING_AVAILABLE = True
except Exception as e:
    ZXING_AVAILABLE = False

# -------------------------------------------------------------------
# 1. SETUP & CONFIGURATION
# -------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s - [Redactor] - %(message)s")
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Image Redaction"])

# Persistent High-Performance Thread Pool for Parallel Execution
executor = concurrent.futures.ThreadPoolExecutor(max_workers=6)

logger.info("Initializing RapidOCR ONNX Engine...")
try:
    ocr_engine = RapidOCR()
except Exception as e:
    logger.error(f"Failed to load RapidOCR: {e}")
    ocr_engine = None

BASE_DIR = Path(__file__).resolve().parent.parent
REDACTED_DIR = BASE_DIR / "storage" / "redacted"
REDACTED_DIR.mkdir(parents=True, exist_ok=True)

PII_PATTERNS_RAW = {
    "AADHAAR": r"(?<!\d)(\d{4}[\s-]?\d{4}[\s-]?\d{4})(?!\d)",
    "PAN_CARD": r"(?<![A-Z0-9])([A-Z]{5}[0-9]{4}[A-Z])(?![A-Z0-9])",
    "CREDIT_CARD": r"(?<!\d)(?:\d[ -]*?){13,19}(?!\d)",
    "DOB_EXPIRY": r"(?:DOB|Date of Birth|EXP|Valid Thru|Valid|MONTH/YEAR|THRU)[:\s]*(\d{2}[\/\.-]\d{2,4})|(?<!\d)(\d{2}\/\d{2})(?!\d)",
    "NAME_LINE": r"^[A-Z]{3,15}\s+[A-Z]{3,15}$",  # Matches names like PETER PAN
    "PHONE": r"(?<!\d)(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)"
}
COMPILED_PII_PATTERNS = {name: re.compile(pattern, re.IGNORECASE) for name, pattern in PII_PATTERNS_RAW.items()}

# -------------------------------------------------------------------
# 2. HELPER FUNCTIONS
# -------------------------------------------------------------------
def fast_deskew(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=100, maxLineGap=10)
    
    if lines is None:
        return img  
    
    angles = [np.degrees(np.arctan2(l[0][3] - l[0][1], l[0][2] - l[0][0])) for l in lines]
    angles = [a for a in angles if -45 < a < 45]
    
    if not angles:
        return img
    
    median_angle = np.median(angles)
    if abs(median_angle) < 0.5:  
        return img
    
    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w // 2, h // 2), median_angle, 1.0)
    return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(255, 255, 255))

def resize_for_ocr(img_array: np.ndarray, max_dim: int = 512) -> tuple[np.ndarray, float]:
    """Downscaled to 512px for ultra-fast ONNX OCR scanning (~3x speedup)."""
    h, w = img_array.shape[:2]
    if max(h, w) <= max_dim:
        return img_array, 1.0 
    scale = max_dim / float(max(h, w))
    return cv2.resize(img_array, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA), scale

def preprocess_image(img_array: np.ndarray) -> np.ndarray:
    try:
        gray = cv2.cvtColor(img_array, cv2.COLOR_BGR2GRAY)
        return cv2.cvtColor(cv2.addWeighted(gray, 1.2, gray, 0, -0.2), cv2.COLOR_GRAY2BGR)
    except:
        return img_array

def extract_pii_boxes(ocr_results: list) -> list:
    boxes = []
    if not ocr_results: return boxes
    for line in ocr_results:
        if len(line) < 2: continue
        box, text = line[0], line[1]
        for pii_type, pattern in COMPILED_PII_PATTERNS.items():
            if pattern.search(text):
                logger.info(f"🚨 PII Detected -> Type: {pii_type} | Text: {text}")
                xs, ys = [p[0] for p in box], [p[1] for p in box]
                boxes.append({"type": pii_type, "coords": (int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys)))})
                break
    return boxes

def extract_barcode_boxes(full_res_img: np.ndarray) -> list:
    """Multi-Engine barcode scanner with multi-scale target scanning."""
    boxes = []
    img_h, img_w = full_res_img.shape[:2]
    
    def add_box(xs, ys, b_type):
        xmin, xmax = max(0, int(min(xs))), min(img_w, int(max(xs)))
        ymin, ymax = max(0, int(min(ys))), min(img_h, int(max(ys)))
        w, h = xmax - xmin, ymax - ymin
        if w > 10 and h > 10 and (w * h) < (img_h * img_w * 0.90):
            logger.info(f"🚨 PII Detected -> Type: {b_type} | Coords: ({xmin}, {ymin}, {xmax}, {ymax})")
            boxes.append({"type": b_type, "coords": (xmin, ymin, xmax, ymax)})

    scales_to_try = [(full_res_img, 1.0)]
    if max(img_h, img_w) > 1000:
        scale = 1000.0 / max(img_h, img_w)
        resized = cv2.resize(full_res_img, (int(img_w * scale), int(img_h * scale)), interpolation=cv2.INTER_AREA)
        scales_to_try.append((resized, scale))

    for scan_img, scale in scales_to_try:
        if boxes: break
        
        # ENGINE 1: ZXING-CPP
        if ZXING_AVAILABLE:
            try:
                for r in zxingcpp.read_barcodes(scan_img):
                    p = r.position
                    xs = [p.top_left.x/scale, p.top_right.x/scale, p.bottom_right.x/scale, p.bottom_left.x/scale]
                    ys = [p.top_left.y/scale, p.top_right.y/scale, p.bottom_right.y/scale, p.bottom_left.y/scale]
                    add_box(xs, ys, f"ZXING_{r.format}")
            except Exception as e:
                logger.debug(f"ZXing Exception: {e}")

        # ENGINE 2: PYZBAR
        if not boxes:
            try:
                from pyzbar import pyzbar
                gray = cv2.cvtColor(scan_img, cv2.COLOR_BGR2GRAY)
                for obj in pyzbar.decode(gray):
                    r = obj.rect
                    xs = [r.left/scale, (r.left + r.width)/scale]
                    ys = [r.top/scale, (r.top + r.height)/scale]
                    add_box(xs, ys, f"PYZBAR_{obj.type}")
            except Exception as e:
                logger.debug(f"PyZBar Exception: {e}")

        # ENGINE 3: OPENCV
        if not boxes:
            try:
                ret, _, pts, _ = cv2.QRCodeDetector().detectAndDecodeMulti(scan_img)
                if ret and pts is not None:
                    for p in pts:
                        xs = [pt[0]/scale for pt in p]
                        ys = [pt[1]/scale for pt in p]
                        add_box(xs, ys, "CV2_QR")
            except: pass

    # ENGINE 4: VISUAL PATTERN SCANNER
    if not boxes:
        try:
            gray = cv2.cvtColor(full_res_img, cv2.COLOR_BGR2GRAY)
            blur = cv2.GaussianBlur(gray, (5, 5), 0)
            thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
            
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
            closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            
            contours, _ = cv2.findContours(closed, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
            
            for cnt in contours:
                x, y, w, h = cv2.boundingRect(cnt)
                aspect_ratio = float(w) / h
                area = w * h
                
                if 0.75 <= aspect_ratio <= 1.35 and (img_h * img_w * 0.01 < area < img_h * img_w * 0.40):
                    roi = gray[y:y+h, x:x+w]
                    if np.std(roi) > 30:
                        add_box([x, x+w], [y, y+h], "VISUAL_QR_PATTERN")
        except Exception as e:
            logger.debug(f"Visual Pattern Scan failed: {e}")

    return boxes

def run_ocr_pipeline(img: np.ndarray) -> list:
    """Runs OCR inference on worker thread."""
    if ocr_engine is None: return []
    ocr_ready_img, scale_factor = resize_for_ocr(img, max_dim=512)
    processed_img = preprocess_image(ocr_ready_img)
    ocr_results, _ = ocr_engine(processed_img)
    text_boxes = extract_pii_boxes(ocr_results)
    
    if scale_factor != 1.0:
        for box in text_boxes:
            x_min, y_min, x_max, y_max = box["coords"]
            box["coords"] = (int(x_min / scale_factor), int(y_min / scale_factor), 
                             int(x_max / scale_factor), int(y_max / scale_factor))
    return text_boxes

# -------------------------------------------------------------------
# 3. MAIN REDACTION ROUTE (FAST MULTITHREADED)
# -------------------------------------------------------------------
@router.post("/process-image")
async def process_image(file: UploadFile = File(...)):
    logger.info(f"📥 Step 1/4: Received upload -> '{file.filename}'")
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        raw_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if raw_img is None: raise ValueError("Invalid image file.")

        img = fast_deskew(raw_img)
        original_img = img.copy()

        # ⚡ MULTITHREADED PARALLEL PIPELINE: Barcode & Text OCR run simultaneously
        logger.info("⚡ Step 2/4: Running parallel extraction threads (Barcode Engine + ONNX Text OCR)...")
        future_barcodes = executor.submit(extract_barcode_boxes, img)
        future_text = executor.submit(run_ocr_pipeline, img)

        barcode_boxes = future_barcodes.result()
        text_boxes = future_text.result()

        pii_boxes = text_boxes + barcode_boxes
        logger.info(f"📊 Step 3/4: Extraction Done -> Found {len(text_boxes)} Text PII, {len(barcode_boxes)} Barcode/QR regions.")

        if not pii_boxes:
            logger.info("✅ No PII or Barcodes detected. Returning original image.")
            return Response(
                content=contents, 
                media_type=file.content_type or "image/jpeg",
                headers={"X-Redacted-Status": "CLEAN", "X-PII-Count": "0", "Access-Control-Expose-Headers": "X-Redacted-Status, X-PII-Count"}
            )

        logger.info(f"✍️ Step 4/4: Redacting {len(pii_boxes)} identified PII / Barcode regions...")
        for box_data in pii_boxes:
            x_min, y_min, x_max, y_max = box_data["coords"]
            cv2.rectangle(original_img, (max(0, x_min - 4), max(0, y_min - 4)), 
                          (min(original_img.shape[1], x_max + 4), min(original_img.shape[0], y_max + 4)), 
                          (0, 0, 0), -1)

        output_path = REDACTED_DIR / f"redacted_{uuid.uuid4().hex[:8]}_{file.filename}"
        cv2.imwrite(str(output_path), original_img)
        logger.info(f"🎉 Processing complete! Saved redacted image to: {output_path}")
        return FileResponse(
            path=output_path, 
            media_type="image/jpeg", 
            filename=output_path.name,
            headers={
                "X-Redacted-Status": "REDACTED",
                "X-PII-Count": str(len(pii_boxes)),
                "Access-Control-Expose-Headers": "X-Redacted-Status, X-PII-Count"
            }
        )

    except Exception as e:
        logger.error(f"❌ Image Redaction Pipeline Failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Processing Error: {str(e)}")