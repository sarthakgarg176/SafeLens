/**
 * OpenCV.js Grayscale Image Preprocessor
 * 
 * Responsibility:
 * - Converts color images (RGBA) into grayscale to simplify character segmentation.
 * - Uses OpenCV `cv.cvtColor` with `cv.COLOR_RGBA2GRAY`.
 * - Explicitly releases WebAssembly Mat buffers to avoid memory leaks.
 * - Falls back to JavaScript luminosity formulas if OpenCV is unavailable.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement or OffscreenCanvas
 * - Output: Promise<HTMLCanvasElement|OffscreenCanvas> (Grayscale canvas)
 * 
 * Interacts with:
 * - extension/src/ai/preprocessing/preprocessImage.js
 */

/**
 * Converts a colored canvas to grayscale using OpenCV.js.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Source colored canvas
 * @returns {Promise<HTMLCanvasElement|OffscreenCanvas>} Grayscale canvas
 */
export async function toGrayscale(canvas) {
  if (!canvas) {
    throw new TypeError('Canvas parameter is required');
  }

  let src = null;
  let gray = null;
  let rgbaMat = null;

  try {
    // Verify OpenCV global context is ready
    if (typeof cv === 'undefined' || !cv.cvtColor) {
      throw new Error('OpenCV.js runtime is not loaded');
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 1. Allocate WebAssembly Mat buffers
    src = cv.matFromImageData(imgData);
    gray = new cv.Mat();

    // 2. Convert RGBA to Grayscale (single channel 8-bit)
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 3. Convert back to RGBA to render on browser canvas element
    rgbaMat = new cv.Mat();
    cv.cvtColor(gray, rgbaMat, cv.COLOR_GRAY2RGBA);

    const outputCanvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(canvas.width, canvas.height)
      : document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;

    const outCtx = outputCanvas.getContext('2d', { willReadFrequently: true });
    const outImgData = new ImageData(new Uint8ClampedArray(rgbaMat.data), rgbaMat.cols, rgbaMat.rows);
    outCtx.putImageData(outImgData, 0, 0);

    return outputCanvas;

  } catch (error) {
    console.warn('[Grayscale] OpenCV conversion failed. Falling back to native JS luminosity conversions:', error);
    
    // Graceful Fallback: JS-based Luminosity Formula (0.299R + 0.587G + 0.114B)
    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        
        data[i] = luminance;     // R
        data[i + 1] = luminance; // G
        data[i + 2] = luminance; // B
      }

      const fallbackCanvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(canvas.width, canvas.height)
        : document.createElement('canvas');
      fallbackCanvas.width = canvas.width;
      fallbackCanvas.height = canvas.height;
      
      fallbackCanvas.getContext('2d', { willReadFrequently: true }).putImageData(imgData, 0, 0);
      return fallbackCanvas;
    } catch (fallbackError) {
      console.error('[Grayscale] JS grayscale fallback failed. Returning original image.', fallbackError);
      return canvas;
    }
  } finally {
    // Explicit deallocation of WebAssembly objects
    if (src) src.delete();
    if (gray) gray.delete();
    if (rgbaMat) rgbaMat.delete();
  }
}
