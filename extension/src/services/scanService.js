import { preprocessImage } from '../ai/preprocessing/preprocessImage.js';
import { recognizeImage } from '../ai/ocr/recognizeImage.js';
import { scanText } from '../ai/detection/regexDetector.js';
import { mergeOverlappingDetections } from '../ai/detection/mergeDetections.js';
import { analyzeRisk } from '../ai/detection/riskAnalyzer.js';

// MANDATORY EXPORT FOR BUILD SUCCESS
export async function fileToCanvas(file) {
  if (!file) throw new TypeError('File parameter is required');

  if (typeof document === 'undefined') {
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || 'image/png' });
    const imageBitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(imageBitmap, 0, 0);
    return canvas;
  } else {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);
          resolve(canvas);
        };
        img.onerror = (e) => reject(new Error(`Failed to decode image: ${e}`));
        img.src = event.target.result;
      };
      reader.onerror = (e) => reject(new Error(`Failed to read file: ${e}`));
      reader.readAsDataURL(file);
    });
  }
}

// Custom Offscreen Bridge for OpenCV Preprocessing
async function runOffscreenPreprocess(canvas, options) {
  // If we are already in a DOM context or offscreen isn't available, run normally
  if (typeof document !== 'undefined' || !chrome.offscreen) {
      return preprocessImage(canvas, options);
  }

  console.log('[ScanService] Routing image to OpenCV Sandbox via Offscreen...');
  
  // 1. Ensure Offscreen document is awake
  const url = chrome.runtime.getURL('public/offscreen.html');
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [url] });
  if (contexts.length === 0) {
      await chrome.offscreen.createDocument({ url: 'public/offscreen.html', reasons: ['DOM_SCRAPING'], justification: 'OpenCV Preprocessing' });
  }

  // 2. Convert Canvas to Base64 (Fast)
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bytes = new Uint8Array(imgData.data.buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  const base64Data = btoa(binary);

  // 3. Send to Offscreen and await cleaned canvas
  return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
          target: 'offscreen',
          type: 'PREPROCESS_IMAGE',
          payload: { width: canvas.width, height: canvas.height, base64Data, options }
      }, (response) => {
          if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
          if (!response || !response.success) return reject(new Error(response?.error || 'Preprocessing failed offscreen'));

          const outBase64 = response.payload.base64Data;
          const binaryString = atob(outBase64);
          const outBytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
              outBytes[i] = binaryString.charCodeAt(i);
          }
          const outCanvas = new OffscreenCanvas(response.payload.width, response.payload.height);
          const outCtx = outCanvas.getContext('2d', { willReadFrequently: true });
          const outImgData = new ImageData(new Uint8ClampedArray(outBytes.buffer), response.payload.width, response.payload.height);
          outCtx.putImageData(outImgData, 0, 0);
          resolve(outCanvas);
      });
  });
}

export async function runScanPipeline(file, options = {}) {
  const startTime = Date.now();
  try {
    const canvas = await fileToCanvas(file);
    
    // Use the Offscreen Bridge for OpenCV
    const preprocessedCanvas = await runOffscreenPreprocess(canvas, options.preprocess);
    
    // OCR & Internal Bounding Box Extraction
    const ocrResult = await recognizeImage(preprocessedCanvas);
    const wordBoxes = ocrResult.words || [];
    console.log(`[ScanService] Pipeline running with ${wordBoxes.length} text boxes.`);

    // Regex processing for Text
    const rawRegexDetections = scanText(ocrResult.text, wordBoxes);
    const mergedTextDetections = mergeOverlappingDetections(rawRegexDetections);

    // 🚀 THE FIX: Native On-Device QR Code Detection
    let qrDetections = [];
    if ('BarcodeDetector' in globalThis) {
      try {
        const qrScanner = new BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await qrScanner.detect(preprocessedCanvas);
        
        qrDetections = barcodes.map(qr => ({
          type: 'QR_CODE',
          severity: 'critical',
          bboxes: [{
            x: qr.boundingBox.x,
            y: qr.boundingBox.y,
            width: qr.boundingBox.width,
            height: qr.boundingBox.height,
            confidence: 100 // High confidence for native API matches
          }]
        }));
        
        if (qrDetections.length > 0) {
          console.log(`[ScanService] Successfully detected ${qrDetections.length} QR Code(s).`);
        }
      } catch (err) {
        console.warn('[ScanService] Native QR scanner failed or is unsupported:', err);
      }
    }

    // Combine both text and QR detections
    const finalDetections = [...mergedTextDetections, ...qrDetections];
    const riskReport = analyzeRisk(finalDetections);

    return {
      success: true,
      detections: finalDetections,
      riskLevel: riskReport.riskLevel,
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    console.error('[ScanService] Pipeline failed:', error);
    return { success: false, detections: [], error: error.message };
  }
}