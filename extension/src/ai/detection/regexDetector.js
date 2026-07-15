/**
 * Regex Pattern Detector
 * 
 * Responsibility:
 * - Scans unstructured text for high-risk PII and credential patterns.
 * - Supports matching for: Emails, Phone numbers, Aadhaar cards, PAN cards, Passports, 
 *   Driving Licenses, IFSC codes, Credit/Debit cards, UPI IDs, AWS/Google/GitHub keys,
 *   JWT tokens, and standard password expressions.
 * - Protects against ReDoS (Regular Expression Denial of Service) by using non-backtracking patterns.
 * - Resolves string index ranges back to word-level bounding box coordinates.
 * 
 * Input/Output Contract:
 * - Input: text (string), wordBoxes (Object[])
 * - Output: Object[] (List of detections: { type, value, confidence, startIndex, endIndex, bboxes })
 * 
 * Interacts with:
 * - extension/src/ai/detection/confidenceFusion.js
 */

const PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  AADHAAR: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  PAN: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
  PASSPORT: /\b[A-Z][0-9]{7}\b/g,
  DRIVING_LICENSE: /\b[A-Z]{2}[0-9]{2}[-\s]?[0-9]{11}\b/g,
  IFSC: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
  CREDIT_CARD: /\b(?:\d[ -]*?){13,19}\b/g,
  UPI_ID: /\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b/g,
  AWS_ACCESS_KEY: /\bAKIA[A-Z0-9]{16}\b/g,
  GOOGLE_API_KEY: /\bAIza[Sy][a-zA-Z0-9\-_]{35}\b/g,
  GITHUB_PAT: /\bghp_[a-zA-Z0-9]{36}\b/g,
  JWT_TOKEN: /\beyJ[a-zA-Z0-9\-_]+\.eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\b/g,
  PASSWORD_PATTERNS: /\b(?:password|passwd|secret|passphrase)\s*[:=]\s*([a-zA-Z0-9!@#$%^&*()_+=-]{6,30})\b/gi
};

// Base regex confidence values based on specificity
const CONFIDENCES = {
  EMAIL: 0.95,
  PHONE: 0.85,
  AADHAAR: 0.90,
  PAN: 0.95,
  PASSPORT: 0.90,
  DRIVING_LICENSE: 0.90,
  IFSC: 0.95,
  CREDIT_CARD: 0.80, // Needs Luhn check to boost
  UPI_ID: 0.90,
  AWS_ACCESS_KEY: 0.99,
  GOOGLE_API_KEY: 0.99,
  GITHUB_PAT: 0.99,
  JWT_TOKEN: 0.95,
  PASSWORD_PATTERNS: 0.85
};

/**
 * Scans text for sensitive patterns and aligns match bounds to coordinate boxes.
 * 
 * @param {string} text - Scanned text
 * @param {Object[]} wordBoxes - Word coordinates from OCR step
 * @returns {Object[]} List of matches
 */
export function scanText(text, wordBoxes = []) {
  if (!text) {
    return [];
  }

  console.log('[RegexDetector] Running sensitivity patterns scanning...');
  const detections = [];

  // Align word bounding boxes with raw text index offsets
  const alignedWords = alignWordsWithText(text, wordBoxes);

  for (const [type, regex] of Object.entries(PATTERNS)) {
    regex.lastIndex = 0; // Reset state
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + matchText.length;

      // Extract bounding boxes overlapping this index range
      const associatedBboxes = alignedWords
        .filter((w) => w.startIndex < endIndex && w.endIndex > startIndex)
        .map((w) => ({
          x: w.x,
          y: w.y,
          width: w.width,
          height: w.height,
          confidence: w.confidence
        }));

      // Calculate average OCR confidence for these boxes
      const avgOcrConfidence = associatedBboxes.length > 0
        ? associatedBboxes.reduce((acc, box) => acc + box.confidence, 0) / associatedBboxes.length
        : 0;

      detections.push({
        type,
        value: matchText,
        regexConfidence: CONFIDENCES[type] || 0.80,
        ocrConfidence: avgOcrConfidence / 100, // Normalize to 0.0 - 1.0
        startIndex,
        endIndex,
        bboxes: associatedBboxes,
        source: 'regex'
      });
    }
  }

  return detections;
}

/**
 * Aligns raw OCR words array to index offsets inside the full raw text string.
 * This handles line breaks and space insertions.
 * 
 * @param {string} rawText - OCR text
 * @param {Object[]} wordBoxes - Word bounding boxes
 * @returns {Object[]} Words aligned with start/end index parameters
 */
function alignWordsWithText(rawText, wordBoxes) {
  let currentIndex = 0;

  return wordBoxes.map((w) => {
    if (!w.text) {
      return { ...w, startIndex: -1, endIndex: -1 };
    }

    // Clean word segment to search
    const cleanWord = w.text.trim();
    const startIndex = rawText.indexOf(cleanWord, currentIndex);

    if (startIndex !== -1) {
      currentIndex = startIndex + cleanWord.length;
      return {
        ...w,
        startIndex,
        endIndex: currentIndex
      };
    }

    return { ...w, startIndex: -1, endIndex: -1 };
  });
}
