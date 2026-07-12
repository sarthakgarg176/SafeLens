import { describe, it, expect, vi } from 'vitest';
import { redactCanvasRegions } from '../src/ai/blur/redactCanvas.js';
import { addBoxPadding } from '../src/ai/blur/padding.js';
import { mergeBoxes } from '../src/ai/blur/mergeBoundingBoxes.js';
import { blurCanvasRegions } from '../src/ai/blur/blurCanvas.js';

describe('Image Redaction Subsystem', () => {
  const mockCanvas = new global.OffscreenCanvas(500, 500);

  it('should pad bounding boxes safely within canvas constraints', () => {
    const box = { x: 10, y: 10, width: 50, height: 20 };
    const padded = addBoxPadding(box, 8, 6, 500, 500);
    expect(padded.x).toBe(2);
    expect(padded.y).toBe(4);
    expect(padded.width).toBe(66);  // (10+50+8) - 2 = 68 - 2 = 66
    expect(padded.height).toBe(32); // (10+20+6) - 4 = 36 - 4 = 32
  });

  it('should merge overlapping and adjacent bounding boxes', () => {
    const boxes = [
      { x: 10, y: 10, width: 50, height: 20, detection: { type: 'PII', value: '1' } },
      { x: 70, y: 10, width: 40, height: 20, detection: { type: 'PII', value: '2' } } // Separated by 10px (under 15px gap threshold)
    ];

    const merged = mergeBoxes(boxes);
    expect(merged).toHaveLength(1);
    expect(merged[0].width).toBe(100); // 10 to 110
  });

  it('should run solid color block redactions on canvas', async () => {
    const regions = [{ x: 50, y: 50, width: 100, height: 30 }];
    const result = await redactCanvasRegions(mockCanvas, regions, 'redact', { fillStyle: '#000000' });
    expect(result).toBeDefined();
  });

  it('should run gaussian blurs on canvas regions', async () => {
    const regions = [{ x: 50, y: 50, width: 100, height: 30 }];
    const result = await blurCanvasRegions(mockCanvas, regions, 15);
    expect(result).toBeDefined();
  });
});
