/**
 * Regional Canvas Gaussian Blur Utility
 * 
 * Responsibility:
 * - Applies localized Gaussian blur to targeted coordinate regions on the canvas.
 * - Utilizes GPU-accelerated `ctx.filter = "blur(radiuspx)"` Canvas API for maximum performance.
 * - Supports custom configurable strength/radius values.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement or OffscreenCanvas, Object[] (List of boxes), blurRadius (number)
 * - Output: Promise<HTMLCanvasElement|OffscreenCanvas> (Blurred canvas)
 * 
 * Interacts with:
 * - extension/src/ai/blur/redactCanvas.js (Main coordinator calling this method)
 */

/**
 * Blurs specific bounding regions of a canvas using native GPU-accelerated CSS filters.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Target image canvas
 * @param {Object[]} regions - Collection of regions to blur: { x, y, width, height }
 * @param {number} [blurRadius=15] - Gaussian blur radius (larger is stronger)
 * @returns {Promise<HTMLCanvasElement|OffscreenCanvas>} Mutated canvas
 */
export async function blurCanvasRegions(canvas, regions, blurRadius = 15) {
  if (!canvas) {
    throw new TypeError('Canvas parameter is required');
  }

  if (!Array.isArray(regions) || regions.length === 0) {
    return canvas;
  }

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.save(); // Save base state

  try {
    regions.forEach((region) => {
      const { x, y, width, height } = region;
      
      // Clamp coordinates to canvas boundaries
      const drawX = Math.max(0, x);
      const drawY = Math.max(0, y);
      const drawW = Math.min(canvas.width - drawX, width);
      const drawH = Math.min(canvas.height - drawY, height);

      if (drawW <= 0 || drawH <= 0) {
        return;
      }

      // 1. Create a temporary offscreen buffer to isolate the sub-region pixels
      const tempCanvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(drawW, drawH)
        : document.createElement('canvas');
      tempCanvas.width = drawW;
      tempCanvas.height = drawH;

      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      tempCtx.drawImage(canvas, drawX, drawY, drawW, drawH, 0, 0, drawW, drawH);

      // 2. Configure original canvas clipping region to restrict blur leakage
      ctx.save();
      try {
        ctx.beginPath();
        ctx.rect(drawX, drawY, drawW, drawH);
        ctx.clip();

        // 3. Draw sub-region back with GPU-accelerated Gaussian Blur filter
        ctx.filter = `blur(${blurRadius}px)`;
        ctx.drawImage(tempCanvas, drawX, drawY);
      } finally {
        ctx.restore(); // Restore clipping context
      }
    });

  } catch (error) {
    console.error('[BlurCanvas] Regional Gaussian blur execution failed:', error);
    throw error;
  } finally {
    ctx.restore(); // Ensure baseline context is completely restored
  }

  return canvas;
}
