/**
 * Binary Thresholding Preprocessor
 * 
 * Responsibility:
 * - Binarizes a grayscale canvas to pure black and white (thresholding).
 * - Isolates text structures and filters out background noise for OCR engines.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement (Grayscale)
 * - Output: Promise<HTMLCanvasElement> (Binarized canvas)
 * 
 * Interacts with:
 * - extension/src/ai/preprocessing/preprocessImage.js
 */

/**
 * Applies binary thresholding to a grayscale canvas.
 * Supports a manual threshold value or automatically defaults to basic global thresholding.
 * 
 * @param {HTMLCanvasElement} canvas - Grayscale source canvas
 * @param {number} [thresholdValue=127] - The threshold cutoff (0-255)
 * @returns {Promise<HTMLCanvasElement>} Binarized output canvas
 * @throws {TypeError} If parameter is not an HTMLCanvasElement
 */
export async function applyThreshold(canvas, thresholdValue = 127) {
  try {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError('Input must be an HTMLCanvasElement');
    }

    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Apply binary thresholding
    for (let i = 0; i < data.length; i += 4) {
      const v = data[i]; // Since it is grayscaled, R=G=B. Just read R
      const binary = v >= thresholdValue ? 255 : 0;
      
      data[i] = binary;     // R
      data[i + 1] = binary; // G
      data[i + 2] = binary; // B
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;

  } catch (error) {
    console.error('[Threshold] Error applying threshold:', error);
    throw error;
  }
}

/**
 * (Future Placeholder) Applies Otsu's Adaptive Thresholding algorithm.
 * 
 * @param {HTMLCanvasElement} canvas - Grayscale source canvas
 * @returns {Promise<HTMLCanvasElement>} Adaptively binarized canvas
 */
export async function applyOtsuThreshold(canvas) {
  console.log('[Threshold] Otsu adaptive threshold requested. Falling back to global threshold for now.');
  return applyThreshold(canvas, 127);
}
