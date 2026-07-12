import { describe, it, expect } from 'vitest';
import { 
  validateAadhaar, 
  validateLuhn, 
  validatePAN, 
  validatePassport, 
  validateDrivingLicense, 
  validateDetections 
} from '../src/ai/detection/ruleEngine.js';

describe('Rule Verification Engine', () => {
  it('should validate credit cards using the Luhn mod10 algorithm', () => {
    // Valid 16-digit credit card number
    expect(validateLuhn('4111111111111111')).toBe(true);
    // Invalid credit card number
    expect(validateLuhn('4111111111111118')).toBe(false);
  });

  it('should validate Aadhaar numbers using the Verhoeff lookup tables', () => {
    // Valid Aadhaar checksum (starts with 9, 12 digits, verified Verhoeff)
    expect(validateAadhaar('9000-0000-0002')).toBe(true);
    // Invalid Aadhaar numbers starting with 0/1 or having bad checksum digits
    expect(validateAadhaar('0000-0000-0002')).toBe(false);
    expect(validateAadhaar('9000-0000-0003')).toBe(false);
  });

  it('should validate Indian PAN card holder categories', () => {
    // P = Person (Allowed), D = Not in allowed category list
    expect(validatePAN('ABCDE1234F')).toBe(false);
    // Invalid format (numbers and letters mismatched)
    expect(validatePAN('ABCPD12345')).toBe(false);
    // Standard category matching (P = Person)
    expect(validatePAN('ABCPA1234E')).toBe(true);
  });

  it('should validate Indian Passport formats', () => {
    expect(validatePassport('Q1234567')).toBe(false); // Q is excluded in passport letter prefix check
    expect(validatePassport('A1234567')).toBe(true);  // A is valid
  });

  it('should validate Indian Driving Licenses', () => {
    expect(validateDrivingLicense('DL0420110123456')).toBe(true);
    expect(validateDrivingLicense('DL04-2011-0123456')).toBe(true);
  });

  it('should filter candidate detections array and mark rulePassed values', () => {
    const rawMatches = [
      { type: 'CREDIT_CARD', value: '4111111111111111' },
      { type: 'CREDIT_CARD', value: '4111111111111118' },
      { type: 'EMAIL', value: 'admin@safelens.io' }
    ];

    const results = validateDetections(rawMatches);
    expect(results[0].rulePassed).toBe(true);
    expect(results[1].rulePassed).toBe(false);
    expect(results[2].rulePassed).toBe(true); // Default pass
  });
});
