import { applyPerturbations } from './perturbation.js';

/**
 * Adversarial AI Cloaker
 * 
 * Responsibility:
 * - Coordinates adversarial cloaking algorithms on face or document images.
 * - Injects imperceptible pixel perturbations to disrupt web-scraping AI trackers
 *   (e.g., preventing face recognition engines or document classifiers from scraping).
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement, options ({ strength: number })
 * - Output: Promise<HTMLCanvasElement> (Cloaked canvas containing adversarial noise)
 * 
 * Interacts with:
 * - extension/src/ai/cloaking/perturbation.js (Applies mathematical pixel noise calculations)
 * - extension/src/services/protectPipeline.js (Processes final visual protections)
 */

/**
 * Applies adversarial cloaking perturbations to the canvas.
 * 
 * @param {HTMLCanvasElement} canvas - Target image canvas
 * @param {Object} [options] - Configuration settings
 * @param {number} [options.strength=5] - Magnitude of the perturbation noise (1-10)
 * @returns {Promise<HTMLCanvasElement>} Cloaked output canvas
 */
export async function cloakImage(canvas, options = {}) {
  const { strength = 5 } = options;

  try {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError('Input must be an HTMLCanvasElement');
    }

    console.log(`[AICloak] Injecting adversarial cloak (intensity: ${strength})...`);

    // Delegate mathematical pixel alterations to the perturbation engine
    const cloakedCanvas = await applyPerturbations(canvas, strength);
    
    console.log('[AICloak] Adversarial noise mapping completed.');
    return cloakedCanvas;

  } catch (error) {
    console.error('[AICloak] Failed to apply adversarial cloaking:', error);
    throw error;
  }
}
