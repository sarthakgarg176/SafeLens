import { runOCROnWorker } from './tesseractWorker.js';
import { extractWords } from './extractWords.js';
import { extractLines } from './extractLines.js';
import { extractBoundingBoxes } from './extractBoundingBoxes.js';
import { sendToOffscreen } from '../../background/offscreenManager.js';

/**
 * Image Text Recognizer (OCR)
 * 
 * Responsibility:
 * - Executes character recognition algorithms on a given preprocessed image canvas.
 * - Coordinates extraction of words, lines, and bounding box arrays.
 * - Measures latency metrics.
 * - Implements graceful fallback, preventing exceptions from crashing the parent pipeline.
 * - Automatically delegates OCR execution to the Offscreen Document when running in MV3 Service Worker.
 */

/**
 * Performs character recognition on a preprocessed canvas.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Cleaned and binarized image canvas
 * @returns {Promise<{
 *   text: string,
 *   confidence: number,
 *   words: Object[],
 *   lines: Object[],
 *   boundingBoxes: Object[],
 *   processingTime: number,
 *   error?: string
 * }>} Complete OCR result payload
 */
export async function recognizeImage(canvas) {
  // If in Service Worker, delegate to the Offscreen Document where Web Workers are supported
  if (typeof document === 'undefined' && typeof chrome !== 'undefined' && chrome.offscreen) {
    console.log('[RecognizeImage] Running in Service Worker. Delegating OCR to Offscreen Document...');
    try {
      const ctx = canvas.getContext('2d');
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Fixed: Convert raw buffer into a safe primitive Array to prevent data detachment during IPC serialization
      const pixelArray = Array.from(imgData.data);

      const result = await sendToOffscreen('RECOGNIZE_IMAGE', {
        width: canvas.width,
        height: canvas.height,
        data: pixelArray
      });

      return result;
    } catch (error) {
      console.error('[RecognizeImage] Offscreen OCR delegation failed.', error);
      return {
        text: '',
        confidence: 0,
        words: [],
        lines: [],
        boundingBoxes: [],
        processingTime: 0,
        error: error.message
      };
    }
  }

  const startTime = Date.now();
  console.log('[RecognizeImage] Triggering character recognition loop...');

  try {
    if (!canvas) {
      throw new TypeError('Canvas parameter is required');
    }

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas dimensions cannot be zero');
    }

    // 1. Run OCR on the serialized worker queue
    const ocrResult = await runOCROnWorker(canvas);

    if (!ocrResult || !ocrResult.data) {
      throw new Error('Tesseract returned an empty or malformed result payload');
    }

    const { data } = ocrResult;

    // 2. Parse sub-components sequentially
    const words = extractWords(data);
    const lines = extractLines(data);
    const boundingBoxes = extractBoundingBoxes(data);

    const duration = Date.now() - startTime;
    console.log(`[RecognizeImage] OCR successful. Latency: ${duration}ms. Text length: ${data.text ? data.text.length : 0}`);

    return {
      text: data.text || '',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0,
      words,
      lines,
      boundingBoxes,
      processingTime: duration
    };

  } catch (error) {
    console.error('[RecognizeImage] OCR processing failed:', error);
    
    // Graceful Fallback: Return structured empty response to avoid breaking the scan pipeline
    return {
      text: '',
      confidence: 0,
      words: [],
      lines: [],
      boundingBoxes: [],
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown OCR processing exception'
    };
  }
}