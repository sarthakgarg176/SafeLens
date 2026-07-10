import { describe, it, expect } from 'vitest';
import { fuseConfidences } from '../src/ai/detection/confidenceFusion.js';

describe('Confidence Fusion Subsystem', () => {
  it('should filter out detections where rulePassed is explicitly false', () => {
    const detections = [
      { type: 'CREDIT_CARD', value: '1111', rulePassed: false },
      { type: 'CREDIT_CARD', value: '49927398716', rulePassed: true, ocrConfidence: 90, regexConfidence: 0.8 }
    ];

    const results = fuseConfidences(detections);
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe('49927398716');
  });

  it('should compute weighted fusion and assign correct severity classes', () => {
    const detections = [
      { type: 'EMAIL', value: 'user@test.com', rulePassed: true, ocrConfidence: 0.90, regexConfidence: 0.95 }
    ];

    const results = fuseConfidences(detections);
    expect(results).toHaveLength(1);
    
    // 0.7 * 0.95 + 0.3 * 0.90 = 0.665 + 0.270 = 0.935
    expect(results[0].fusedConfidence).toBeCloseTo(0.935, 3);
    expect(results[0].severity).toBe('medium');
  });

  it('should clamp fused confidences between 0.0 and 1.0', () => {
    const detections = [
      { type: 'AWS_ACCESS_KEY', value: 'AKIA1234567890123456', rulePassed: true, ocrConfidence: 1.5, regexConfidence: 1.2 }
    ];

    const results = fuseConfidences(detections);
    expect(results[0].fusedConfidence).toBe(1.0);
  });
});
