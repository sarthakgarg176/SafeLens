/**
 * rules-engine.js
 * Legacy fallback processing pipeline (used when USE_NEW_AGENT = false).
 * Simple regex-based PII detection - no external calls, always available.
 */

const PATTERNS = {
  Email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  Phone: /\b(?:\+91[-\s]?)?[6-9]\d{9}\b/,
  Aadhaar: /\b\d{4}\s?\d{4}\s?\d{4}\b/,
  PAN: /\b[A-Z]{5}\d{4}[A-Z]\b/
};

export function runLegacyRules(extractedText) {
  const hits = [];

  for (const [type, pattern] of Object.entries(PATTERNS)) {
    const match = extractedText.match(pattern);
    if (match) {
      hits.push({ type, text: match[0] });
    }
  }

  const riskScore = hits.length > 0 ? Math.min(10, 5 + hits.length * 1.5) : 0;

  return {
    status: 'success',
    engine: 'legacy-rules',
    hitsCount: hits.length,
    hits,
    riskScore,
    recommendation: hits.length > 0 ? 'REDACT_MANDATORY' : 'ALLOW',
    decoyPayload: null // legacy engine does not generate decoys
  };
}