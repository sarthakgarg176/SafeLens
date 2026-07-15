import { describe, it, expect, vi } from 'vitest';
import { recognizeImage } from '../src/ai/ocr/recognizeImage.js';
import { extractWords } from '../src/ai/ocr/extractWords.js';
import { extractLines } from '../src/ai/ocr/extractLines.js';
import { extractBoundingBoxes } from '../src/ai/ocr/extractBoundingBoxes.js';
import { getOCRWorker, runOCROnWorker, terminateWorker } from '../src/ai/ocr/tesseractWorker.js';

// Mock Tesseract.js Worker
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(() => Promise.resolve({
    recognize: vi.fn(() => Promise.resolve({
      data: {
        text: 'Mock intercepted PII credentials email@safelens.io',
        confidence: 92.5,
        words: [
          { text: 'Mock', confidence: 95, bbox: { x0: 10, y0: 10, x1: 50, y1: 30 } },
          { text: 'intercepted', confidence: 90, bbox: { x0: 60, y0: 10, x1: 150, y1: 30 } },
          { text: 'email@safelens.io', confidence: 93, bbox: { x0: 160, y0: 10, x1: 300, y1: 30 } }
        ],
        lines: [
          { text: 'Mock intercepted PII credentials email@safelens.io', bbox: { x0: 10, y0: 10, x1: 300, y1: 30 } }
        ]
      }
    })),
    terminate: vi.fn(() => Promise.resolve())
  }))
}));

describe('OCR Subsystem Modules', () => {
  const mockCanvas = new global.OffscreenCanvas(200, 200);

  it('should initialize OCR worker and process canvas buffer text recognition', async () => {
    const result = await recognizeImage(mockCanvas);
    expect(result.success).toBeUndefined(); // recognizeImage returns raw OCR object or falls back
    expect(result.text).toContain('email@safelens.io');
    expect(result.confidence).toBe(92.5);
    expect(result.words.length).toBe(3);
    expect(result.lines.length).toBe(1);
    expect(result.boundingBoxes.length).toBe(3);
    await terminateWorker();
  });

  it('should extract word elements with bounding coordinates', () => {
    const mockData = {
      words: [{ text: 'PII', confidence: 85, bbox: { x0: 5, y0: 5, x1: 40, y1: 25 } }]
    };
    const words = extractWords(mockData);
    expect(words).toHaveLength(1);
    expect(words[0].text).toBe('PII');
    expect(words[0].bbox.x0).toBe(5);
  });

  it('should organize word sequences into horizontal line blocks', () => {
    const mockData = {
      lines: [{ text: 'Line block text', bbox: { x0: 0, y0: 0, x1: 100, y1: 20 } }]
    };
    const lines = extractLines(mockData);
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe('Line block text');
  });

  it('should format coordinates to standard bounding box wrappers', () => {
    const mockData = {
      words: [{ text: 'box', confidence: 99, bbox: { x0: 20, y0: 10, x1: 50, y1: 30 } }]
    };
    const boxes = extractBoundingBoxes(mockData);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].width).toBe(30);
    expect(boxes[0].height).toBe(20);
  });
});
