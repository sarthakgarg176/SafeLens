/**
 * Document Risk Assessment Engine
 * Evaluates text PII and QR Codes to generate a document risk score.
 */

// Mapping of detection types to their base severity for weighting
const TYPE_SEVERITY = {
  AADHAAR: 'critical',
  PAN: 'critical',
  PASSPORT: 'critical',
  QR_CODE: 'critical', // NEW: Ensures QR codes trigger immediate redaction
  DRIVING_LICENSE: 'high',
  CREDIT_CARD: 'high',
  EMAIL: 'medium',
  PHONE: 'medium',
  DEFAULT: 'medium'
};

const SEVERITY_POINTS = {
  critical: 10,
  high: 5,
  medium: 2,
  low: 1
};

/**
 * Evaluates detections list and calculates the aggregate document risk score and level.
 */
export function analyzeRisk(detections) {
  if (!Array.isArray(detections) || detections.length === 0) {
    return {
      riskLevel: 'low',
      score: 0,
      detections: []
    };
  }

  let totalScore = 0;
  let hasHighConfidenceCritical = false;

  detections.forEach((det) => {
    // Determine severity based on detected type if not already set
    const severity = det.severity || TYPE_SEVERITY[det.type] || TYPE_SEVERITY.DEFAULT;
    const points = SEVERITY_POINTS[severity] || 2;
    
    // Use confidence score provided by detection, default to 0.8
    const confidence = typeof det.fusedConfidence === 'number' ? det.fusedConfidence : 0.8;
    
    // Add weighted points to total score
    totalScore += points * confidence;

    // Elevation condition: any critical PII (Aadhaar/PAN/QR)
    if (severity === 'critical' && confidence >= 0.50) {
      hasHighConfidenceCritical = true;
    }
  });

  // Assign risk level based on score bounds and critical elements
  let riskLevel = 'low';
  if (hasHighConfidenceCritical || totalScore >= 8) {
    riskLevel = 'critical';
  } else if (totalScore >= 4) {
    riskLevel = 'high';
  } else if (totalScore >= 2) {
    riskLevel = 'medium';
  }

  console.log(`[RiskAnalyzer] Calculated document risk score: ${totalScore.toFixed(2)} -> Level: ${riskLevel.toUpperCase()}`);

  return {
    riskLevel,
    score: parseFloat(totalScore.toFixed(2)),
    detections
  };
}