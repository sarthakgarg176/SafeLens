import os
import cv2
import numpy as np
import re
import uuid
import logging
import concurrent.futures
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, Response
from rapidocr_onnxruntime import RapidOCR

# 🚀 Ultra-Fast & High-Precision YOLOv8 Engine
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

# 🚀 Fallback Barcode Engine
try:
    import zxingcpp
    ZXING_AVAILABLE = True
except ImportError:
    ZXING_AVAILABLE = False

# 🧠 GLiNER for Context-Aware NER
try:
    from gliner import GLiNER
    GLINER_AVAILABLE = True
except ImportError:
    GLINER_AVAILABLE = False

# -------------------------------------------------------------------
# 1. SETUP & CONFIGURATION
# -------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s - [Redactor] - %(message)s")
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Image Redaction"])

BASE_DIR = Path(__file__).resolve().parent.parent
REDACTED_DIR = BASE_DIR / "storage" / "redacted"
REDACTED_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

logger.info("Initializing RapidOCR ONNX Engine...")
try:
    ocr_engine = RapidOCR()
except Exception as e:
    logger.error(f"Failed to load RapidOCR: {e}")
    ocr_engine = None

gliner_model = None
if GLINER_AVAILABLE:
    logger.info("Initializing GLiNER Model for Context-Aware PII Detection...")
    try:
        gliner_model = GLiNER.from_pretrained("urchade/gliner_small-v2.1")
        logger.info("✅ GLiNER model loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load GLiNER model: {e}")

barcode_model = None
signature_model = None
if YOLO_AVAILABLE:
    yolo_barcode_path = MODELS_DIR / "yolov8n_barcode.pt"
    if yolo_barcode_path.exists():
        try:
            barcode_model = YOLO(str(yolo_barcode_path))
            logger.info("✅ YOLOv8 Barcode model loaded successfully!")
        except Exception as e:
            logger.error(f"Failed to load YOLO Barcode model: {e}")

    yolo_sig_path = MODELS_DIR / "yolov8n_signature.pt"
    if yolo_sig_path.exists():
        try:
            signature_model = YOLO(str(yolo_sig_path))
            logger.info("✅ YOLOv8 Signature model loaded successfully!")
        except Exception as e:
            logger.error(f"Failed to load YOLO Signature model: {e}")

# ✅ FIX 1: Updated Regex Engine for global phones, emails, dates, address/PINs, and IDs
PII_PATTERNS_RAW = {
    "AADHAAR": r"(?<!\d)(\d{4}[\s-]?\d{4}[\s-]?\d{4})(?!\d)",
    "PAN_CARD": r"(?<![A-Z0-9])([A-Z]{5}[0-9]{4}[A-Z])(?![A-Z0-9])",
    "CREDIT_CARD_FULL": r"(?<!\d)(?:\d[ -]*?){13,19}(?!\d)",
    "DOB_EXPIRY": r"(?:DOB|Date of Birth|EXP|Valid Thru|Valid|MONTH/YEAR|THRU)[:\s]*(\d{2}[\/\.-]\d{2,4})|(?<!\d)(\d{2}\/\d{2})(?!\d)",
    "DATE_GENERIC": r"(?i)(?:\d{1,2}[\s\-\./]+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s\-\./]+\d{2,4}|\d{2}[\/\.-]\d{2,4})",
    "PHONE": r"(?<!\d)(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)",
    "PHONE_GLOBAL": r"(?<!\d)\+?[0-9\s\-()]{10,15}(?!\d)",
    "EMAIL": r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
    "ALPHANUM_ID": r"(?<![A-Z0-9])([A-Z]{2,5}\d{4,10})(?![A-Z0-9])",
    "PINCODE_GENERIC": r"\b\d{3}\s?\d{3}\b|\b\d{6}\b|\b7\d{2}[-\s]?\b"  # Matches full/partial Indian PINs
}
COMPILED_PII_PATTERNS = {name: re.compile(pattern, re.IGNORECASE) for name, pattern in PII_PATTERNS_RAW.items()}

# Address & Location Regex Pattern
ADDRESS_KEYWORDS = re.compile(
    r'\b(street|road|st\.?|rd\.?|lane|nagar|colony|sector|block|marg|floor|flat|house|address|s/o|d/o|w/o|c/o|kolkata|mumbai|delhi|bengaluru|chennai|west bengal|maharashtra|uttar pradesh)\b',
    re.IGNORECASE
)

