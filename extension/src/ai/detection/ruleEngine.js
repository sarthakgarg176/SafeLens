/**
 * Verification Rule Engine
 * 
 * Responsibility:
 * - Validates structural detections (e.g. verifying credit cards via Luhn algorithm).
 * - Filters out false positives (e.g. random digit strings that are not valid card accounts).
 * - Modifies detection confidence levels based on rule checks.
 * 
 * Input/Output Contract:
 * - Input: Object[] (List of raw detections)
 * - Output: Object[] (List of verified and filtered detections)
 * 
 * Interacts with:
 * - extension/src/ai/detection/riskAnalyzer.js (Supplies validated matches)
 */

/**
 * Validates raw detections to filter false matches.
 * 
 * @param {Object[]} detections - Collection of raw detections
 * @returns {Object[]} Collection of validated and filtered detections
 */
export function validateDetections(detections) {
  if (!Array.isArray(detections)) {
    return [];
  }

  console.log(`[RuleEngine] Validating ${detections.length} raw detections...`);

  return detections.filter((detection) => {
    switch (detection.type) {
      case 'CREDIT_CARD':
        const cleanCard = detection.text.replace(/[-\s]/g, '');
        const isValidCard = luhnCheck(cleanCard);
        if (!isValidCard) {
          console.log(`[RuleEngine] Filtered invalid credit card match: ${detection.text}`);
        }
        return isValidCard;

      case 'SSN':
        const cleanSsn = detection.text.replace(/[-\s]/g, '');
        const isValidSsn = validateSsnStructure(cleanSsn);
        return isValidSsn;

      default:
        return true; // Keep other detections (e.g. Email, IP) by default
    }
  });
}

/**
 * Luhn algorithm check for credit cards.
 * 
 * @param {string} digits - String of digits
 * @returns {boolean} True if passes Luhn checksum
 */
function luhnCheck(digits) {
  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);

    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Basic structural check on SSN prefixes.
 * 
 * @param {string} ssn - Clean SSN string
 * @returns {boolean} True if format contains valid groups
 */
function validateSsnStructure(ssn) {
  if (ssn.length !== 9) return false;
  // SSNs cannot start with 000, 666, or 900-999
  const area = parseInt(ssn.substring(0, 3), 10);
  if (area === 0 || area === 666 || area >= 900) return false;
  // Group part cannot be 00
  const group = parseInt(ssn.substring(3, 5), 10);
  if (group === 0) return false;
  // Serial part cannot be 0000
  const serial = parseInt(ssn.substring(5, 9), 10);
  if (serial === 0) return false;

  return true;
}
