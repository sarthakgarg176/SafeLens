/**
 * Confidence Fusion Engine
 * 
 * Responsibility:
 * - Fuses pattern matches (Regex) and contextual classifications (MiniLM) into a unified result.
 * - Resolves overlapping risk findings.
 * - Computes a weighted overall confidence score for each risk element.
 * 
 * Input/Output Contract:
 * - Input: regexDetections (Object[]), modelClassifications (Object[])
 * - Output: Object[] (List of fused findings containing adjusted confidence levels)
 * 
 * Interacts with:
 * - extension/src/ai/detection/riskAnalyzer.js (Aggregates and formats findings)
 */

/**
 * Combines regex pattern findings and semantic model tags into high-confidence detections.
 * 
 * @param {Object[]} regexDetections - Detections from regexDetector
 * @param {Object[]} classifications - Classifications from miniLMClassifier
 * @returns {Object[]} Fused detection results
 */
export function fuseConfidences(regexDetections, classifications) {
  if (!Array.isArray(regexDetections)) {
    return [];
  }

  console.log('[ConfidenceFusion] Running weighted fusion on detections and classifications...');

  // Boost confidence of regex detections if the document's classified category matches the PII type
  return regexDetections.map((detection) => {
    let boostedConfidence = detection.confidence;

    // Example boosting logic:
    // If we matched a credit card pattern and the model classified the page as "Financial", boost/confirm confidence.
    const hasFinancialContext = classifications.some((c) => c.topic === 'Financial Statement' && c.score > 0.8);
    const hasPiiContext = classifications.some((c) => c.topic === 'Personal Identifiable Information' && c.score > 0.8);

    if (detection.type === 'CREDIT_CARD' && hasFinancialContext) {
      boostedConfidence = Math.min(0.999, detection.confidence * 1.05);
      console.log(`[ConfidenceFusion] Boosting CREDIT_CARD match based on Financial context: ${boostedConfidence}`);
    } else if (detection.type === 'EMAIL' && hasPiiContext) {
      boostedConfidence = Math.min(0.999, detection.confidence * 1.02);
      console.log(`[ConfidenceFusion] Boosting EMAIL match based on PII context: ${boostedConfidence}`);
    }

    return {
      ...detection,
      confidence: boostedConfidence
    };
  });
}
