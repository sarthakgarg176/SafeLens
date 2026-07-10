/**
 * Rule Verification Engine
 * 
 * Responsibility:
 * - Runs structural validation checks on candidate PII detections.
 * - Implements Luhn Algorithm (Mod 10) to validate credit card numbers.
 * - Implements Verhoeff Algorithm to validate Indian Aadhaar card numbers.
 * - Validates format codes for PAN cards, IFSC codes, Passports, and Driving Licenses.
 * - Appends a validation flag (`rulePassed`) to help confidence scoring.
 * 
 * Input/Output Contract:
 * - Input: Object[] (Raw regex detections)
 * - Output: Object[] (Detections containing rulePassed flags)
 * 
 * Interacts with:
 * - extension/src/ai/detection/confidenceFusion.js
 */

// Verhoeff lookup tables
const dTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const pTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 1, 4, 6, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

/**
 * Validates Aadhaar card digits using Verhoeff algorithm.
 * 
 * @param {string} value - Aadhaar candidate string
 * @returns {boolean} Checksum status
 */
export function validateAadhaar(value) {
  const clean = value.replace(/[-\s]/g, '');
  if (clean.length !== 12 || !/^\d{12}$/.test(clean)) {
    return false;
  }

  // Aadhaar numbers cannot start with 0 or 1
  if (clean[0] === '0' || clean[0] === '1') {
    return false;
  }

  let c = 0;
  const digits = clean.split('').map(Number).reverse();

  for (let i = 0; i < digits.length; i++) {
    c = dTable[c][pTable[i % 8][digits[i]]];
  }

  return c === 0;
}

/**
 * Validates credit card formats using the Luhn Algorithm.
 * 
 * @param {string} value - Credit card digit string
 * @returns {boolean} Checksum status
 */
export function validateLuhn(value) {
  const clean = value.replace(/[-\s]/g, '');
  if (!/^\d{13,19}$/.test(clean)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Validates Permanent Account Number (PAN) formats.
 * 
 * @param {string} value - PAN candidate
 * @returns {boolean} Format validity
 */
export function validatePAN(value) {
  // PAN format: 5 letters, 4 digits, 1 letter (uppercase)
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  const clean = value.trim().toUpperCase();

  if (!regex.test(clean)) {
    return false;
  }

  // 4th character represents holder category (P=Person, C=Company, etc.)
  const allowedCategories = ['P', 'C', 'H', 'F', 'A', 'T', 'B', 'L', 'J', 'G'];
  return allowedCategories.includes(clean[3]);
}

/**
 * Validates Indian passport number patterns.
 * 
 * @param {string} value - Passport candidate
 * @returns {boolean}
 */
export function validatePassport(value) {
  // Indian passports: 1 uppercase letter, 7 digits
  // First letter cannot be Q, O, X, Z
  const clean = value.trim().toUpperCase();
  const regex = /^[A-PR-WYZ][0-9]{7}$/;
  return regex.test(clean);
}

/**
 * Validates Indian driving license patterns.
 * 
 * @param {string} value - Driving license candidate
 * @returns {boolean}
 */
export function validateDrivingLicense(value) {
  const clean = value.replace(/[-\s]/g, '').toUpperCase();
  // DL format is 15 characters: State Code (2 letters), RTO Code (2 digits), Year (4 digits), Unique Id (7 digits)
  // E.g. DL0420110123456
  const regex = /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/;
  return regex.test(clean);
}

/**
 * Evaluates candidate detections and appends rule validation results.
 * 
 * @param {Object[]} detections - Raw candidate detections
 * @returns {Object[]} Detections with validation flags
 */
export function validateDetections(detections) {
  if (!Array.isArray(detections)) {
    return [];
  }

  return detections.map((det) => {
    let rulePassed = true; // Default true if no checks apply

    try {
      switch (det.type) {
        case 'AADHAAR':
          rulePassed = validateAadhaar(det.value);
          break;
        case 'CREDIT_CARD':
          rulePassed = validateLuhn(det.value);
          break;
        case 'PAN':
          rulePassed = validatePAN(det.value);
          break;
        case 'PASSPORT':
          rulePassed = validatePassport(det.value);
          break;
        case 'DRIVING_LICENSE':
          rulePassed = validateDrivingLicense(det.value);
          break;
        case 'IFSC':
          // IFSC format validation (4 letters, '0', 6 alphanumeric characters)
          rulePassed = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(det.value.trim().toUpperCase());
          break;
        default:
          rulePassed = true;
          break;
      }
    } catch (e) {
      console.warn(`[RuleEngine] Check execution exception for type ${det.type}:`, e);
      rulePassed = false;
    }

    return {
      ...det,
      rulePassed
    };
  });
}