GLINER_LABELS = [
    "person", "candidate name", "mother name", "father name", "address", "location", "street",
    "name", "roll number", "Roll No", "User ID", "ID", "Username", "Ref No.", "Reference",
    "Reference ID", "Reference No", "Reference number"
]

# -------------------------------------------------------------------
# 2. HELPER FUNCTIONS
# -------------------------------------------------------------------
def fast_deskew(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, 100, minLineLength=100, maxLineGap=10)
    
    if lines is None: return img  
    
    angles = [np.degrees(np.arctan2(l[0][3] - l[0][1], l[0][2] - l[0][0])) for l in lines]
    angles = [a for a in angles if -45 < a < 45]
    if not angles: return img
    
    median_angle = np.median(angles)
    if abs(median_angle) < 0.5: return img
    
    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w // 2, h // 2), median_angle, 1.0)
    return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(255, 255, 255))

def resize_for_ocr(img_array: np.ndarray, max_dim: int = 512) -> tuple[np.ndarray, float]:
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

def enhance_image_for_signatures(img: np.ndarray) -> np.ndarray:
    try:
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        return cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    except Exception as e:
        return img

def extract_face_boxes(full_res_img: np.ndarray) -> list:
    boxes = []
    try:
        if hasattr(cv2, 'CascadeClassifier') and hasattr(cv2, 'data'):
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(cascade_path)
            gray = cv2.cvtColor(full_res_img, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=6, minSize=(60, 60))
            for (x, y, w, h) in faces:
                boxes.append({"type": "FACE", "coords": (int(x), int(y), int(x + w), int(y + h))})
    except Exception as e:
        logger.error(f"Face detection failed: {e}")
    return boxes

def extract_signature_boxes(full_res_img: np.ndarray) -> list:
    """🖋️ ENGINE 4: Multi-Scale Canvas YOLO Signature Engine (With Geometry Filtering)"""
    boxes = []
    if signature_model is None:
        return boxes

    try:
        h, w = full_res_img.shape[:2]
        pad_scale = 2.5
        new_h, new_w = int(h * pad_scale), int(w * pad_scale)

        padded_img = np.ones((new_h, new_w, 3), dtype=np.uint8) * 255
        x_off = (new_w - w) // 2
        y_off = (new_h - h) // 2
        padded_img[y_off:y_off+h, x_off:x_off+w] = full_res_img

        def is_valid_signature(box_w, box_h, conf, img_w):
            aspect_ratio = box_w / float(box_h) if box_h > 0 else 0
            if conf >= 0.25 and (aspect_ratio > 1.2 or aspect_ratio < 0.8) and (box_w < img_w * 0.5):
                return True
            return False

        raw_results = signature_model(padded_img, conf=0.15, verbose=False)
        for r in raw_results:
            for box in r.boxes:
                conf = float(box.conf[0].item())
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                cx1 = max(0, min(w, int(x1 - x_off)))
                cy1 = max(0, min(h, int(y1 - y_off)))
                cx2 = max(0, min(w, int(x2 - x_off)))
                cy2 = max(0, min(h, int(y2 - y_off)))

                box_w = cx2 - cx1
                box_h = cy2 - cy1

                if box_w > 10 and box_h > 10 and is_valid_signature(box_w, box_h, conf, w):
                    logger.info(f"🚨 Signature (Raw Canvas) -> Conf: {conf:.2f} | Aspect: {box_w/box_h:.2f}")
                    boxes.append({"type": "SIGNATURE_RAW", "coords": (cx1, cy1, cx2, cy2)})

        enhanced_padded = enhance_image_for_signatures(padded_img)
        enh_results = signature_model(enhanced_padded, conf=0.10, verbose=False)
        for r in enh_results:
            for box in r.boxes:
                conf = float(box.conf[0].item())
                x1, y1, x2, y2 = box.xyxy[0].tolist()

                cx1 = max(0, min(w, int(x1 - x_off)))
                cy1 = max(0, min(h, int(y1 - y_off)))
                cx2 = max(0, min(w, int(x2 - x_off)))
                cy2 = max(0, min(h, int(y2 - y_off)))

                box_w = cx2 - cx1
                box_h = cy2 - cy1

                if box_w > 10 and box_h > 10 and is_valid_signature(box_w, box_h, conf, w):
                    is_duplicate = False
                    for existing_box in boxes:
                        ex1, ey1, ex2, ey2 = existing_box["coords"]
                        if abs((cx1+cx2)/2 - (ex1+ex2)/2) < 20 and abs((cy1+cy2)/2 - (ey1+ey2)/2) < 20:
                            is_duplicate = True
                            break
                    
                    if not is_duplicate:
                        logger.info(f"🚨 Signature (Enh Canvas) -> Conf: {conf:.2f} | Aspect: {box_w/box_h:.2f}")
                        boxes.append({"type": "SIGNATURE_ENH", "coords": (cx1, cy1, cx2, cy2)})

    except Exception as e:
        logger.error(f"Signature Scanning Failed: {e}")

    return boxes

