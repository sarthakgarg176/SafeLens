import { resizeCanvas } from './resize.js';
import { toGrayscale } from './grayscale.js';
import { denoiseImage } from './denoise.js';
import { deskewCanvas } from './deskew.js';
import { applyThreshold } from './threshold.js';

/**
 * OpenCV.js Image Preprocessing Orchestrator
 * 
 * Responsibility:
 * - Coordinates the execution of OpenCV binarization, filtering, and straightening.
 * - Enforces the optimized sequence: Resize -> Grayscale -> Denoise -> Deskew -> Threshold.
 * - Wraps stages in error boundaries to implement graceful fallbacks.
 * - Returns a processed canvas optimized for downstream Tesseract character scanning.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement or OffscreenCanvas, options (Object)
 * - Output: Promise<HTMLCanvasElement|OffscreenCanvas> (Preprocessed canvas)
 * 
 * Interacts with:
 * - extension/src/services/scanService.js (Invokes this pipeline prior to OCR)
 */

import { sendToOffscreen } from '../../background/offscreenManager.js';

/**
 * Runs the complete OpenCV.js preprocessing pipeline.
 * If running in the background Service Worker, this proxies the execution to the
 * Offscreen Document to comply with Manifest V3 limitations (no eval, no importScripts).
 * If any individual filter stage fails, the pipeline logs a warning and moves to
 * the next filter step, ensuring the upload process remains active and stable.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} imageSource - The canvas containing the uploaded image
 * @param {Object} [options] - Configuration settings
 * @param {boolean} [options.enableDenoise=true] - Toggle Gaussian noise filter
 * @param {boolean} [options.enableDeskew=true] - Toggle Hough deskewing correction
 * @param {number} [options.thresholdValue=127] - Global fallback binarizer threshold
 * @param {number} [options.maxWidth=1920] - Maximum width boundary
 * @param {number} [options.maxHeight=1080] - Maximum height boundary
 * @returns {Promise<HTMLCanvasElement|OffscreenCanvas>} Preprocessed output canvas
 */
export async function preprocessImage(imageSource, options = {}) {
  // If in Service Worker, delegate to the Offscreen Document
  if (typeof document === 'undefined' && typeof chrome !== 'undefined' && chrome.offscreen) {
    console.log('[Preprocessor] Running in Service Worker. Delegating OpenCV to Offscreen Document...');
    try {
      const ctx = imageSource.getContext('2d');
      const imgData = ctx.getImageData(0, 0, imageSource.width, imageSource.height);
      
      const result = await sendToOffscreen('PREPROCESS_IMAGE', {
        width: imageSource.width,
        height: imageSource.height,
        data: imgData.data.buffer,
        options
      });

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
    // 1. Resize (Scales down early to reduce subsequent compute load)
    try {
      canvas = await resizeCanvas(canvas, maxWidth, maxHeight);
    } catch (e) {
      console.warn('[Preprocessor] Resize stage failed. Continuing...', e);
    }

    // 2. Grayscale (Discards chromatic noise)
    try {
      canvas = await toGrayscale(canvas);
    } catch (e) {
      console.warn('[Preprocessor] Grayscale stage failed. Continuing...', e);
    }

    // 3. Denoise (Gaussian Blur smoothing)
    if (enableDenoise) {
      try {
        canvas = await denoiseImage(canvas);
      } catch (e) {
        console.warn('[Preprocessor] Denoise stage failed. Continuing...', e);
      }
    }

    // 4. Deskew (Straightens line segments)
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

    // 5. Binarize (Adaptive Gaussian binarization)
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
    return imageSource; // Return input unmodified on catastrophic error to ensure the file uploads
  }
}
