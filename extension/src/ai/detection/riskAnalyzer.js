/**
 * Risk Assessment Analyzer
 * 
 * Responsibility:
 * - Scores the severity of detected items based on PII category weights.
 * - Categorizes overall file risk into Low, Medium, or High categories.
 * - Computes a summary report mapping specific file items to risk types.
 * 
 * Input/Output Contract:
 * - Input: Object[] (List of fused and validated detections)
 * - Output: { riskLevel: 'low'|'medium'|'high', score: number, detections: Object[] }
 * 
 * Interacts with:
 * - extension/src/services/protectPipeline.js (Feeds the final decision evaluation)
 */

// Weight constants for PII severity levels
const SEVERITY_WEIGHTS = {
  EMAIL: 1,
  PHONE: 1,
  IP_ADDRESS: 1,
  SSN: 3,
  CREDIT_CARD: 3
};

/**
 * Rates the total risk and severity of the image document based on detections.
 * 
 * @param {Object[]} detections - List of validated, fused detections
 * @returns {{ riskLevel: 'low'|'medium'|'high', score: number, detections: Object[] }} Risk summary report
 */
export function analyzeRisk(detections) {
  if (!Array.isArray(detections) || detections.length === 0) {
    return { riskLevel: 'low', score: 0, detections: [] };
  }

  console.log(`[RiskAnalyzer] Scoring document risk for ${detections.length} detections...`);

  // Calculate weighted sum
  let totalScore = 0;
  detections.forEach((det) => {
    const weight = SEVERITY_WEIGHTS[det.type] || 1;
    totalScore += weight * det.confidence;
  });

  // Classify overall category
  let riskLevel = 'low';
  if (totalScore >= 3) {
    riskLevel = 'high';
  } else if (totalScore >= 1) {
    riskLevel = 'medium';
  }

  console.log(`[RiskAnalyzer] Evaluation score: ${totalScore.toFixed(2)}, Risk Level: ${riskLevel.toUpperCase()}`);

  return {
    riskLevel,
    score: totalScore,
    detections
  };
}
