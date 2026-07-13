/**
 * Regex Pattern Detector - Fuzzy Matching Enabled
 * Optimized for noisy OCR outputs and developer console screenshots.
 */

const PATTERNS = {
  // 🚀 FUZZY MATCHING: Uses Negative Lookbehinds/Lookaheads instead of strict \b boundaries.
  // This allows detection even if the text is surrounded by brackets, quotes, or OCR artifacts.
  EMAIL: /(?<![a-zA-Z0-9])[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?![a-zA-Z0-9])/g,
  PHONE: /(?<!\d)(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)/g,
  AADHAAR: /(?<!\d)(\d{4}[-\s]?\d{4}[-\s]?\d{4})(?!\d)/g,
  PAN: /(?<![A-Z0-9])([A-Z]{5}[0-9]{4}[A-Z])(?![A-Z0-9])/g,
  PASSPORT: /(?<![A-Z0-9])([A-Z][0-9]{7})(?![A-Z0-9])/g,
  CREDIT_CARD: /(?<!\d)((?:\d[ -]*?){13,19})(?!\d)/g,
  UPI_ID: /(?<![a-zA-Z0-9.\-_])[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}(?![a-zA-Z0-9])/g
};

// Removes all garbage characters, keeping only pure alphanumerics for mapping
const normalize = (str) => (str || '').replace(/[^a-z0-9]/gi, '').toLowerCase();

export function scanText(text, wordBoxes = []) {
  if (!text) return [];
  
  console.log('[RegexDetector] Inspecting first 3 wordBoxes structure:', wordBoxes.slice(0, 3));

  const detections = [];
  
  // Builds a spatial map linking exact string indices to bounding boxes
  let currentIndex = 0;
  const boxMapping = wordBoxes.map(w => {
     const wText = (w.text || w.word || w.value || w.content || '').toString();
     let startIdx = -1;
     let endIdx = -1;
     
     if (wText) {
         startIdx = text.indexOf(wText, currentIndex);
         if (startIdx !== -1) {
             endIdx = startIdx + wText.length;
             currentIndex = endIdx;
         }
     }
     
     return {
        box: extractBox(w),
        text: wText,
        norm: normalize(wText),
        start: startIdx,
        end: endIdx
     };
  });
  
  for (const [type, regex] of Object.entries(PATTERNS)) {
    regex.lastIndex = 0; 
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Extracts the exact matched string (uses capturing group if present, otherwise full match)
      const matchText = match[1] || match[0]; 
      const matchNormValue = normalize(matchText);
      
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;
      
      let associatedBboxes = [];

      // METHOD A: Map by exact string overlap (Handles multi-word structures like spaces in Aadhaar)
      const overlapBoxes = boxMapping.filter(b => b.start !== -1 && b.start < matchEnd && b.end > matchStart);
      
      if (overlapBoxes.length > 0) {
          associatedBboxes = overlapBoxes.map(b => b.box);
      } 
      // METHOD B: Fallback mapping via normalized substring evaluation
      else {
          associatedBboxes = boxMapping
            .filter(b => b.norm.length > 0 && (matchNormValue.includes(b.norm) || b.norm.includes(matchNormValue)))
            .map(b => b.box);
      }

      if (associatedBboxes.length === 0) {
        console.warn(`[RegexDetector] Mapping FAILED for: "${matchText}". Regex found it in text, but couldn't link it to boxes.`);
      } else {
        console.log(`[RegexDetector] SUCCESS: Mapped "${matchText}" to ${associatedBboxes.length} bounding boxes.`);
      }

      detections.push({
        type,
        value: matchText,
        bboxes: associatedBboxes,
        source: 'regex'
      });
    }
  }
  return detections;
}

function extractBox(w) {
  const rect = w.bbox || w;
  return {
    x: rect.x !== undefined ? rect.x : (rect.x0 || 0),
    y: rect.y !== undefined ? rect.y : (rect.y0 || 0),
    width: rect.width !== undefined ? rect.width : ((rect.x1 || 0) - (rect.x0 || 0)),
    height: rect.height !== undefined ? rect.height : ((rect.y1 || 0) - (rect.y0 || 0)),
    confidence: w.confidence || 100
  };
}