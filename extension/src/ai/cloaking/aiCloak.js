import { applyPerturbations } from './perturbation.js';

/**
 * Adversarial AI Cloaker
 * 
 * Responsibility:
 * - Coordinates adversarial cloaking algorithms on face or document images.
 * - Injects imperceptible pixel perturbations to disrupt web-scraping AI trackers.
 * - Supports OffscreenCanvas context runs inside background worker threads.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement or OffscreenCanvas, options ({ strength: number })
 * - Output: Promise<HTMLCanvasElement|OffscreenCanvas> (Cloaked canvas)
 * 
 * Interacts with:
 * - extension/src/ai/cloaking/perturbation.js
 * - extension/src/services/protectService.js
 */

/**
 * Applies adversarial cloaking perturbations to the canvas.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Target image canvas
 * @param {Object} [options] - Configuration settings
 * @param {number} [options.strength=5] - Magnitude of the perturbation noise (1-10)
 * @returns {Promise<HTMLCanvasElement|OffscreenCanvas>} Cloaked output canvas
 */
export async function cloakImage(canvas, options = {}) {
  const { strength = 5 } = options;

  try {
    if (!canvas) {
      throw new TypeError('Canvas parameter is required');
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
