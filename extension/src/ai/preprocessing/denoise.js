/**
 * OpenCV.js Denoising Preprocessor
 * 
 * Responsibility:
 * - Smooths high-frequency noise, speckles, and scanner halftone patterns in document images.
 * - Uses OpenCV `cv.GaussianBlur` to provide extremely fast, low-latency smoothing (<10ms).
 * - Explicitly releases WebAssembly Mat buffers to avoid memory leaks.
 * - Gracefully skips and returns the original image on filter failure.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement or OffscreenCanvas
 * - Output: Promise<HTMLCanvasElement|OffscreenCanvas> (Denoised canvas)
 * 
 * Interacts with:
 * - extension/src/ai/preprocessing/preprocessImage.js
 */

/**
 * Denoises a canvas by applying a light spatial Gaussian filter using OpenCV.js.
 * We choose Gaussian Blur over Bilateral Filter because it takes under 10ms (vs >200ms),
 * which is critical for meeting our 300ms latency budget while still removing character edge noise.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Source image canvas
 * @returns {Promise<HTMLCanvasElement|OffscreenCanvas>} Denoised canvas
 */
export async function denoiseImage(canvas) {
  if (!canvas) {
    throw new TypeError('Canvas parameter is required');
  }

  let src = null;
  let dst = null;

  try {
    // Verify OpenCV global context is ready
    if (typeof cv === 'undefined' || !cv.GaussianBlur) {
      throw new Error('OpenCV.js runtime is not loaded');
    }

    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 1. Allocate WebAssembly Mat buffers
    src = cv.matFromImageData(imgData);
    dst = new cv.Mat();
    
    // 2. Perform Gaussian Smoothing. We use a 3x3 kernel (ksize) which is highly performant.
    const ksize = new cv.Size(3, 3);
    cv.GaussianBlur(src, dst, ksize, 0, 0, cv.BORDER_DEFAULT);

    // 3. Write back to canvas
    const outputCanvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(canvas.width, canvas.height)
      : document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;

    const outCtx = outputCanvas.getContext('2d');
    const outImgData = new ImageData(new Uint8ClampedArray(dst.data), dst.cols, dst.rows);
    outCtx.putImageData(outImgData, 0, 0);

    return outputCanvas;

  } catch (error) {
    console.warn('[Denoise] Denoising failed. Skipping this stage and returning original canvas:', error);
    
    // Graceful Fallback: Return original image unmodified to prevent breaking the pipeline
    return canvas;
  } finally {
    // Explicit deallocation of WebAssembly objects
    if (src) src.delete();
    if (dst) dst.delete();
  }
}
