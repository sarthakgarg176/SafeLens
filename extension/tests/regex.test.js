import { describe, it, expect } from 'vitest';
import { scanText } from '../src/ai/detection/regexDetector.js';

describe('Regex Sensitivity Pattern Detector', () => {
  const wordBoxes = [
    { text: 'My', confidence: 90, x: 0, y: 0, width: 20, height: 10 },
    { text: 'email', confidence: 90, x: 25, y: 0, width: 50, height: 10 },
    { text: 'is', confidence: 90, x: 80, y: 0, width: 20, height: 10 },
    { text: 'test@safelens.io', confidence: 95, x: 105, y: 0, width: 120, height: 10 },
    { text: 'PAN:', confidence: 90, x: 0, y: 20, width: 40, height: 10 },
    { text: 'ABCDE1234F', confidence: 99, x: 45, y: 20, width: 100, height: 10 }
  ];

  it('should detect valid emails and link correct bounding boxes', () => {
    const text = 'My email is test@safelens.io';
    const detections = scanText(text, wordBoxes);

    const emailMatch = detections.find(d => d.type === 'EMAIL');
    expect(emailMatch).toBeDefined();
    expect(emailMatch.value).toBe('test@safelens.io');
    expect(emailMatch.bboxes.length).toBeGreaterThan(0);
    expect(emailMatch.bboxes[0].width).toBe(120);
  });

  it('should detect valid Indian PAN card formats', () => {
    const text = 'PAN: ABCDE1234F';
    const detections = scanText(text, wordBoxes);

    const panMatch = detections.find(d => d.type === 'PAN');
    expect(panMatch).toBeDefined();
    expect(panMatch.value).toBe('ABCDE1234F');
  });

  it('should detect credentials and API keys in OCR output text', () => {
    const text = 'AWS keys ghp_123456789012345678901234567890123456 and AIzay12345678901234567890123456789012345';
    const detections = scanText(text, []);

    const patMatch = detections.find(d => d.type === 'GITHUB_PAT');
    const googleMatch = detections.find(d => d.type === 'GOOGLE_API_KEY');

    expect(patMatch).toBeDefined();
    expect(googleMatch).toBeDefined();
  });
});
