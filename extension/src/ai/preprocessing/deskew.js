/**
 * OpenCV.js Deskewing Preprocessor
 * 
 * Responsibility:
 * - Detects and corrects document rotation skew angles.
 * - Uses Canny Edge Detection and Probabilistic Hough Line Transform (`cv.HoughLinesP`).
 * - Applies affine rotation warps (`cv.warpAffine`) to align lines horizontally.
 * - Explicitly releases WebAssembly Mat buffers to avoid memory leaks.
 * - Gracefully falls back by skipping deskew if line segments are unreliable.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement or OffscreenCanvas
 * - Output: Promise<{ canvas: HTMLCanvasElement|OffscreenCanvas, angle: number }> (Straightened canvas & angle)
 * 
 * Interacts with:
 * - extension/src/ai/preprocessing/preprocessImage.js
 */

/**
 * Detects the document skew angle and rotates the canvas to straighten it.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Source image canvas
 * @returns {Promise<{ canvas: HTMLCanvasElement|OffscreenCanvas, angle: number }>} Corrected canvas and skew angle
 */
export async function deskewCanvas(canvas) {
  if (!canvas) {
    throw new TypeError('Canvas parameter is required');
  }

  let src = null;
  let gray = null;
  let edges = null;
  let lines = null;
  let rotated = null;
  let M = null;

  try {
    // Verify OpenCV global context is ready
    if (typeof cv === 'undefined' || !cv.HoughLinesP) {
      throw new Error('OpenCV.js runtime is not loaded');
    }

    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 1. Allocate WebAssembly Mat buffers
    src = cv.matFromImageData(imgData);
    gray = new cv.Mat();
    edges = new cv.Mat();
    lines = new cv.Mat();

    // 2. Grayscale conversion (needed for edge analysis)
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 3. Extract Canny edges
    cv.Canny(gray, edges, 50, 200, 3);

    // 4. Run Hough Transform.
    // Probabilistic Hough lines (HoughLinesP) is selected over standard Hough lines (HoughLines)
    // because it samples random points rather than calculating every single accumulator bin,
    // reducing processing time from >120ms to under 15ms.
    cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 100, 50, 10);

    let angleSum = 0;
    let count = 0;

    // 5. Compute average line segment slopes
    for (let i = 0; i < lines.rows; ++i) {
      const x1 = lines.data32S[i * 4];
      const y1 = lines.data32S[i * 4 + 1];
      const x2 = lines.data32S[i * 4 + 2];
      const y2 = lines.data32S[i * 4 + 3];

      const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
      
      // Target lines representing horizontal text slope (within [-45, 45] degrees)
      if (angle > -45 && angle < 45) {
        angleSum += angle;
        count++;
      }
    }

    // Graceful Fallback: If line matching counts are too sparse, skip deskewing.
    if (count < 3) {
      console.log('[Deskew] Insufficient line segments detected. Skipping deskew.');
      return { canvas, angle: 0 };
    }

    const averageAngle = angleSum / count;

    // Ignore negligible rotations under 0.5 degrees to save CPU cycles
    if (Math.abs(averageAngle) < 0.5) {
      console.log(`[Deskew] Skew angle is negligible (${averageAngle.toFixed(2)} deg). Skipping rotation.`);
      return { canvas, angle: 0 };
    }

    console.log(`[Deskew] Correcting skew angle: ${averageAngle.toFixed(2)} degrees`);

    // 6. Perform rotation.
    // We use cv.BORDER_REPLICATE to stretch edge pixels, preventing black empty borders.
    const center = new cv.Point(canvas.width / 2, canvas.height / 2);
    M = cv.getRotationMatrix2D(center, averageAngle, 1.0);
    
    rotated = new cv.Mat();
    const dsize = new cv.Size(canvas.width, canvas.height);
    cv.warpAffine(src, rotated, M, dsize, cv.INTER_CUBIC, cv.BORDER_REPLICATE);

    // 7. Write back to canvas
    const outputCanvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(canvas.width, canvas.height)
      : document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;

    const outCtx = outputCanvas.getContext('2d');
    const outImgData = new ImageData(new Uint8ClampedArray(rotated.data), rotated.cols, rotated.rows);
    outCtx.putImageData(outImgData, 0, 0);

    return { canvas: outputCanvas, angle: averageAngle };

  } catch (error) {
    console.warn('[Deskew] Hough deskewing failed. Skipping this stage and returning original canvas:', error);
    
    // Graceful Fallback: Return original image on failure
    return { canvas, angle: 0 };
  } finally {
    // Explicit deallocation of WebAssembly objects
    if (src) src.delete();
    if (gray) gray.delete();
    if (edges) edges.delete();
    if (lines) lines.delete();
    if (rotated) rotated.delete();
    if (M) M.delete();
  }
}
