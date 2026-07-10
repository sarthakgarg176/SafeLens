import { preprocessImage } from '../ai/preprocessing/preprocessImage.js';
import { recognizeImage } from '../ai/ocr/recognizeImage.js';
import { extractBoundingBoxes } from '../ai/ocr/extractBoundingBoxes.js';
import { scanText } from '../ai/detection/regexDetector.js';
import { classifyText } from '../ai/detection/miniLMClassifier.js';
import { fuseConfidences } from '../ai/detection/confidenceFusion.js';
import { validateDetections } from '../ai/detection/ruleEngine.js';
import { mergeOverlappingDetections } from '../ai/detection/mergeDetections.js';
import { analyzeRisk } from '../ai/detection/riskAnalyzer.js';

/**
 * Scan Orchestration Service
 * 
 * Responsibility:
 * - Coordinates the full sequentially coupled client-side scanning flow.
 * - Resolves image File objects to canvas pixel data.
 * - Feeds preprocessing, OCR recognition, pattern matching, semantic classification,
 *   rule verification, coordinate merging, and risk analysis components.
 * - Computes latency metrics and formats standard ScanResult payloads.
 * 
 * Interacts with:
 * - extension/src/ai/ (All underlying pipeline modules)
 * - extension/src/services/protectService.js (Feeds detection metadata for redaction)
 */

/**
 * Converts a browser File object to an HTMLCanvasElement populated with image pixels.
 * 
 * @param {File} file - Source image File
 * @returns {Promise<HTMLCanvasElement>} Loaded canvas
 */
export function fileToCanvas(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new TypeError('File parameter is required'));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = (e) => reject(new Error(`Failed to decode image pixels: ${e}`));
      img.src = event.target.result;
    };
    reader.onerror = (e) => reject(new Error(`Failed to read file buffer: ${e}`));
    reader.readAsDataURL(file);
  });
}

/**
 * Performs a complete, structured scan on an image file.
 * 
 * @param {File} file - Target image File to scan
 * @param {Object} [options] - Configuration override options
 * @returns {Promise<{
 *   success: boolean,
 *   riskLevel: 'low'|'medium'|'high',
 *   score: number,
 *   piiCount: number,
 *   detections: Object[],
 *   processingTime: number,
 *   metadata: { name: string, size: number, type: string }
 * }>} Scan results payload
 */
export async function runScanPipeline(file, options = {}) {
  const startTime = Date.now();
  console.log(`[ScanService] Initiating scan pipeline for file: ${file.name} (${file.size} bytes)`);

  try {
    // 1. Convert File to Canvas
    const canvas = await fileToCanvas(file);

    // 2. Preprocess image (Grayscale -> Denoise -> Deskew -> Binarize -> Resize)
    const preprocessedCanvas = await preprocessImage(canvas, options.preprocess);

    // 3. Perform Optical Character Recognition (OCR)
    const ocrResult = await recognizeImage(preprocessedCanvas);

    // 4. Extract word bounding box coordinate blocks
    const wordBoxes = extractBoundingBoxes(ocrResult);

    // 5. Scan text for structural patterns (Regex)
    const rawRegexDetections = scanText(ocrResult.text, wordBoxes);

    // 6. Classify semantic context (MiniLM)
    const semanticClassifications = await classifyText(ocrResult.text);

    // 7. Perform Bayes-like confidence fusion
    const fusedDetections = fuseConfidences(rawRegexDetections, semanticClassifications);

    // 8. Run rule checks (Luhn checksums, SSN valid ranges) to filter false matches
    const verifiedDetections = validateDetections(fusedDetections);

    // 9. Consolidate overlapping/adjacent bounding regions
    const mergedDetections = mergeOverlappingDetections(verifiedDetections);

    // 10. Grade overall document severity risk rating
    const riskReport = analyzeRisk(mergedDetections);

    const latency = Date.now() - startTime;
    console.log(`[ScanService] Scan pipeline resolved in ${latency}ms. Risk: ${riskReport.riskLevel.toUpperCase()}`);

    return {
      success: true,
      riskLevel: riskReport.riskLevel,
      score: riskReport.score,
      piiCount: mergedDetections.length,
      detections: mergedDetections,
      processingTime: latency,
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    };

  } catch (error) {
    console.error('[ScanService] Scan pipeline failed:', error);
    return {
      success: false,
      riskLevel: 'low',
      score: 0,
      piiCount: 0,
      detections: [],
      processingTime: Date.now() - startTime,
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      error: error instanceof Error ? error.message : 'Unknown scanning runtime failure'
    };
  }
}
