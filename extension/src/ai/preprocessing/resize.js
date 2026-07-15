/**
 * OpenCV.js Image Resizing Preprocessor
 * 
 * Responsibility:
 * - Downscales large images to fit within standard maximum dimensions (1920x1080)
 * - Uses OpenCV `cv.resize` with `cv.INTER_AREA` (pixel area relation resampling) for optimal downscaling contrast.
 * - Explicitly releases WebAssembly memory to prevent RAM leaks.
 * - Gracefully falls back to 2D canvas drawing on failure.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement or OffscreenCanvas
 * - Output: Promise<HTMLCanvasElement|OffscreenCanvas> (Scaled canvas)
 * 
 * Interacts with:
 * - extension/src/ai/preprocessing/preprocessImage.js
 */

/**
 * Resizes a canvas to target maximum dimensions using OpenCV.js.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Source image canvas
 * @param {number} [maxWidth=1920] - Maximum allowed width
 * @param {number} [maxHeight=1080] - Maximum allowed height
 * @returns {Promise<HTMLCanvasElement|OffscreenCanvas>} Resized canvas
 */
export async function resizeCanvas(canvas, maxWidth = 1920, maxHeight = 1080) {
  if (!canvas) {
    throw new TypeError('Canvas parameter is required');
  }

  let src = null;
  let dst = null;

  try {
    let { width, height } = canvas;
    let needResize = false;

    // Calculate aspect ratio boundaries
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

    // Skip if image is already within bounds
    if (!needResize) {
      return canvas;
    }

    console.log(`[Resize] Scaling image down to ${width}x${height} using cv.resize`);

    // Verify OpenCV global context is ready
    if (typeof cv === 'undefined' || !cv.matFromImageData) {
      throw new Error('OpenCV.js runtime is not loaded');
    }

    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 1. Allocate WebAssembly Mat representations
    src = cv.matFromImageData(imgData);
    dst = new cv.Mat();
    const dsize = new cv.Size(width, height);

    // 2. Perform scaling. cv.INTER_AREA resamples using pixel area relations to prevent aliasing.
    cv.resize(src, dst, dsize, 0, 0, cv.INTER_AREA);

    // 3. Write processed pixel matrix back to canvas
    const outputCanvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;

    const outCtx = outputCanvas.getContext('2d');
    const outImgData = new ImageData(new Uint8ClampedArray(dst.data), dst.cols, dst.rows);
    outCtx.putImageData(outImgData, 0, 0);

    return outputCanvas;

  } catch (error) {
    console.warn('[Resize] OpenCV resizing failed. Falling back to native canvas context scaling:', error);
    
    // Graceful Fallback: Rescale using standard 2D canvas draw
    try {
      const { width, height } = canvas;
      let newWidth = width;
      let newHeight = height;

      if (newWidth > maxWidth) {
        newHeight = Math.round((newHeight * maxWidth) / newWidth);
        newWidth = maxWidth;
      }
      if (newHeight > maxHeight) {
        newWidth = Math.round((newWidth * maxHeight) / newHeight);
        newHeight = maxHeight;
      }

      const fallbackCanvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(newWidth, newHeight)
        : document.createElement('canvas');
      fallbackCanvas.width = newWidth;
      fallbackCanvas.height = newHeight;

      const fallbackCtx = fallbackCanvas.getContext('2d');
      fallbackCtx.imageSmoothingEnabled = true;
      fallbackCtx.imageSmoothingQuality = 'high';
      fallbackCtx.drawImage(canvas, 0, 0, newWidth, newHeight);

      return fallbackCanvas;
    } catch (fallbackError) {
      console.error('[Resize] Native canvas resizing fallback failed. Returning original image.', fallbackError);
      return canvas;
    }
  } finally {
    // Explicit deallocation of WebAssembly objects
    if (src) src.delete();
    if (dst) dst.delete();
  }
}
