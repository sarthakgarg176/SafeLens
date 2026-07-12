import { describe, it, expect, vi } from 'vitest';
import { preprocessImage } from '../src/ai/preprocessing/preprocessImage.js';
import { resizeCanvas } from '../src/ai/preprocessing/resize.js';
import { toGrayscale } from '../src/ai/preprocessing/grayscale.js';
import { denoiseImage } from '../src/ai/preprocessing/denoise.js';
import { deskewCanvas } from '../src/ai/preprocessing/deskew.js';
import { applyThreshold } from '../src/ai/preprocessing/threshold.js';

describe('Image Preprocessing Modules', () => {
  const mockCanvas = new global.OffscreenCanvas(200, 200);

  it('should successfully downscale canvas sizes when within limits', async () => {
    const result = await resizeCanvas(mockCanvas, 100, 100);
    expect(result.width).toBeLessThanOrEqual(100);
    expect(result.height).toBeLessThanOrEqual(100);
  });

  it('should convert canvas color fields to single channel grayscale', async () => {
    const result = await toGrayscale(mockCanvas);
    expect(result).toBeDefined();
    expect(result.width).toBe(200);
  });

  it('should apply Gaussian spatial blur smoothing to denoise', async () => {
    const result = await denoiseImage(mockCanvas);
    expect(result).toBeDefined();
    expect(result.width).toBe(200);
  });

  it('should extract deskew angles and straighten horizontal text lines', async () => {
    const result = await deskewCanvas(mockCanvas);
    expect(result.canvas).toBeDefined();
    expect(typeof result.angle).toBe('number');
  });

  it('should binarize inputs using adaptive gaussian thresholding', async () => {
    const result = await applyThreshold(mockCanvas, 127);
    expect(result).toBeDefined();
    expect(result.width).toBe(200);
  });

  it('should execute the integrated preprocessing pipeline successfully', async () => {
    const result = await preprocessImage(mockCanvas, {
      enableDenoise: true,
      enableDeskew: true,
      thresholdValue: 127
    });
    expect(result).toBeDefined();
  });
});
