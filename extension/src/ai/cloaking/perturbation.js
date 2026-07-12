/**
 * Pixel Perturbation Math Engine
 * 
 * Responsibility:
 * - Computes and applies mathematical pixel perturbations (periodic adversarial waves).
 * - Alters pixel channel bits in a visually imperceptible way but mathematically disruptive to CNNs.
 * - Supports OffscreenCanvas context runs inside background worker threads.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement or OffscreenCanvas, strength (number)
 * - Output: Promise<HTMLCanvasElement|OffscreenCanvas> (Modified canvas)
 * 
 * Interacts with:
 * - extension/src/ai/cloaking/aiCloak.js
 */

/**
 * Alters pixel color channels with low-amplitude structured adversarial noise.
 * Generates coordinate-based high-frequency waves to disrupt CNN gradient weights.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Original image canvas
 * @param {number} strength - Noise intensity amplitude scale (1-10)
 * @returns {Promise<HTMLCanvasElement|OffscreenCanvas>} Perturbed output canvas
 */
export async function applyPerturbations(canvas, strength) {
  try {
    if (!canvas) {
      throw new TypeError('Canvas parameter is required');
    }

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Control the maximum amplitude deviation (typically +-5 scale offsets)
    const amplitude = strength * 0.8;

    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);

      // Generate a structured high-frequency checkerboard pattern based on coordinates.
      // This is visually invisible but introduces high-frequency noise that disrupts 
      // convolutional kernel weights in modern computer vision classifiers.
      const rOffset = Math.sin(x * 0.8) * Math.cos(y * 0.8) * amplitude;
      const gOffset = Math.cos(x * 0.8) * Math.sin(y * 0.8) * amplitude;
      const bOffset = Math.sin((x + y) * 0.5) * amplitude;

      // Adjust color channels and clamp to valid 8-bit scale
      data[i] = Math.min(255, Math.max(0, data[i] + rOffset));       // Red
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + gOffset)); // Green
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + bOffset)); // Blue
      // Alpha channel remains untouched
    }

    // Write back to a replicated canvas context
    const outputCanvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;

    const outCtx = outputCanvas.getContext('2d');
    outCtx.putImageData(imgData, 0, 0);

    return outputCanvas;

  } catch (error) {
    console.error('[Perturbation] Error applying pixel alterations:', error);
    throw error;
  }
}
