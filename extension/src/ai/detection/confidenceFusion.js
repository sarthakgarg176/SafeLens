/**
 * Confidence Fusion Engine (Updated)
 * Logic: Safer redaction - if detection type is high risk, we keep it even if checksum fails.
 */

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

export function fuseConfidences(detections) {
  if (!Array.isArray(detections)) {
    return [];
  }

  return detections.map((det) => {
    let isDropped = false;
    let ocrConf = typeof det.ocrConfidence === 'number' ? det.ocrConfidence : 0.5;
    let regexConf = typeof det.regexConfidence === 'number' ? det.regexConfidence : 0.8;

    // FIX: Instead of dropping, we penalize confidence if rule fails
    if (det.rulePassed === false) {
      console.warn(`[ConfidenceFusion] Rule validation failed for [${det.type}]. Keeping detection for safety.`);
      // Penalty: drastically reduce confidence but do NOT drop the detection
      ocrConf *= 0.1; 
      regexConf *= 0.1;
    }

    // Bayes-like weighted fusion
    let fused = 0.7 * regexConf + 0.3 * ocrConf;
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