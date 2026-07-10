import { addBoxPadding } from './padding.js';
import { mergeBoxes } from './mergeBoundingBoxes.js';

/**
 * Solid Redaction Canvas Utility
 * 
 * Responsibility:
 * - Draws solid color overlays (typically black boxes) over targeted sensitive regions.
 * - Guarantees 100% destruction of text pixels in redacted regions.
 * - Handles padding expansions and merges intersecting boxes prior to painting.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement, Object[] (List of coordinate regions), options ({ fillStyle: string })
 * - Output: Promise<HTMLCanvasElement> (Redacted canvas)
 * 
 * Interacts with:
 * - extension/src/ai/blur/padding.js (Applies boundary margin offsets)
 * - extension/src/ai/blur/mergeBoundingBoxes.js (Consolidates overlaps)
 */

/**
 * Redacts specific target regions by painting solid boxes on the canvas.
 * 
 * @param {HTMLCanvasElement} canvas - Target image canvas
 * @param {Object[]} regions - Collection of regions to redact: { x, y, width, height }
 * @param {Object} [options] - Customized styling options
 * @param {string} [options.fillStyle='#000000'] - Fill color of the redaction block
 * @param {number} [options.paddingX=6] - Horizontal padding margin
 * @param {number} [options.paddingY=4] - Vertical padding margin
 * @returns {Promise<HTMLCanvasElement>} Redacted output canvas
 */
export async function redactCanvasRegions(canvas, regions, options = {}) {
  const {
    fillStyle = '#000000',
    paddingX = 6,
    paddingY = 4
  } = options;

  try {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError('Input must be an HTMLCanvasElement');
    }

    if (!Array.isArray(regions) || regions.length === 0) {
      return canvas;
    }

    console.log(`[RedactCanvas] Redacting ${regions.length} regions with color: ${fillStyle}`);
    const ctx = canvas.getContext('2d');

    // 1. Apply padding expansions to each box
    const paddedRegions = regions.map((r) => 
      addBoxPadding(r, paddingX, paddingY, canvas.width, canvas.height)
    );

    // 2. Consolidate overlapping boxes to prevent rendering anomalies
    const mergedRegions = mergeBoxes(paddedRegions);

    // 3. Paint solid shapes onto the canvas context
    ctx.fillStyle = fillStyle;
    
    mergedRegions.forEach((region) => {
      const { x, y, width, height } = region;
      
      // Clamp coordinates to safe bounds
      const drawX = Math.max(0, x);
      const drawY = Math.max(0, y);
      const drawW = Math.min(canvas.width - drawX, width);
      const drawH = Math.min(canvas.height - drawY, height);

      if (drawW > 0 && drawH > 0) {
        ctx.fillRect(drawX, drawY, drawW, drawH);
      }
    });

    return canvas;

  } catch (error) {
    console.error('[RedactCanvas] Error redacting canvas:', error);
    throw error;
  }
}
