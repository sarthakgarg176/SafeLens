/**
 * OpenCV.js Binary Thresholding Preprocessor
 * 
 * Responsibility:
 * - Binarizes grayscale images into pure black and white to maximize contrast.
 * - Uses OpenCV `cv.adaptiveThreshold` with `cv.ADAPTIVE_THRESH_GAUSSIAN_C`.
 * - Explicitly releases WebAssembly Mat buffers to avoid memory leaks.
 * - Gracefully falls back to grayscale images if adaptive binarization fails.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement or OffscreenCanvas (Grayscale preferred)
 * - Output: Promise<HTMLCanvasElement|OffscreenCanvas> (Binarized canvas)
 * 
 * Interacts with:
 * - extension/src/ai/preprocessing/preprocessImage.js
 */

/**
 * Applies binary adaptive thresholding to a canvas using OpenCV.js.
 * We choose Adaptive Gaussian Thresholding over Global/Otsu binarization because Global
 * thresholding fails under uneven page illumination (shadows). Adaptive thresholding
 * computes threshold averages in local 11x11 pixel windows, preserving text details.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Source grayscale canvas
 * @param {number} [thresholdValue=127] - Global threshold fallback value (0-255)
 * @returns {Promise<HTMLCanvasElement|OffscreenCanvas>} Binarized output canvas
 */
export async function applyThreshold(canvas, thresholdValue = 127) {
  if (!canvas) {
    throw new TypeError('Canvas parameter is required');
  }

  let src = null;
  let gray = null;
  let dst = null;
  let rgbaMat = null;

  try {
    // Verify OpenCV global context is ready
    if (typeof cv === 'undefined' || !cv.adaptiveThreshold) {
      throw new Error('OpenCV.js runtime is not loaded');
    }

    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 1. Allocate WebAssembly Mat buffers
    src = cv.matFromImageData(imgData);
    gray = new cv.Mat();
    
    // 2. Ensure input is grayscaled (single channel)
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 3. Apply Adaptive Gaussian Thresholding (11x11 block size, subtract constant 2)
    dst = new cv.Mat();
    cv.adaptiveThreshold(
      gray,
      dst,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      11,
      2
    );

    // 4. Convert back to RGBA to draw on canvas
    rgbaMat = new cv.Mat();
    cv.cvtColor(dst, rgbaMat, cv.COLOR_GRAY2RGBA);

    const outputCanvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(canvas.width, canvas.height)
      : document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;

    const outCtx = outputCanvas.getContext('2d');
    const outImgData = new ImageData(new Uint8ClampedArray(rgbaMat.data), rgbaMat.cols, rgbaMat.rows);
    outCtx.putImageData(outImgData, 0, 0);

    return outputCanvas;

  } catch (error) {
    console.warn('[Threshold] OpenCV adaptive thresholding failed. Falling back to grayscale image:', error);
    
    // Graceful Fallback: Grayscaled canvas (Javascript-based conversion)
    try {
      const fallbackCanvas = await fallbackToGrayscale(canvas);
      return fallbackCanvas;
    } catch (fallbackError) {
      console.error('[Threshold] Grayscale fallback failed. Returning original canvas.', fallbackError);
      return canvas;
    }
  } finally {
    // Explicit deallocation of WebAssembly objects
    if (src) src.delete();
    if (gray) gray.delete();
    if (dst) dst.delete();
    if (rgbaMat) rgbaMat.delete();
  }
}

/**
 * Lightweight JavaScript grayscale fallback.
 */
async function fallbackToGrayscale(canvas) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  const fallbackCanvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(canvas.width, canvas.height)
    : document.createElement('canvas');
  fallbackCanvas.width = canvas.width;
  fallbackCanvas.height = canvas.height;
  
  fallbackCanvas.getContext('2d').putImageData(imgData, 0, 0);
  return fallbackCanvas;
}
