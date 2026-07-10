import { preprocessImage } from '../ai/preprocessing/preprocessImage.js';
import { recognizeImage } from '../ai/ocr/recognizeImage.js';
import { cloakImage } from '../ai/cloaking/aiCloak.js';
import { embedWatermark } from '../ai/watermark/watermarkEngine.js';
import { redactCanvasRegions } from '../ai/blur/redactCanvas.js';
import { blurCanvasRegions } from '../ai/blur/blurCanvas.js';

/**
 * Public Gateway API Service for AI Subsystems
 * 
 * Responsibility:
 * - Exposes unified asynchronous interfaces for visual processing tasks.
 * - Decouples outer logic coordinators from specific directories in `src/ai/`.
 * 
 * Interacts with:
 * - All files under extension/src/ai/
 */

/**
 * Executes preprocessing and character recognition on a canvas.
 * 
 * @param {HTMLCanvasElement} canvas - Target image canvas
 * @param {Object} [options] - Preprocessing overrides
 * @returns {Promise<{ text: string, words: Object[], lines: Object[] }>} Raw OCR text and layout data
 */
export async function scanImage(canvas, options = {}) {
  console.log('[AIService] Delegating image scan request...');
  const cleanedCanvas = await preprocessImage(canvas, options);
  return recognizeImage(cleanedCanvas);
}

/**
 * Injects adversarial cloaking perturbations into the canvas pixels.
 * 
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {number} strength - Noise intensity amplitude (1-10)
 * @returns {Promise<HTMLCanvasElement>} Perturbed canvas
 */
export async function applyAdversarialCloak(canvas, strength) {
  console.log('[AIService] Delegating adversarial cloaking request...');
  return cloakImage(canvas, { strength });
}

/**
 * Embeds an invisible frequency-domain watermark into the canvas.
 * 
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {string} watermarkText - Identifier key string
 * @returns {Promise<HTMLCanvasElement>} Watermarked canvas
 */
export async function applyWatermark(canvas, watermarkText) {
  console.log('[AIService] Delegating invisible watermark embedding...');
  return embedWatermark(canvas, watermarkText);
}

/**
 * Applies visual redaction masks (solid color blocks or pixelation blurs) on canvas coordinates.
 * 
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {Object[]} regions - Bounding box coordinates: { x, y, width, height }
 * @param {'redact'|'blur'} mode - Redaction mode
 * @returns {Promise<HTMLCanvasElement>} Redacted canvas
 */
export async function redactImageRegions(canvas, regions, mode = 'redact') {
  console.log(`[AIService] Delegating redaction request (mode: ${mode}) for ${regions.length} regions.`);
  
  if (mode === 'blur') {
    return blurCanvasRegions(canvas, regions, 8);
  } else {
    return redactCanvasRegions(canvas, regions, { fillStyle: '#000000' });
  }
}