def extract_pii_boxes(ocr_results: list) -> list:
    boxes_to_redact = []
    if not ocr_results: return boxes_to_redact

    parsed_lines = []
    for line in ocr_results:
        if len(line) >= 2:
            box, text = line[0], line[1].strip()
            parsed_lines.append({"box": box, "text": text})

    # 🎯 STRICT ANCHOR PATTERN: Only match exact labels
    anchor_pattern = re.compile(r'\b(candidate signature|signature of candidate|invigilator signature|authorized signatory|signature of invigilator)\b', re.IGNORECASE)
    
    for item in parsed_lines:
        text_lower = item["text"].lower()
        if anchor_pattern.search(text_lower):
            xs, ys = [p[0] for p in item["box"]], [p[1] for p in item["box"]]
            x_min, x_max = min(xs), max(xs)
            y_min, y_max = min(ys), max(ys)
            
            box_width = x_max - x_min
            box_height = y_max - y_min
            
            anchor_x1 = int(max(0, x_min - box_width * 0.1))
            anchor_y1 = int(max(0, y_min - box_height * 2.0))
            anchor_x2 = int(x_max + box_width * 0.1)
            anchor_y2 = int(y_max + box_height * 2.0)
            
            logger.info(f"🚨 Anchor Word Detected -> Masking area around: '{item['text']}'")
            boxes_to_redact.append({
                "type": "ANCHOR_SIGNATURE",
                "coords": (anchor_x1, anchor_y1, anchor_x2, anchor_y2)
            })

    four_digit_blocks = [item for item in parsed_lines if item["text"].replace(" ", "").replace("-", "").isdigit() and 4 <= len(item["text"].replace(" ", "").replace("-", "")) <= 6]
    grouped_blocks, used_indices = [], set()
    for i, block1 in enumerate(four_digit_blocks):
        if i in used_indices: continue
        current_group = [block1]
        used_indices.add(i)
        y1_center = (block1["box"][0][1] + block1["box"][2][1]) / 2

        for j, block2 in enumerate(four_digit_blocks):
            if j in used_indices: continue
            y2_center = (block2["box"][0][1] + block2["box"][2][1]) / 2
            if abs(y1_center - y2_center) < 30:
                current_group.append(block2)
                used_indices.add(j)
        if len(current_group) >= 3:
            grouped_blocks.append(current_group)

    for group in grouped_blocks:
        xs = [p[0] for block in group for p in block["box"]]
        ys = [p[1] for block in group for p in block["box"]]
        boxes_to_redact.append({"type": "CARD_NUMBERS", "coords": (int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys)))})

    box_data = []
    for item in parsed_lines:
        xs, ys = [p[0] for p in item["box"]], [p[1] for p in item["box"]]
        box_data.append({
            "text": item["text"],
            "x_min": min(xs), "x_max": max(xs),
            "y_min": min(ys), "y_max": max(ys),
            "y_center": (min(ys) + max(ys)) / 2,
            "x_center": (min(xs) + max(xs)) / 2
        })

    # 🔥 DIRECT ADDRESS & STREET DETECTION
    for item in box_data:
        if ADDRESS_KEYWORDS.search(item["text"]):
            logger.info(f"🚨 Address Line Detected -> Masking: '{item['text']}'")
            boxes_to_redact.append({
                "type": "ADDRESS_LINE",
                "coords": (int(item["x_min"]), int(item["y_min"]), int(item["x_max"]), int(item["y_max"]))
            })

    # 🎯 STANDARD HORIZONTAL KEY-VALUE ANCHORS (For Table Data)
    kv_anchor_pattern = re.compile(r'\b(father\'?s name|name of candidate|application ref no|roll no|date of birth)\b', re.IGNORECASE)
    
    for i, anchor in enumerate(box_data):
        if kv_anchor_pattern.search(anchor["text"]):
            for value in box_data:
                if value["x_min"] > anchor["x_max"]:  # Strictly to the right
                    if abs(value["y_center"] - anchor["y_center"]) < 15:  # Same line tolerance
                        logger.info(f"🚨 Key-Value Match -> Key: '{anchor['text']}', Masking Value: '{value['text']}'")
                        boxes_to_redact.append({
                            "type": "KV_FORM_DATA",
                            "coords": (int(value["x_min"]), int(value["y_min"]), int(value["x_max"]), int(value["y_max"]))
                        })

    # 🔥 ISOLATED EXTREME DISTANCE MAPPING (For Roll Code / IDs / Ref)
    extreme_id_pattern = re.compile(r'\b(roll\s*code|roll\s*no\.?|ref(?:erence)?\s*no\.?|user\s*id)\b', re.IGNORECASE)
    
    for anchor in box_data:
        if extreme_id_pattern.search(anchor["text"]):
            clean_text = extreme_id_pattern.sub("", anchor["text"]).strip()
            if len(clean_text) > 3:
                box_width = anchor["x_max"] - anchor["x_min"]
                boxes_to_redact.append({
                    "type": "EXTREME_ID_SAME_BOX",
                    "coords": (int(anchor["x_min"] + box_width * 0.35), int(anchor["y_min"]), int(anchor["x_max"]), int(anchor["y_max"]))
                })

            for value in box_data:
                if value == anchor: continue
                
                # Extreme Horizontal: Same row, unlimited X distance
                if value["x_center"] > anchor["x_center"] and abs(value["y_center"] - anchor["y_center"]) < 60:
                    logger.info(f"🚨 Extreme Horizontal ID Match -> Key: '{anchor['text']}', Value: '{value['text']}'")
                    boxes_to_redact.append({
                        "type": "EXTREME_ID_HORZ",
                        "coords": (int(value["x_min"]), int(value["y_min"]), int(value["x_max"]), int(value["y_max"]))
                    })
                
                # Extreme Vertical: Below the key up to 150px
                elif abs(value["x_center"] - anchor["x_center"]) < 100:
                    if value["y_min"] > anchor["y_max"] and (value["y_min"] - anchor["y_max"]) < 150:
                        logger.info(f"🚨 Extreme Vertical ID Match -> Key: '{anchor['text']}', Value: '{value['text']}'")
                        boxes_to_redact.append({
                            "type": "EXTREME_ID_VERT",
                            "coords": (int(value["x_min"]), int(value["y_min"]), int(value["x_max"]), int(value["y_max"]))
                        })

    if gliner_model is not None:
        try:
            MAX_CHUNK_LEN = 1000
            OVERLAP_LINES = 2
            chunks, curr_text, curr_lines = [], "", []
            
            for item in parsed_lines:
                line_str = item["text"] + " \n "
                if len(curr_text) + len(line_str) > MAX_CHUNK_LEN and curr_lines:
                    chunks.append((curr_text, curr_lines))
                    overlap = curr_lines[-OVERLAP_LINES:] if len(curr_lines) > OVERLAP_LINES else []
                    curr_text = "".join([i["text"] + " \n " for i in overlap]) + line_str
                    curr_lines = overlap.copy()
                    curr_lines.append(item)
                else:
                    curr_text += line_str
                    curr_lines.append(item)
            if curr_text: chunks.append((curr_text, curr_lines))

            redacted_indices = set()
            for chunk_idx, (chunk_text, chunk_lines) in enumerate(chunks):
                entities = gliner_model.predict_entities(chunk_text, GLINER_LABELS, threshold=0.30)
                detected_pii_texts = set([e["text"].strip().lower() for e in entities if len(e["text"].strip()) > 2])
                
                for item in chunk_lines:
                    line_id = str(item["box"])
                    if line_id in redacted_indices: continue
                    text_lower = item["text"].lower()
                    for entity in detected_pii_texts:
                        if entity in text_lower:
                            xs, ys = [p[0] for p in item["box"]], [p[1] for p in item["box"]]
                            boxes_to_redact.append({
                                "type": "GLINER_PII",
                                "coords": (int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys)))
                            })
                            redacted_indices.add(line_id)
                            break
        except Exception as e:
            logger.error(f"GLiNER Sliding Window prediction failed: {e}")

    for item in parsed_lines:
        box, text = item["box"], item["text"]
        for pii_type, pattern in COMPILED_PII_PATTERNS.items():
            if pattern.search(text):
                xs, ys = [p[0] for p in box], [p[1] for p in box]
                boxes_to_redact.append({"type": pii_type, "coords": (int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys)))})
                break
    return boxes_to_redact

