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

export async function runScanPipeline(file, options = {}) {
  const startTime = Date.now();
  try {
    const canvas = await fileToCanvas(file);
    const preprocessedCanvas = await preprocessImage(canvas, options.preprocess);
    
    // OCR & Internal Bounding Box Extraction
    const ocrResult = await recognizeImage(preprocessedCanvas);
    
    // Direct usage from OCR engine (No redundant calls)
    const wordBoxes = ocrResult.boundingBoxes || [];
    console.log(`[ScanService] Pipeline running with ${wordBoxes.length} boxes.`);

    // Regex & Risk
    const rawRegexDetections = scanText(ocrResult.text, wordBoxes);
    const mergedDetections = mergeOverlappingDetections(rawRegexDetections);
    const riskReport = analyzeRisk(mergedDetections);

    return {
      success: true,
      detections: mergedDetections,
      riskLevel: riskReport.riskLevel,
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    console.error('[ScanService] Pipeline failed:', error);
    return { success: false, detections: [], error: error.message };
  }
}