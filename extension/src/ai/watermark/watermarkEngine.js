import { dct2D, idct2D } from './dct.js';

/**
 * Invisible Watermarking Engine
 * 
 * Responsibility:
 * - Embeds invisible digital watermarks (ownership markers) into frequency coefficients.
 * - Restores frequency matrices back to RGB pixels.
 * - Extracts digital watermark keys from watermarked images.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement, watermarkText (string)
 * - Output: Promise<HTMLCanvasElement> (Watermarked canvas)
 * 
 * Interacts with:
 * - extension/src/ai/watermark/dct.js (Utilizes block transform utilities)
 * - extension/src/services/protectPipeline.js (Processes final assets)
 */

/**
 * Embeds an invisible watermark string key into the image canvas.
 * 
 * @param {HTMLCanvasElement} canvas - Target image canvas
 * @param {string} watermarkText - Watermark string identifier key
 * @returns {Promise<HTMLCanvasElement>} Watermarked output canvas
 */
export async function embedWatermark(canvas, watermarkText) {
  try {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError('Input must be an HTMLCanvasElement');
    }

    if (!watermarkText) {
      return canvas;
    }

    console.log(`[WatermarkEngine] Embedding invisible watermark text: "${watermarkText}"`);
    
    // In Phase 1/2 scaffolding, we overlay a near-transparent text signature
    // in the corner of the canvas to mock watermark metadata injection
    // without executing full block frequency transforms.
    // Full frequency DCT watermarking will replace this in Phase 3.
    const ctx = canvas.getContext('2d');
    
    ctx.save();
    ctx.font = '10px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)'; // Highly transparent/invisible to the eye
    ctx.fillText(watermarkText, 10, canvas.height - 10);
    ctx.restore();

    return canvas;

  } catch (error) {
    console.error('[WatermarkEngine] Failed to embed watermark:', error);
    throw error;
  }
}

/**
 * Extracts and decodes an invisible watermark key from the image canvas.
 * 
 * @param {HTMLCanvasElement} canvas - Watermarked image canvas
 * @returns {Promise<string>} Decoded watermark text
 */
export async function extractWatermark(canvas) {
  try {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError('Input must be an HTMLCanvasElement');
    }

    console.log('[WatermarkEngine] Attempting to extract watermark signatures...');
    
    // Mock decode response
    return 'SafeLens_Protected_Asset';

  } catch (error) {
    console.error('[WatermarkEngine] Failed to extract watermark:', error);
    throw error;
  }
}
