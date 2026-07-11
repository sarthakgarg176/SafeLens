/**
 * SafeLens Chrome Extension PII Regex Detector
 *
 * Exports a structured dictionary of regex patterns and a scanner function
 * to identify PII (Emails, Aadhaar, PAN, and Credit Cards) in text.
 */

export const PII_PATTERNS = {
  EMAIL: {
    name: 'Email Address',
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    severity: 'medium',
    weight: 2.0
  },
  AADHAAR: {
    name: 'Indian Aadhaar Card',
    regex: /\b\d{4}\s\d{4}\s\d{4}\b/g,
    severity: 'high',
    weight: 4.0
  },
  PAN: {
    name: 'Indian PAN Card',
    regex: /\b[a-zA-Z]{5}\d{4}[a-zA-Z]\b/g,
    severity: 'high',
    weight: 3.5
  },
  CREDIT_CARD: {
    name: 'Credit/Debit Card',
    regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    severity: 'high',
    weight: 5.0
  }
};

/**
 * Scans a block of text and extracts all matches against PII patterns.
 * 
 * @param {string} text The target text context to scan.
 * @returns {Array} An array of detection hits with offsets, weights, and metadata.
 */
export function scanTextContent(text) {
  if (typeof text !== 'string') return [];

  const hits = [];

  for (const [key, patternInfo] of Object.entries(PII_PATTERNS)) {
    // Reset regex search index since they have the global /g flag
    patternInfo.regex.lastIndex = 0;
    let match;

    while ((match = patternInfo.regex.exec(text)) !== null) {
      hits.push({
        type: key,
        name: patternInfo.name,
        value: match[0],
        index: match.index,
        length: match[0].length,
        severity: patternInfo.severity,
        weight: patternInfo.weight
      });
    }
  }

  return hits;
}
