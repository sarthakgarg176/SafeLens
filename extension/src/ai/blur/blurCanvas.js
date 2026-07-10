/**
 * Regional Canvas Blur Utility
 * 
 * Responsibility:
 * - Applies localized blur filters (e.g. Gaussian blur, pixelation) to targeted regions.
 * - Modifies canvas pixels in-place or returns a mutated canvas.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement, Object[] (List of target bounding boxes), blurRadius (number)
 * - Output: Promise<HTMLCanvasElement> (Modified canvas with blurred areas)
 * 
 * Interacts with:
 * - extension/src/ai/blur/redactCanvas.js (Fallback mechanism or adjacent visual style)
 */

/**
 * Blurs specific bounding regions of a canvas using a pixelation effect.
 * 
 * @param {HTMLCanvasElement} canvas - The target image canvas
 * @param {Object[]} regions - Collection of regions to blur: { x, y, width, height }
 * @param {number} [pixelationScale=8] - Level of pixelation blur to apply (larger equals more blur)
 * @returns {Promise<HTMLCanvasElement>} Modified canvas
 */
export async function blurCanvasRegions(canvas, regions, pixelationScale = 8) {
  try {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError('Input must be an HTMLCanvasElement');
    }

    if (!Array.isArray(regions) || regions.length === 0) {
      return canvas;
    }

    console.log(`[BlurCanvas] Applying pixelation blur to ${regions.length} regions...`);
    const ctx = canvas.getContext('2d');

    regions.forEach((region) => {
      const { x, y, width, height } = region;
      
      // Clamp coordinates to safe bounds
      const drawX = Math.max(0, x);
      const drawY = Math.max(0, y);
      const drawW = Math.min(canvas.width - drawX, width);
      const drawH = Math.min(canvas.height - drawY, height);

      if (drawW <= 0 || drawH <= 0) return;

      // Extract pixel area
      const imgData = ctx.getImageData(drawX, drawY, drawW, drawH);
      const data = imgData.data;

      // Pixelation loop: group pixels into block cells
      for (let cy = 0; cy < drawH; cy += pixelationScale) {
        for (let cx = 0; cx < drawW; cx += pixelationScale) {
          
          // 1. Gather colors of current cell
          let rSum = 0, gSum = 0, bSum = 0, count = 0;
          
          for (let dy = 0; dy < pixelationScale && cy + dy < drawH; dy++) {
            for (let dx = 0; dx < pixelationScale && cx + dx < drawW; dx++) {
              const idx = ((cy + dy) * drawW + (cx + dx)) * 4;
              rSum += data[idx];
              gSum += data[idx + 1];
              bSum += data[idx + 2];
              count++;
            }
          }

          // Calculate average color
          const rAvg = Math.round(rSum / count);
          const gAvg = Math.round(gSum / count);
          const bAvg = Math.round(bSum / count);

          // 2. Write average color back to cell pixels
          for (let dy = 0; dy < pixelationScale && cy + dy < drawH; dy++) {
            for (let dx = 0; dx < pixelationScale && cx + dx < drawW; dx++) {
              const idx = ((cy + dy) * drawW + (cx + dx)) * 4;
              data[idx] = rAvg;
              data[idx + 1] = gAvg;
              data[idx + 2] = bAvg;
            }
          }
        }
      }

      ctx.putImageData(imgData, drawX, drawY);
    });

    return canvas;

  } catch (error) {
    console.error('[BlurCanvas] Error blurring canvas:', error);
    throw error;
  }
}
