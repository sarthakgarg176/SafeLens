/**
 * Regex Pattern Detector
 * 
 * Responsibility:
 * - Scans text elements for patterns matching PII (Personally Identifiable Information).
 * - Matches: Emails, Phone Numbers, Social Security Numbers (SSN), Credit Card Numbers, and IP addresses.
 * - Resolves string index matches back to word-level bounding boxes.
 * 
 * Input/Output Contract:
 * - Input: text (string), wordBoxes (Object[])
 * - Output: Object[] (List of detections: { text, type, confidence, bbox })
 * 
 * Interacts with:
 * - extension/src/ai/detection/riskAnalyzer.js (Provides matches for risk weighting)
 */

// PII Whitelisted regex patterns
const PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  SSN: /\d{3}-\d{2}-\d{4}/g,
  CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/g,
  IP_ADDRESS: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g
};

/**
 * Scans text for PII patterns and associates them with bounding boxes.
 * 
 * @param {string} text - Scanned text
 * @param {Object[]} wordBoxes - Word bounding boxes from extractBoundingBoxes
 * @returns {Object[]} Collection of detected matches
 */
export function scanText(text, wordBoxes = []) {
  if (!text) {
    return [];
  }

  console.log('[RegexDetector] Scanning text for PII patterns...');
  const detections = [];

  // Match each pattern
  for (const [type, regex] of Object.entries(PATTERNS)) {
    // Reset regex cursor state
    regex.lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchText.length;

      console.log(`[RegexDetector] Found PII Match: [${type}] ${matchText}`);

      // Attempt to map string index to word boxes
      const associatedBboxes = findBoxesForRange(matchText, wordBoxes);

      detections.push({
        text: matchText,
        type: type,
        confidence: 0.99, // High confidence for structural regex matches
        bboxes: associatedBboxes,
        range: [startIndex, endIndex]
      });
    }
  }

  return detections;
}

/**
 * Searches word coordinate boxes that overlap with matched text.
 * 
 * @param {string} matchText - The matched string segment
 * @param {Object[]} wordBoxes - Available word box coordinates
 * @returns {Object[]} Associated bounding boxes
 */
function findBoxesForRange(matchText, wordBoxes) {
  // Split match into words and find matching boxes
  const words = matchText.split(/\s+/);
  const matchedBoxes = [];

  for (const word of words) {
    const cleanedWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
    if (!cleanedWord) continue;

    // Find first bounding box containing this word text
    const box = wordBoxes.find((wb) => wb.text && wb.text.includes(cleanedWord));
    if (box) {
      matchedBoxes.push(box);
    }
  }

  return matchedBoxes;
}
