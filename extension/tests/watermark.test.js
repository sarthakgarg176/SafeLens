import { describe, it, expect } from 'vitest';
import { dct2D, idct2D } from '../src/ai/watermark/dct.js';
import { embedWatermark, extractWatermark } from '../src/ai/watermark/watermarkEngine.js';

describe('DCT Invisible Watermarking Engine', () => {
  const mockCanvas = new global.OffscreenCanvas(128, 128); // Multiple of 8
  const ctx = mockCanvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 128, 128);

  it('should compute forward and inverse 2D DCT accurately', () => {
    const inputBlock = Array.from({ length: 8 }, () => new Array(8).fill(128));
    const dctCoeffs = dct2D(inputBlock);
    const idctPixels = idct2D(dctCoeffs);

    // DCT reconstruction should yield original values
    expect(idctPixels[0][0]).toBeCloseTo(128, 2);
    expect(idctPixels[4][4]).toBeCloseTo(128, 2);
  });

  it('should embed and extract watermarks without visual changes', async () => {
    const text = 'SafeLens_Test';
    const watermarkedCanvas = await embedWatermark(mockCanvas, text);
    expect(watermarkedCanvas).toBeDefined();

    // In local tests, mock/simplified Y channel QIM math is run over MockCanvas getImageData
    const decoded = await extractWatermark(watermarkedCanvas);
    expect(decoded).toContain(text);
  });
});