def extract_barcode_boxes(full_res_img: np.ndarray) -> list:
    boxes = []
    img_h, img_w = full_res_img.shape[:2]
    def add_box(xs, ys, b_type):
        xmin, xmax = max(0, int(min(xs))), min(img_w, int(max(xs)))
        ymin, ymax = max(0, int(min(ys))), min(img_h, int(max(ys)))
        if (xmax - xmin) > 10 and (ymax - ymin) > 10:
            boxes.append({"type": b_type, "coords": (xmin, ymin, xmax, ymax)})

    if barcode_model is not None:
        try:
            results = barcode_model(full_res_img, verbose=False)
            for r in results:
                for box in r.boxes:
                    if box.conf[0].item() > 0.15:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        add_box([x1, x2], [y1, y2], "YOLO_BARCODE/QR")
            if boxes: return boxes
        except Exception as e:
            pass

    try:
        if ZXING_AVAILABLE:
            for r in zxingcpp.read_barcodes(full_res_img):
                p = r.position
                add_box([p.top_left.x, p.top_right.x, p.bottom_right.x, p.bottom_left.x],
                        [p.top_left.y, p.top_right.y, p.bottom_right.y, p.bottom_left.y], f"ZXING_{r.format}")
    except Exception: pass
    return boxes

def run_ocr_pipeline(img: np.ndarray):
    """Isolated OCR worker with Smart ROI Cropping."""
    if ocr_engine is None: return []
    
    img_h, img_w = img.shape[:2]
    crop_ratio = 1.0 
    crop_h = int(img_h * crop_ratio)
    
    roi_img = img[:crop_h, :]
    
    ocr_ready_img, scale_factor = resize_for_ocr(roi_img, max_dim=512)
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
# 3. MAIN REDACTION ROUTE
# -------------------------------------------------------------------
THREAD_POOL = concurrent.futures.ThreadPoolExecutor(max_workers=8)

