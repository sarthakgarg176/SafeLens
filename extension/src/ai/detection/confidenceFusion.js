/**
 * Confidence Fusion Engine
 * Logic: Merges Regex detections and Semantic AI predictions for a robust risk score.
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

export function fuseConfidence(regexDetections, semanticResult) {
  const WEIGHT_REGEX = 0.6;
  const WEIGHT_SEMANTIC = 0.4;
  
  // 1. Process Detections
  const fusedDetections = regexDetections.map((det) => {
    let ocrConf = typeof det.ocrConfidence === 'number' ? det.ocrConfidence : 0.5;
    let regexConf = typeof det.regexConfidence === 'number' ? det.regexConfidence : 0.8;

    if (det.rulePassed === false) {
      console.warn(`[ConfidenceFusion] Rule validation failed for [${det.type}]. Keeping for safety.`);
      ocrConf *= 0.1; 
      regexConf *= 0.1;
    }

    let fused = 0.7 * regexConf + 0.3 * ocrConf;
    fused = Math.min(1.0, Math.max(0.0, fused));

    return {
      ...det,
      fusedConfidence: parseFloat(fused.toFixed(4)),
      severity: SEVERITY_LEVELS[det.type] || 'medium'
    };
  });

  // 2. Semantic Score Integration
  const sensitiveLabels = ['Government ID', 'Financial Statement', 'Medical Record', 'Passport', 'Aadhaar Card', 'PAN Card'];
  const isSensitiveTopic = sensitiveLabels.includes(semanticResult.topic);
  
  // Higher weight if semantic model is confident
  const finalSemanticScore = isSensitiveTopic ? semanticResult.confidence : 0.0;

  return {
    fusedDetections,
    semanticContext: {
      topic: semanticResult.topic,
      confidence: semanticResult.confidence,
      isSensitive: isSensitiveTopic
    },
    finalGlobalScore: (fusedDetections.length > 0 ? 0.9 : 0.1) * WEIGHT_REGEX + (finalSemanticScore * WEIGHT_SEMANTIC)
  };
}