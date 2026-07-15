import { describe, it, expect, vi } from 'vitest';
import { protectImagePipeline } from '../src/services/protectService.js';

// Mock scan pipeline to return high-risk detection
vi.mock('../src/services/scanService.js', () => ({
  fileToCanvas: vi.fn((file) => Promise.resolve(new global.OffscreenCanvas(200, 200))),
  runScanPipeline: vi.fn((file, opts) => Promise.resolve({
    success: true,
    riskLevel: 'high',
    score: 8.5,
    piiCount: 1,
    detections: [{
      type: 'EMAIL',
      value: 'user@safelens.io',
      bboxes: [{ x: 10, y: 10, width: 80, height: 20 }],
      severity: 'medium',
      fusedConfidence: 0.92
    }]
  }))
}));

describe('Privacy Shield Protection Pipeline', () => {
  const mockFile = {
    name: 'audit_test_file.png',
    size: 1024,
    type: 'image/png',
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
  };

  it('should run full protectImagePipeline and return the protected File object', async () => {
    const settings = {
      autoRedact: true,
      blurMode: 'redact',
      watermarkEnabled: false,
      aiCloakEnabled: false
    };

    const result = await protectImagePipeline(mockFile, settings);
    expect(result.success).toBe(true);
    expect(result.phash).toHaveLength(16);
    expect(result.whash).toHaveLength(16);
    expect(result.risk).toBe('high');
    expect(result.detections.length).toBe(1);
    expect(result.protectedFile).toBeDefined();
    expect(result.protectedFile.name).toContain('_protected');
  });

  it('should skip visual redactions and return original file if evaluated as low risk', async () => {
    const settings = {
      autoRedact: false,
      blurMode: 'redact'
    };

    // Temporarily mock scan pipeline as low risk
    const scanService = await import('../src/services/scanService.js');
    scanService.runScanPipeline.mockImplementationOnce(() => Promise.resolve({
      success: true,
      riskLevel: 'low',
      detections: []
    }));

    const result = await protectImagePipeline(mockFile, settings);
    expect(result.success).toBe(true);
    expect(result.risk).toBe('low');
    expect(result.protectedFile.name).toBe('audit_test_file.png'); // Returns original unmodified
  });
});
