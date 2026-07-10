import { getOCRWorker } from './tesseractWorker.js';

/**
 * Image Text Recognizer (OCR)
 * 
 * Responsibility:
 * - Executes character recognition algorithms on a given preprocessed image canvas.
 * - Extracts unstructured textual characters, word metrics, and bounding boxes.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement
 * - Output: Promise<{ text: string, words: Object[], lines: Object[] }>
 * 
 * Interacts with:
 * - extension/src/ai/ocr/tesseractWorker.js (Retrieves worker thread instance)
 * - extension/src/services/protectPipeline.js (Processes images during protect tasks)
 */

/**
 * Performs character recognition on a preprocessed canvas.
 * 
 * @param {HTMLCanvasElement} canvas - Cleaned and binarized image canvas
 * @returns {Promise<{ text: string, words: Object[], lines: Object[] }>} Complete OCR result payload
 */
export async function recognizeImage(canvas) {
  try {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError('Input must be an HTMLCanvasElement');
    }

    console.log('[RecognizeImage] Triggering character recognition loop...');
    const worker = await getOCRWorker();

    const response = await worker.recognize(canvas);
    console.log('[RecognizeImage] Image text recognition complete. Extracted characters length:', response.data.text.length);

    return {
      text: response.data.text,
      words: response.data.words || [],
      lines: response.data.lines || []
    };

  } catch (error) {
    console.error('[RecognizeImage] Error during text recognition:', error);
    throw error;
  }
}
