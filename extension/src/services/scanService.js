import { preprocessImage } from '../ai/preprocessing/preprocessImage.js';
import { recognizeImage } from '../ai/ocr/recognizeImage.js';
import { scanText } from '../ai/detection/regexDetector.js';
import { mergeOverlappingDetections } from '../ai/detection/mergeDetections.js';
import { analyzeRisk } from '../ai/detection/riskAnalyzer.js';
import { classifyText } from '../ai/detection/miniMLClassifier.js';
import { fuseConfidence } from '../ai/detection/confidenceFusion.js';
import { executeOffscreenTask } from '../background/offscreenManager.js';

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
          canvas.width = img.width; canvas.height = img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);
          resolve(canvas);
        };
        img.onerror = (e) => reject(new Error(`Failed to decode image: ${e}`));
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
}

async function runOffscreenPreprocess(canvas, options) {
  if (typeof document !== 'undefined' || !chrome.offscreen) return preprocessImage(canvas, options);
  
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bytes = new Uint8Array(imgData.data.buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  const base64Data = btoa(binary);
  
  const result = await executeOffscreenTask('PREPROCESS_IMAGE', { width: canvas.width, height: canvas.height, base64Data, options });
  
  if (!result || !result.base64Data) throw new Error(`Offscreen preprocessing failed.`);
  const outBinaryString = atob(result.base64Data);
  const outBytes = new Uint8Array(outBinaryString.length);
  for (let i = 0; i < outBinaryString.length; i++) outBytes[i] = outBinaryString.charCodeAt(i);
  
  const outCanvas = new OffscreenCanvas(result.width, result.height);
  const outCtx = outCanvas.getContext('2d', { willReadFrequently: true });
  outCtx.putImageData(new ImageData(new Uint8ClampedArray(outBytes.buffer), result.width, result.height), 0, 0);
  return outCanvas;
}

export async function runScanPipeline(file, options = {}) {
  const startTime = Date.now();
  try {
    const canvas = await fileToCanvas(file);
    const preprocessedCanvas = await runOffscreenPreprocess(canvas, options.preprocess);
    
    const ocrResult = await recognizeImage(preprocessedCanvas);
    const wordBoxes = ocrResult.words || [];
    console.log(`[ScanService] Pipeline running with ${wordBoxes.length} text boxes.`);

    const rawRegexDetections = scanText(ocrResult.text, wordBoxes);
    const mergedTextDetections = mergeOverlappingDetections(rawRegexDetections);

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
            confidence: 100 
          }]
        }));
        
        if (qrDetections.length > 0) {
          console.log(`[ScanService] Successfully detected ${qrDetections.length} QR Code(s).`);
        }
      } catch (err) {
        console.warn('[ScanService] Native QR scanner failed or is unsupported:', err);
      }
    }

    const combinedDetections = [...mergedTextDetections, ...qrDetections];
    const fusionReport = fuseConfidence(combinedDetections, await classifyText(ocrResult.text));
    
    const finalDetections = [...fusionReport.fusedDetections];
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