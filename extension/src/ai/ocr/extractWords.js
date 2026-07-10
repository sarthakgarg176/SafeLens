/**
 * OCR Word Extractor
 * 
 * Responsibility:
 * - Parses OCR results to extract individual word text and properties.
 * - Extracts word locations, sizes, and confidence levels.
 * 
 * Input/Output Contract:
 * - Input: OCR Result Object (containing words array)
 * - Output: Object[] (Array of structured word objects with text, bbox, and confidence score)
 * 
 * Interacts with:
 * - extension/src/ai/ocr/recognizeImage.js
 */

/**
 * Parses OCR results and yields an array of structured word objects.
 * 
 * @param {Object} ocrResult - Complete payload returned from recognizeImage
 * @returns {Object[]} List of structured word boundaries
 */
export function extractWords(ocrResult) {
  if (!ocrResult || !Array.isArray(ocrResult.words)) {
    return [];
  }

  console.log(`[ExtractWords] Extracting word structures. Found count: ${ocrResult.words.length}`);

  return ocrResult.words.map((word) => ({
    text: word.text || '',
    confidence: typeof word.confidence === 'number' ? word.confidence : 0,
    bbox: {
      x0: word.bbox ? word.bbox.x0 : 0,
      y0: word.bbox ? word.bbox.y0 : 0,
      x1: word.bbox ? word.bbox.x1 : 0,
      y1: word.bbox ? word.bbox.y1 : 0
    }
  }));
}
