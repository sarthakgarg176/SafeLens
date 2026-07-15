import { addBoxPadding } from './padding.js';
import { mergeBoxes } from './mergeBoundingBoxes.js';
import { blurCanvasRegions } from './blurCanvas.js';

/**
 * Image Redaction and Masking Coordinator
 * 
 * Responsibility:
 * - Coordinates visual protection actions on target canvas images.
 * - Enforces that the original canvas is never modified (clones it first).
 * - Applies boundary padding margins and merges overlapping coordinate blocks.
 * - Supports three configurable modes:
 *   1. Solid Black Block (Standard redaction)
 *   2. Gaussian Blur (Localized GPU filter)
 *   3. Pixelation (Color averaging grid)
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement or OffscreenCanvas, Object[] (Raw regions), mode (string), options (Object)
 * - Output: Promise<HTMLCanvasElement|OffscreenCanvas> (Cloned protected canvas)
 * 
 * Interacts with:
 * - extension/src/ai/blur/padding.js (Pads coordinates)
 * - extension/src/ai/blur/mergeBoundingBoxes.js (Fuses overlapping boxes)
 * - extension/src/ai/blur/blurCanvas.js (Applies Gaussian filters)
 */

/**
 * Creates an exact replica of a canvas (HTMLCanvasElement or OffscreenCanvas) in memory.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Source canvas
 * @returns {HTMLCanvasElement|OffscreenCanvas} Cloned canvas reference
 */
export function cloneCanvas(canvas) {
  const isOffscreen = typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas;
  
  const clone = isOffscreen
    ? new OffscreenCanvas(canvas.width, canvas.height)
    : document.createElement('canvas');
    
  clone.width = canvas.width;
  clone.height = canvas.height;
  
  const ctx = clone.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0);
  return clone;
}

/**
 * Coordinates visual masking operations over targeted sensitive regions.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Source canvas image
 * @param {Object[]} regions - Collection of boxes to mask: { x, y, width, height }
 * @param {'redact'|'blur'|'pixelate'} [mode='redact'] - Masking style selection
 * @param {Object} [options] - Custom styling preferences
 * @param {number} [options.paddingX=8] - Horizontal padding margin
 * @param {number} [options.paddingY=6] - Vertical padding margin
 * @param {number} [options.blurRadius=15] - Gaussian blur strength radius
 * @param {number} [options.pixelationScale=8] - Pixelation scaling factor
 * @param {string} [options.fillStyle='#000000'] - Solid block color code
 * @returns {Promise<HTMLCanvasElement|OffscreenCanvas>} Protected canvas clone
 */
export async function redactCanvasRegions(canvas, regions, mode = 'redact', options = {}) {
  if (!canvas) {
    throw new TypeError('Canvas parameter is required');
  }

  // 1. Enforce safety rule: Never modify the original canvas
  const protectedCanvas = cloneCanvas(canvas);

  if (!Array.isArray(regions) || regions.length === 0) {
    return protectedCanvas; // Return clean clone if no regions match
  }

  const {
    paddingX = 8,
    paddingY = 6,
    blurRadius = 15,
    pixelationScale = 8,
    fillStyle = '#000000'
  } = options;

  console.log(`[RedactCanvas] Running masking pipeline. Mode: ${mode.toUpperCase()} on ${regions.length} regions.`);

  // 2. Add padding to boxes to prevent character edge leaks
  const paddedRegions = regions.map((box) =>
    addBoxPadding(box, paddingX, paddingY, protectedCanvas.width, protectedCanvas.height)
  );

  // 3. Merge overlapping and adjacent boxes to optimize drawing
  const mergedRegions = mergeBoxes(paddedRegions);

  const ctx = protectedCanvas.getContext('2d', { willReadFrequently: true });

  // 4. Apply selected protection mode
  if (mode === 'redact') {
    // Mode A: Solid Color Black Box Draw
    ctx.fillStyle = fillStyle;
    mergedRegions.forEach((region) => {
      const drawX = Math.max(0, region.x);
      const drawY = Math.max(0, region.y);
      const drawW = Math.min(protectedCanvas.width - drawX, region.width);
      const drawH = Math.min(protectedCanvas.height - drawY, region.height);

      if (drawW > 0 && drawH > 0) {
        ctx.fillRect(drawX, drawY, drawW, drawH);
      }
    });

  } else if (mode === 'blur') {
    // Mode B: Localized GPU-accelerated Gaussian Blur
    await blurCanvasRegions(protectedCanvas, mergedRegions, blurRadius);

  } else if (mode === 'pixelate') {
    // Mode C: CPU-based Block Pixelation
    pixelateCanvasRegions(protectedCanvas, mergedRegions, pixelationScale);
  }

  return protectedCanvas;
}

/**
 * Pixelates specific regions of a canvas using color averaging cells.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Target canvas
 * @param {Object[]} regions - Merged bounding boxes
 * @param {number} scale - Cell pixel size scale
 */
function pixelateCanvasRegions(canvas, regions, scale = 8) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  regions.forEach((region) => {
    const { x, y, width, height } = region;
    
    // Clamp to canvas limits
    const drawX = Math.max(0, x);
    const drawY = Math.max(0, y);
    const drawW = Math.min(canvas.width - drawX, width);
    const drawH = Math.min(canvas.height - drawY, height);

    if (drawW <= 0 || drawH <= 0) {
      return;
    }

    // Extract raw pixels for this region
    const imgData = ctx.getImageData(drawX, drawY, drawW, drawH);
    const data = imgData.data;

    // Group cells and average colors
    for (let cy = 0; cy < drawH; cy += scale) {
      for (let cx = 0; cx < drawW; cx += scale) {
        
        let rSum = 0, gSum = 0, bSum = 0, count = 0;

        // Sum colors inside cell matrix
        for (let dy = 0; dy < scale && cy + dy < drawH; dy++) {
          for (let dx = 0; dx < scale && cx + dx < drawW; dx++) {
            const idx = ((cy + dy) * drawW + (cx + dx)) * 4;
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
            count++;
          }
        }

        // Calculate averages
        const rAvg = Math.round(rSum / count);
        const gAvg = Math.round(gSum / count);
        const bAvg = Math.round(bSum / count);

        // Write averaged color back to cell matrix
        for (let dy = 0; dy < scale && cy + dy < drawH; dy++) {
          for (let dx = 0; dx < scale && cx + dx < drawW; dx++) {
            const idx = ((cy + dy) * drawW + (cx + dx)) * 4;
            data[idx] = rAvg;
            data[idx + 1] = gAvg;
            data[idx + 2] = bAvg;
          }
        }
      }
    }

    // Write modified pixel buffer back to canvas context
    ctx.putImageData(imgData, drawX, drawY);
  });
}
