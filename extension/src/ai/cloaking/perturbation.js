/**
 * Pixel Perturbation Math Engine
 * 
 * Responsibility:
 * - Computes and applies mathematical pixel perturbations (e.g. FGSM-like adversarial noise).
 * - Alters pixel channel bits in a visually imperceptible way but mathematically disruptive to CNNs.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement, strength (number)
 * - Output: Promise<HTMLCanvasElement> (Modified canvas)
 * 
 * Interacts with:
 * - extension/src/ai/cloaking/aiCloak.js
 */

/**
 * Alters pixel color channels with low-amplitude adversarial noise.
 * 
 * @param {HTMLCanvasElement} canvas - Original image canvas
 * @param {number} strength - Noise intensity amplitude scale
 * @returns {Promise<HTMLCanvasElement>} Perturbed output canvas
 */
export async function applyPerturbations(canvas, strength) {
  try {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError('Input must be an HTMLCanvasElement');
    }

    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Apply high-frequency, low-amplitude pseudo-random noise
    // to simulate adversarial perturbations (FGSM) in Phase 1/2.
    // In Phase 3, this can link to a lightweight CNN output gradient.
    const amplitude = strength * 1.5; 

    for (let i = 0; i < data.length; i += 4) {
      // Generate pseudo-random perturbation offsets between -amplitude and +amplitude
      const rOffset = (Math.random() * 2 - 1) * amplitude;
      const gOffset = (Math.random() * 2 - 1) * amplitude;
      const bOffset = (Math.random() * 2 - 1) * amplitude;

      // Alter channels and clamp between 0-255
      data[i] = Math.min(255, Math.max(0, data[i] + rOffset));     // R
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + gOffset)); // G
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + bOffset)); // B
      // data[i+3] (Alpha) is kept constant
    }

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outCtx = outputCanvas.getContext('2d');
    outCtx.putImageData(imgData, 0, 0);

    return outputCanvas;

  } catch (error) {
    console.error('[Perturbation] Error applying pixel alterations:', error);
    throw error;
  }
}
