/**
 * Regex Pattern Detector - Diagnostic Mode
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

const normalize = (str) => (str || '').replace(/[\s\-_]/g, '').toLowerCase();

export function scanText(text, wordBoxes = []) {
  if (!text) return [];
  
  // DIAGNOSTIC LOG: Print once to see what structure we are working with
  console.log('[RegexDetector] Inspecting first 3 wordBoxes structure:', wordBoxes.slice(0, 3));

  const detections = [];
  
  for (const [type, regex] of Object.entries(PATTERNS)) {
    regex.lastIndex = 0; 
    let match;

    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0];
      const matchNormValue = normalize(matchText);
      
      const associatedBboxes = wordBoxes
        .filter(w => {
          // Check all potential keys for text
          const wText = (w.text || w.word || w.value || w.content || '').toString().trim();
          if (!wText) return false;
          
          const wTextNorm = normalize(wText);
          return matchNormValue.includes(wTextNorm) || wTextNorm.includes(matchNormValue);
        })
        .map(extractBox);

      if (associatedBboxes.length === 0) {
        console.warn(`[RegexDetector] Mapping FAILED for: "${matchText}".`);
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
  // Check for common OCR box formats (bbox, x0/y0, etc)
  const rect = w.bbox || w;
  return {
    x: rect.x !== undefined ? rect.x : (rect.x0 || 0),
    y: rect.y !== undefined ? rect.y : (rect.y0 || 0),
    width: rect.width !== undefined ? rect.width : ((rect.x1 || 0) - (rect.x0 || 0)),
    height: rect.height !== undefined ? rect.height : ((rect.y1 || 0) - (rect.y0 || 0)),
    confidence: w.confidence || 100
  };
}