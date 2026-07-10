import { runOCROnWorker } from './tesseractWorker.js';
import { extractWords } from './extractWords.js';
import { extractLines } from './extractLines.js';
import { extractBoundingBoxes } from './extractBoundingBoxes.js';

/**
 * Image Text Recognizer (OCR)
 * 
 * Responsibility:
 * - Executes character recognition algorithms on a given preprocessed image canvas.
 * - Coordinates extraction of words, lines, and bounding box arrays.
 * - Measures latency metrics.
 * - Implements graceful fallback, preventing exceptions from crashing the parent pipeline.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement or OffscreenCanvas
 * - Output: Promise<{
 *     text: string,
 *     confidence: number,
 *     words: Object[],
 *     lines: Object[],
 *     boundingBoxes: Object[],
 *     processingTime: number,
 *     error?: string
 *   }>
 * 
 * Interacts with:
 * - extension/src/ai/ocr/tesseractWorker.js
 * - extension/src/ai/ocr/extractWords.js
 * - extension/src/ai/ocr/extractLines.js
 * - extension/src/ai/ocr/extractBoundingBoxes.js
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
