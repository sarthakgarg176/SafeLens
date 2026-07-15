/**
 * Confidence Fusion Engine
 * 
 * Responsibility:
 * - Combines pattern matching confidence and character recognition confidence.
 * - Filters out false positives by discarding matches where validation rules failed.
 * - Computes a unified Bayesian-style confidence rating.
 * - Formats standard output payloads.
 * 
 * Input/Output Contract:
 * - Input: Object[] (Detections with rule validation metadata)
 * - Output: Object[] (Detections containing fused confidence scores)
 * 
 * Interacts with:
 * - extension/src/ai/detection/regexDetector.js & ruleEngine.js (Consumes their attributes)
 */

// Severity weights mapped to PII types
const SEVERITY_LEVELS = {
  EMAIL: 'medium',
  PHONE: 'low',
  AADHAAR: 'high',
  PAN: 'high',
  PASSPORT: 'high',
  DRIVING_LICENSE: 'high',
  IFSC: 'medium',
  CREDIT_CARD: 'critical',
  UPI_ID: 'medium',
  AWS_ACCESS_KEY: 'critical',
  GOOGLE_API_KEY: 'critical',
  GITHUB_PAT: 'critical',
  JWT_TOKEN: 'critical',
  PASSWORD_PATTERNS: 'critical'
};

/**
 * Filters out failed validation matches and fuses OCR & Regex confidence ratings.
 * 
 * @param {Object[]} detections - Validated candidate detections
 * @returns {Object[]} Fused and filtered detections
 */
export function fuseConfidences(detections) {
  if (!Array.isArray(detections)) {
    return [];
  }

  return detections
    .filter((det) => {
      // 1. Drop false positives (e.g. failing Aadhaar/Luhn checks)
      if (det.rulePassed === false) {
        console.log(`[ConfidenceFusion] Dropping false positive: [${det.type}] "${det.value}" (failed checksum validation).`);
        return false;
      }
      return true;
    })
    .map((det) => {
      const ocrConf = typeof det.ocrConfidence === 'number' ? det.ocrConfidence : 0.5;
      const regexConf = typeof det.regexConfidence === 'number' ? det.regexConfidence : 0.8;

      // 2. Bayes-like weighted fusion (70% structural regex confidence, 30% OCR legibility confidence)
      let fused = 0.7 * regexConf + 0.3 * ocrConf;

      // Clamp value between 0.0 and 1.0
      fused = Math.min(1.0, Math.max(0.0, fused));

      return {
        type: det.type,
        value: det.value,
        ocrConfidence: ocrConf,
        regexConfidence: regexConf,
        fusedConfidence: parseFloat(fused.toFixed(4)),
        severity: SEVERITY_LEVELS[det.type] || 'medium',
        startIndex: det.startIndex,
        endIndex: det.endIndex,
        bboxes: det.bboxes || [],
        source: det.source || 'regex'
      };
    });
}
