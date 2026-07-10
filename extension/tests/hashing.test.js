import { describe, it, expect } from 'vitest';
import { generatePHash } from '../src/ai/hashing/perceptualHash.js';
import { generateWHash } from '../src/ai/hashing/waveletHash.js';

describe('Image Fingerprint Hashing Engines', () => {
  const mockCanvas = new global.OffscreenCanvas(200, 200);

  it('should generate a 16-character hexadecimal perceptual hash (pHash)', async () => {
    const phash = await generatePHash(mockCanvas);
    expect(phash).toHaveLength(16);
    expect(/^[0-9a-fA-F]{16}$/.test(phash)).toBe(true);
  });

  it('should generate a 16-character hexadecimal wavelet hash (wHash)', async () => {
    const whash = await generateWHash(mockCanvas);
    expect(whash).toHaveLength(16);
    expect(/^[0-9a-fA-F]{16}$/.test(whash)).toBe(true);
  });
});
