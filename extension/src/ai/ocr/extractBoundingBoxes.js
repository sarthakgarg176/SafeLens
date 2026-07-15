export function extractBoundingBoxes(ocrData) {
  if (!ocrData) return [];
  const boxes = [];
  
  try {
    // Check if Tesseract provided the words array natively
    if (ocrData.words && Array.isArray(ocrData.words) && ocrData.words.length > 0) {
      ocrData.words.forEach(word => {
        if (word.bbox && word.text.trim().length > 0) {
          boxes.push({
            text: word.text,
            x0: word.bbox.x0,
            y0: word.bbox.y0,
            x1: word.bbox.x1,
            y1: word.bbox.y1
          });
        }
      });
    } 
    // Fallback: If words array is missing but lines exist
    else if (ocrData.lines && Array.isArray(ocrData.lines)) {
      ocrData.lines.forEach(line => {
        if (line.words && Array.isArray(line.words)) {
          line.words.forEach(word => {
             if (word.bbox && word.text.trim().length > 0) {
                boxes.push({
                  text: word.text,
                  x0: word.bbox.x0,
                  y0: word.bbox.y0,
                  x1: word.bbox.x1,
                  y1: word.bbox.y1
                });
             }
          });
        }
      });
    }
  } catch (e) {
    console.error('[ExtractBoundingBoxes] Parsing failed silently:', e);
  }
  
  return boxes;
}