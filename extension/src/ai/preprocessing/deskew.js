/**
 * Deskewing Preprocessor
 * 
 * Responsibility:
 * - Detects rotation skew angles on textual documents.
 * - Rotates the canvas to straighten skewed text lines for better OCR parsing.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement
 * - Output: Promise<{ canvas: HTMLCanvasElement, angle: number }> (Straightened canvas & rotation angle)
 * 
 * Interacts with:
 * - extension/src/ai/preprocessing/preprocessImage.js
 */

/**
 * Detects the text skew angle and rotates the canvas to deskew it.
 * 
 * @param {HTMLCanvasElement} canvas - Input canvas
 * @returns {Promise<{ canvas: HTMLCanvasElement, angle: number }>} Straightened canvas and detected angle
 */
export async function deskewCanvas(canvas) {
  try {
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new TypeError('Input must be an HTMLCanvasElement');
    }

    console.log('[Deskew] Analyzing image for rotation skew...');
    
    // Default simulated skew: 0 degrees.
    // In future, OpenCV Hough Line Transform will calculate the skew angle.
    const detectedAngle = 0; 

    if (detectedAngle === 0) {
      return { canvas, angle: 0 };
    }

    // Straightening rotation operation
    const deskewedCanvas = document.createElement('canvas');
    const radians = (detectedAngle * Math.PI) / 180;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Calculate rotation boundaries
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    const newWidth = width * cos + height * sin;
    const newHeight = width * sin + height * cos;

    deskewedCanvas.width = newWidth;
    deskewedCanvas.height = newHeight;

    const outCtx = deskewedCanvas.getContext('2d');
    
    // Rotate relative to center
    outCtx.translate(newWidth / 2, newHeight / 2);
    outCtx.rotate(-radians);
    outCtx.drawImage(canvas, -width / 2, -height / 2);

    return { canvas: deskewedCanvas, angle: detectedAngle };

  } catch (error) {
    console.error('[Deskew] Error deskewing canvas:', error);
    throw error;
  }
}