@router.post("/process-image")
async def process_image(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    logger.info(f"📥 Step 1/5: Received file for redaction -> '{file.filename}'")
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        raw_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if raw_img is None: raise ValueError("Invalid image file.")

        img = fast_deskew(raw_img)
        original_img = img.copy()

        future_faces = THREAD_POOL.submit(extract_face_boxes, img)
        future_barcodes = THREAD_POOL.submit(extract_barcode_boxes, img)
        future_signatures = THREAD_POOL.submit(extract_signature_boxes, img)
        future_text = THREAD_POOL.submit(run_ocr_pipeline, img)

        face_boxes = future_faces.result()
        barcode_boxes = future_barcodes.result()
        sig_boxes = future_signatures.result()
        text_boxes = future_text.result()

        pii_boxes = text_boxes + barcode_boxes + face_boxes + sig_boxes
        logger.info(f"📊 Step 4/5: Extraction Complete -> Found {len(text_boxes)} Text, {len(barcode_boxes)} Barcode, {len(face_boxes)} Face, {len(sig_boxes)} Signature.")

        # ✅ Handle CLEAN / NO-PII images properly
        if not pii_boxes:
            logger.info("🟢 No PII found. Returning original image stream with CLEAN status.")
            return Response(
                content=contents, 
                media_type=file.content_type or "image/jpeg",
                headers={
                    "X-Redacted-Status": "CLEAN",
                    "X-PII-Count": "0"
                }
            )

        for box_data in pii_boxes:
            x_min, y_min, x_max, y_max = box_data["coords"]
            padding = 15 if box_data["type"] == "FACE" else 8
            cv2.rectangle(original_img, (max(0, x_min - padding), max(0, y_min - padding)), 
                          (min(original_img.shape[1], x_max + padding), min(original_img.shape[0], y_max + padding)), 
                          (0, 0, 0), -1)

        output_filename = f"redacted_{uuid.uuid4().hex[:8]}_{file.filename}"
        output_path = REDACTED_DIR / output_filename
        
        background_tasks.add_task(cv2.imwrite, str(output_path), original_img)
        _, encoded_buffer = cv2.imencode(".jpg", original_img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        
        return Response(
            content=encoded_buffer.tobytes(), 
            media_type="image/jpeg", 
            headers={
                "X-Redacted-Status": "REDACTED", 
                "X-PII-Count": str(len(pii_boxes)),
                "Content-Disposition": f'inline; filename="{output_filename}"'
            }
        )
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal Processing Error: {str(e)}")