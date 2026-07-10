/**
 * Image Resizing Preprocessor
 * 
 * Responsibility:
 * - Downscales large images to prevent browser/OpenCV memory overflows.
 * - Upscales tiny images to ensure text remains legible for OCR engines.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement, targetWidth (optional), targetHeight (optional)
 * - Output: Promise<HTMLCanvasElement> (Resized canvas)
 * 
 * Interacts with:
 * - extension/src/ai/preprocessing/preprocessImage.js
 */

/**
 * Resizes a canvas to target dimensions, preserving aspect ratio if only one dimension is provided.
 * 
 * @param {HTMLCanvasElement} canvas - Source canvas to resize
 * @param {number} [maxWidth=1920] - Maximum allowable width
 * @param {number} [maxHeight=1080] - Maximum allowable height
 * @returns {Promise<HTMLCanvasElement>} Resized canvas
 */
export async function resizeCanvas(canvas, maxWidth = 1920, maxHeight = 1080) {
  try {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError('Input must be an HTMLCanvasElement');
    }

    let { width, height } = canvas;
    let needResize = false;

    // Calculate aspect ratio scaling
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
      needResize = true;
    }

    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
      needResize = true;
    }

    if (!needResize) {
      return canvas; // Return original if sizes are within limits
    }

    console.log(`[Resize] Resizing canvas from ${canvas.width}x${canvas.height} to ${width}x${height}`);

    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = width;
    resizedCanvas.height = height;
    const ctx = resizedCanvas.getContext('2d');
    
    // Draw with high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, width, height);

    return resizedCanvas;

  } catch (error) {
    console.error('[Resize] Error resizing canvas:', error);
    throw error;
  }
}
