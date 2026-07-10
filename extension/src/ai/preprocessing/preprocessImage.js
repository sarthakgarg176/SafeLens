import { toGrayscale } from './grayscale.js';
import { denoiseImage } from './denoise.js';
import { deskewCanvas } from './deskew.js';
import { applyThreshold } from './threshold.js';
import { resizeCanvas } from './resize.js';

/**
 * Image Preprocessing Orchestrator
 * 
 * Responsibility:
 * - Coordinates the order of pre-filtering functions on uploaded image files.
 * - Conforms diverse input images to a standardized format optimized for OCR.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement or ImageData
 * - Output: Promise<HTMLCanvasElement> (Highly contrasted binarized image ready for OCR)
 * 
 * Interacts with:
 * - extension/src/services/protectPipeline.js (Uses this pipeline as the first step)
 */

/**
 * Runs the full preprocessing pipeline on the input image.
 * Grayscale -> Denoise -> Deskew -> Threshold -> Resize.
 * 
 * @param {HTMLCanvasElement|ImageData} imageSource - The original uploaded image data
 * @param {Object} [options] - Customized preprocessing options
 * @param {boolean} [options.enableDenoise=true] - Toggle image denoising
 * @param {boolean} [options.enableDeskew=true] - Toggle skew correction
 * @param {number} [options.thresholdValue=127] - Cutoff value for binary thresholding
 * @returns {Promise<HTMLCanvasElement>} Preprocessed, binary canvas
 */
export async function preprocessImage(imageSource, options = {}) {
  const {
    enableDenoise = true,
    enableDeskew = true,
    thresholdValue = 127
  } = options;

  console.log('[Preprocessor] Beginning image preprocessing pipeline...');

  try {
    // Step 1: Convert image to grayscale canvas
    let canvas = await toGrayscale(imageSource);

    // Step 2: Denoise to remove noise speckles
    if (enableDenoise) {
      canvas = await denoiseImage(canvas);
    }

    // Step 3: Correct rotation skew
    if (enableDeskew) {
      const deskewResult = await deskewCanvas(canvas);
      canvas = deskewResult.canvas;
    }

    // Step 4: Binarize image to optimize character detection
    canvas = await applyThreshold(canvas, thresholdValue);

    // Step 5: Resize to standard constraints to optimize CPU inference speed
    canvas = await resizeCanvas(canvas, 1920, 1080);

    console.log('[Preprocessor] Preprocessing pipeline completed successfully.');
    return canvas;

  } catch (error) {
    console.error('[Preprocessor] Error during preprocessing pipeline:', error);
    throw error;
  }
}
