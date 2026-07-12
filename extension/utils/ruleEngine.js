/**
 * SafeLens Chrome Extension Evaluation Rule Engine
 *
 * Computes unified threat profiles, overall risk scores, document categorization,
 * and definitive action recommendation directives.
 */

/**
 * Evaluates the list of PII detection hits to determine the threat profile.
 *
 * @param {Array} hits An array of PII match hits.
 * @returns {Object} Unified threat profile containing riskScore, documentContext, and recommendation.
 */
export function evaluateThreatProfile(hits) {
  if (!hits || hits.length === 0) {
    return {
      riskScore: 0.0,
      documentContext: "Safe Document",
      recommendation: "PASS_SAFE"
    };
  }

  let rawScore = 0;
  let hasHighSeverity = false;

  const counts = {
    EMAIL: 0,
    AADHAAR: 0,
    PAN: 0,
    CREDIT_CARD: 0
  };

  hits.forEach(hit => {
    rawScore += hit.weight;
    if (hit.severity === 'high') {
      hasHighSeverity = true;
    }
    if (counts[hit.type] !== undefined) {
      counts[hit.type]++;
    }
  });

  // Calculate risk score scaled 0.0 to 10.0 and round to 1 decimal place
  const riskScore = Math.min(10.0, Math.round(rawScore * 10) / 10);

  // Document Context classification based on token density
  let documentContext = "General Document";
  const idCount = counts.AADHAAR + counts.PAN;
  const financialCount = counts.CREDIT_CARD;
  const emailCount = counts.EMAIL;

  if (idCount > 0 && idCount >= financialCount) {
    documentContext = "Government ID";
  } else if (financialCount > 0 && financialCount > idCount) {
    documentContext = "Financial Statement";
  } else if (emailCount > 0 && idCount === 0 && financialCount === 0) {
    documentContext = "General Communication";
  }

  // Definitive Action recommendation directive
  const recommendation = (riskScore >= 3.0 || hasHighSeverity)
    ? "REDACT_MANDATORY"
    : "PASS_SAFE";

  return {
    riskScore,
    documentContext,
    recommendation
  };
}
