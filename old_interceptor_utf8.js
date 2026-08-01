/**
 * interceptor.js (Tri-Layer Smart PII Redaction - Synced with Backend V2)
 * Handles client-side file swapping and syncs with FastAPI /api/v2/process-upload endpoint.
 */

(function () {
  const EXT_NAME = 'SafeLens Privacy Shield AI';

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function getImageDimensions(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }

  // Broad Client-side check for sensitive patterns & keywords
  function containsPIIText(text) {
    if (!text) return false;
    const t = text.toUpperCase();
    
    const keywords = ['AADHAAR', 'INCOME TAX', 'PERMANENT', 'DOB', 'GOVT', 'GOVERNMENT', 'CREDIT', 'DEBIT', 'MASTERCARD', 'VISA', 'ELECTION', 'SIGNATURE'];
    if (keywords.some(k => t.includes(k))) return true;

    // Loose regex to catch messy OCR
    const aadhaarPattern = /\d{4}[\s-]?\d{4}[\s-]?\d{4}/; 
    const creditCardPattern = /\b(?:\d[ -]*?){13,16}\b/;
    const panPattern = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
    
    return aadhaarPattern.test(t) || creditCardPattern.test(t) || panPattern.test(t);
  }

  // ==========================================
  // 1. CANVAS PII BLACK-BOX REDACTION ENGINE
  // ==========================================
  function createRedactedImage(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = '#000000';

        const boxWidth = Math.floor(canvas.width * 0.75);
        const boxHeight = Math.max(32, Math.floor(canvas.height * 0.085));
        const startX = (canvas.width - boxWidth) / 2;

        const y1 = Math.floor(canvas.height * 0.62);
        ctx.fillRect(startX, y1, boxWidth, boxHeight);

        const y2 = Math.floor(canvas.height * 0.42);
        ctx.fillRect(startX, y2, boxWidth, boxHeight);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.max(14, Math.floor(boxHeight * 0.38))}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ΓûêΓûêΓûêΓûê [CONFIDENTIAL PII REDACTED] ΓûêΓûêΓûêΓûê', canvas.width / 2, y1 + boxHeight / 2);
        ctx.fillText('ΓûêΓûêΓûêΓûê [CONFIDENTIAL PII REDACTED] ΓûêΓûêΓûêΓûê', canvas.width / 2, y2 + boxHeight / 2);

        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.55)';
        const fontSize = Math.max(26, Math.floor(canvas.width / 12));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText('SAFELENS DECOY - PII PROTECTED', 0, 0);
        ctx.restore();

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          const redactedFile = new File([blob], `redacted_${file.name}`, { type: file.type || 'image/png' });
          resolve(redactedFile);
        }, file.type || 'image/png');
      };
      img.src = url;
    });
  }

  // ==========================================
  // SMART FILE INTERCEPTOR & SWAPPER
  // ==========================================
  async function handleFile(file, inputEl) {
    console.log(`[${EXT_NAME}] Scanning file "${file.name}" for PII...`);
    const dataUrl = await fileToDataURL(file);

    chrome.runtime.sendMessage(
      { action: 'PROCESS_UPLOAD', payload: { fileDataUrl: dataUrl, targetUrl: window.location.href } },
      async (response) => {
        let isPiiDetected = false;

        // LAYER 1: BACKEND V2 CHECK (Synced with new process_upload.py response)
        if (chrome.runtime.lastError) {
            console.warn(`[${EXT_NAME}] Backend unreachable. Falling back to Client-Side Heuristics...`);
        } else if (response) {
           if (response.redaction_applied === true || response.decoy_applied === true || response.status === 'DECOYED' || response.pii_found === true) {
               isPiiDetected = true;
           }
           if (response.extractedText && containsPIIText(response.extractedText)) isPiiDetected = true;
           if (response.pii_boxes && response.pii_boxes.length > 0) isPiiDetected = true;
        }

        // LAYER 2: SMART FILENAME FALLBACK
        const filename = file.name.toLowerCase();
        const sensitiveKeywords = ['aadhaar', 'aadhar', 'pan', 'card', 'credit', 'debit', 'id', 'passport', 'license', 'tax', 'kyc'];
        if (sensitiveKeywords.some(kw => filename.includes(kw))) {
            isPiiDetected = true;
        }

        // LAYER 3: GEOMETRIC ASPECT RATIO (The Hackathon Secret Sauce)
        if (!isPiiDetected) {
           const safeKeywords = ['book', 'index', 'page', 'nature', 'selfie', 'profile'];
           if (!safeKeywords.some(kw => filename.includes(kw))) {
               const dims = await getImageDimensions(file);
               const aspectRatio = dims.width / dims.height;
               
               // ID Cards are landscape (wider than tall). Standard ratio is ~1.58
               if (aspectRatio >= 1.3 && aspectRatio <= 1.9) {
                   console.log(`[${EXT_NAME}] Geometric Heuristic Triggered: ID Card format detected (Ratio: ${aspectRatio.toFixed(2)}).`);
                   isPiiDetected = true;
               }
           }
        }

        const dataTransfer = new DataTransfer();

        if (!isPiiDetected) {
          // CLEAN IMAGE (e.g., Book Index, Scenery)
          console.log(`[${EXT_NAME}] Clean image (No PII). Restoring original.`);
          dataTransfer.items.add(file);
          inputEl.dataset.safelensBypass = 'true';
          inputEl.files = dataTransfer.files;

          window.dispatchEvent(new CustomEvent('safelens:notify', {
              detail: { status: 'success', message: 'Image scanned: No sensitive PII. Upload allowed.' }
          }));
        } else {
          // SENSITIVE IMAGE (e.g., ID Cards)
          console.log(`[${EXT_NAME}] Sensitive PII detected! Generating single redacted copy...`);
          const redactedFile = await createRedactedImage(file);
          dataTransfer.items.add(redactedFile);
          inputEl.dataset.safelensBypass = 'true';
          inputEl.files = dataTransfer.files;

          window.dispatchEvent(new CustomEvent('safelens:notify', {
              detail: { status: 'success', message: 'Sensitive PII detected! Image auto-protected & redacted.' }
          }));
        }

        // ≡ƒöÑ Force Website to update preview
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
    );
  }

  // ==========================================
  // 2. TEXT FORM INTERCEPTOR LOGIC
  // ==========================================
  async function handleFormSubmit(e) {
    if (e.target.tagName !== 'FORM') return;
    e.preventDefault(); 

    const form = e.target;
    const formData = new FormData(form);
    const formPayload = Object.fromEntries(formData.entries());

    chrome.runtime.sendMessage(
      { action: 'PROCESS_TEXT_FORM', payload: formPayload },
      (response) => {
        if (chrome.runtime.lastError) return;
        
        const isSuccess = response && (
          response.status === 'success' || response.status === 'SUCCESS' || response.status === 'DECOYED' || response.decoy_applied !== undefined || response.success === true
        );

        window.dispatchEvent(new CustomEvent('safelens:notify', {
            detail: {
              status: isSuccess ? 'success' : 'error',
              message: isSuccess ? 'Sensitive Form Data Swapped with Synthetic Decoy!' : 'Form Protection failed.'
            }
        }));
      }
    );
  }

  // ==========================================
  // 3. EVENT DELEGATION INITIALIZATION
  // ==========================================
  function initInterceptors() {
    document.addEventListener('submit', handleFormSubmit, true);

    document.addEventListener('change', (e) => {
      if (e.target.tagName === 'INPUT' && e.target.type === 'file') {
        
        if (e.target.dataset.safelensBypass === 'true') {
          e.target.dataset.safelensBypass = 'false'; 
          return; 
        }

        const files = e.target.files;
        if (files && files.length > 0 && files[0].type.startsWith('image/')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          handleFile(files[0], e.target);
        }
      }
    }, true);
  }

  initInterceptors();
})();
