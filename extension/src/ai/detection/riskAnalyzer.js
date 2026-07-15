/**
 * Document Risk Assessment Engine
 * 
 * Responsibility:
 * - Grades the overall security threat level of a scanned document.
 * - Computes a weighted score based on detection type severity, counts, and confidence levels.
 * - Classifies final risk rating into: LOW, MEDIUM, HIGH, or CRITICAL.
 * - Formats the final ScanResult summary report.
 * 
 * Input/Output Contract:
 * - Input: Object[] (Fused PII detections)
 * - Output: { riskLevel: 'low'|'medium'|'high'|'critical', score: number, detections: Object[] }
 * 
 * Interacts with:
 * - extension/src/services/scanService.js (Feeds the final scan metadata)
 */

const SEVERITY_POINTS = {
  critical: 10,
  high: 5,
  medium: 2,
  low: 1
};

/**
 * Evaluates detections list and calculates the aggregate document risk score and level.
 * 
 * @param {Object[]} detections - Clean list of fused PII detections
 * @returns {{
 *   riskLevel: 'low'|'medium'|'high'|'critical',
 *   score: number,
 *   detections: Object[]
 * }} Document risk report
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
    const points = SEVERITY_POINTS[det.severity] || 2;
    const confidence = typeof det.fusedConfidence === 'number' ? det.fusedConfidence : 0.8;
    
    // Add weighted points to total score
    totalScore += points * confidence;

    // Direct elevation condition: any credentials/keys matched with high confidence
    if (det.severity === 'critical' && confidence >= 0.70) {
      hasHighConfidenceCritical = true;
    }
  });

  // Assign risk level based on cumulative score bounds and high-severity matches
  let riskLevel = 'low';

  if (hasHighConfidenceCritical || totalScore >= 15) {
    riskLevel = 'critical';
  } else if (totalScore >= 5) {
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
