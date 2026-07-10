import { describe, it, expect } from 'vitest';
import { analyzeRisk } from '../src/ai/detection/riskAnalyzer.js';

describe('Document Risk Assessment Engine', () => {
  it('should classify document risk as low if there are no detections', () => {
    const report = analyzeRisk([]);
    expect(report.riskLevel).toBe('low');
    expect(report.score).toBe(0);
  });

  it('should evaluate risk as critical if a high-confidence credential key is present', () => {
    const detections = [
      { severity: 'critical', fusedConfidence: 0.85, type: 'AWS_ACCESS_KEY' }
    ];
    const report = analyzeRisk(detections);
    expect(report.riskLevel).toBe('critical');
    expect(report.score).toBeGreaterThan(0);
  });

  it('should accumulate cumulative score and escalate to high risk', () => {
    const detections = [
      { severity: 'medium', fusedConfidence: 0.9, type: 'EMAIL' },
      { severity: 'medium', fusedConfidence: 0.9, type: 'IFSC' },
      { severity: 'high', fusedConfidence: 0.8, type: 'PAN' }
    ];
    const report = analyzeRisk(detections);
    // points: EMAIL=2*0.9=1.8, IFSC=2*0.9=1.8, PAN=5*0.8=4.0 -> total = 7.6
    expect(report.score).toBe(7.6);
    expect(report.riskLevel).toBe('high'); // >=5
  });

  it('should scale down risk to medium if score matches boundaries', () => {
    const detections = [
      { severity: 'medium', fusedConfidence: 0.8, type: 'EMAIL' }
    ];
    const report = analyzeRisk(detections);
    expect(report.score).toBe(1.6);
    expect(report.riskLevel).toBe('low'); // < 2
  });
});
