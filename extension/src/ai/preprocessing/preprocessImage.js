import { resizeCanvas } from './resize.js';
import { toGrayscale } from './grayscale.js';
import { denoiseImage } from './denoise.js';
import { deskewCanvas } from './deskew.js';
import { applyThreshold } from './threshold.js';

/**
 * OpenCV.js Image Preprocessing Orchestrator
 */
import { sendToOffscreen } from '../../background/offscreenManager.js';

export async function preprocessImage(imageSource, options = {}) {
  // If in Service Worker, delegate to the Offscreen Document
  if (typeof document === 'undefined' && typeof chrome !== 'undefined' && chrome.offscreen) {
    console.log('[Preprocessor] Running in Service Worker. Delegating OpenCV to Offscreen Document...');
    try {
      const ctx = imageSource.getContext('2d');
      const imgData = ctx.getImageData(0, 0, imageSource.width, imageSource.height);

      console.log({
        width: imageSource.width,
        height: imageSource.height,
        imageDataLength: imgData.data.length,
        byteLength: imgData.data.buffer.byteLength
      });

      // Pass regular raw base array structure safely to avoid structural IPC clone crash
      const pixelArray = Array.from(imgData.data);

      const result = await sendToOffscreen('PREPROCESS_IMAGE', {
        width: imageSource.width,
        height: imageSource.height,
        data: pixelArray,
        options
      });

      console.log("===== RESULT FROM OFFSCREEN =====");
      console.log(result);
      console.log("data =", result?.data);
      console.log("constructor =", result?.data?.constructor?.name);
      console.log("length =", result?.data?.length);

      const outputCanvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(result.width, result.height)
        : document.createElement('canvas');
      outputCanvas.width = result.width;
      outputCanvas.height = result.height;

      const outCtx = outputCanvas.getContext('2d');
      const outImgData = new ImageData(new Uint8ClampedArray(result.data), result.width, result.height);
      outCtx.putImageData(outImgData, 0, 0);

      return outputCanvas;
    } catch (error) {
      console.error('[Preprocessor] Offscreen delegation failed. Returning original imageSource.', error);
      return imageSource;
    }
  }

  const {
    enableDenoise = true,
    enableDeskew = true,
    thresholdValue = 127,
    maxWidth = 1920,
    maxHeight = 1080
  } = options;

  console.log('[Preprocessor] Beginning OpenCV.js image preprocessing pipeline...');
  const startTime = Date.now();
  let canvas = imageSource;

  try {
    // 1. Resize
    try {
      canvas = await resizeCanvas(canvas, maxWidth, maxHeight);
    } catch (e) {
      console.warn('[Preprocessor] Resize stage failed. Continuing...', e);
    }

    // 2. Grayscale
    try {
      canvas = await toGrayscale(canvas);
    } catch (e) {
      console.warn('[Preprocessor] Grayscale stage failed. Continuing...', e);
    }

    // 3. Denoise
    if (enableDenoise) {
      try {
        canvas = await denoiseImage(canvas);
      } catch (e) {
        console.warn('[Preprocessor] Denoise stage failed. Continuing...', e);
      }
    }

    // 4. Deskew (Fixed Typo)
    let deskewAngle = 0;
    if (enableDeskew) {
      try {
        const deskewResult = await deskewCanvas(canvas);
        canvas = deskewResult.canvas;
        deskewAngle = deskewResult.angle; 
      } catch (e) {
        console.warn('[Preprocessor] Deskew stage failed. Continuing...', e);
      }
    }

    // 5. Binarize
    try {
      canvas = await applyThreshold(canvas, thresholdValue);
    } catch (e) {
      console.warn('[Preprocessor] Threshold binarization stage failed. Continuing...', e);
    }

    const latency = Date.now() - startTime;
    console.log(`[Preprocessor] Pipeline resolved successfully in ${latency}ms. Skew Angle: ${deskewAngle.toFixed(2)} deg.`);
    return canvas;

  } catch (error) {
    console.error('[Preprocessor] Critical pipeline failure. Returning original image.', error);
    return imageSource;
  }
}