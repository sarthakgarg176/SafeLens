/**
 * Bounding Box Aggregator
 * 
 * Responsibility:
 * - Collects coordinates and confidence scores for word blocks.
 * - Extracts spatial coordinate records for redaction masking tasks.
 * 
 * Input/Output Contract:
 * - Input: OCR Result Object
 * - Output: Object[] (Array of bounding boxes: { x, y, width, height, confidence })
 * 
 * Interacts with:
 * - extension/src/ai/ocr/recognizeImage.js
 */

/**
 * Extracts and maps word boundaries to a standard box representation { x, y, width, height }.
 * 
 * @param {Object} ocrResult - OCR payload
 * @returns {Object[]} Collection of standard bounding boxes
 */
export function extractBoundingBoxes(ocrResult) {
  if (!ocrResult || !Array.isArray(ocrResult.words)) {
    return [];
  }

  console.log('[ExtractBoundingBoxes] Compiling spatial coordinate box records...');

  return ocrResult.words.map((word) => {
    const x0 = word.bbox ? word.bbox.x0 : 0;
    const y0 = word.bbox ? word.bbox.y0 : 0;
    const x1 = word.bbox ? word.bbox.x1 : 0;
    const y1 = word.bbox ? word.bbox.y1 : 0;

    return {
      x: x0,
      y: y0,
      width: x1 - x0,
      height: y1 - y0,
      confidence: typeof word.confidence === 'number' ? word.confidence : 0,
      text: word.text || ''
    };
  });
}
