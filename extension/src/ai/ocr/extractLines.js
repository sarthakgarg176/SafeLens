/**
 * OCR Line Extractor
 * 
 * Responsibility:
 * - Parses OCR results to organize output characters into text lines.
 * - Extracts spatial coordinate boundaries for whole lines.
 * 
 * Input/Output Contract:
 * - Input: OCR Result Object (containing lines array)
 * - Output: Object[] (Array of structured line objects with text and bbox)
 * 
 * Interacts with:
 * - extension/src/ai/ocr/recognizeImage.js
 */

/**
 * Organizes OCR payload into structured horizontal line blocks.
 * 
 * @param {Object} ocrResult - Complete payload returned from recognizeImage
 * @returns {Object[]} List of structured line objects
 */
export function extractLines(ocrResult) {
  if (!ocrResult || !Array.isArray(ocrResult.lines)) {
    return [];
  }

  console.log(`[ExtractLines] Organizing horizontal line blocks. Found count: ${ocrResult.lines.length}`);

  return ocrResult.lines.map((line) => ({
    text: line.text ? line.text.trim() : '',
    bbox: {
      x0: line.bbox ? line.bbox.x0 : 0,
      y0: line.bbox ? line.bbox.y0 : 0,
      x1: line.bbox ? line.bbox.x1 : 0,
      y1: line.bbox ? line.bbox.y1 : 0
    }
  }));
}
