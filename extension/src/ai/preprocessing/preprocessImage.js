import { resizeCanvas } from './resize.js';
import { toGrayscale } from './grayscale.js';
import { denoiseImage } from './denoise.js';
import { deskewCanvas } from './deskew.js';
import { applyThreshold } from './threshold.js';
import { executeOffscreenTask } from '../../background/offscreenManager.js';

export async function preprocessImage(imageSource, options = {}) {
  // Offscreen handling (Service Worker)
  if (typeof document === 'undefined' && typeof chrome !== 'undefined' && chrome.offscreen) {
    // ... (Keep existing offscreen delegation logic here)
    return imageSource; // Placeholder for logic
  }

  const {
    enableDenoise = false, // ID cards ke liye false rakha hai
    enableDeskew = true,
    thresholdValue = 0,    // 0 = Skip thresholding to preserve edges
    maxWidth = 1920,
    maxHeight = 1080
  } = options;

  console.log('[Preprocessor] Beginning Safe-Mode pipeline...');
  let canvas = imageSource;

  try {
    canvas = await resizeCanvas(canvas, maxWidth, maxHeight);
    canvas = await toGrayscale(canvas);

    if (enableDenoise) canvas = await denoiseImage(canvas);
    if (enableDeskew) canvas = (await deskewCanvas(canvas)).canvas;

    if (thresholdValue > 0) {
       canvas = await applyThreshold(canvas, thresholdValue);
    }

    return canvas;
  } catch (error) {
    console.error('[Preprocessor] Pipeline failure, returning raw.', error);
    return imageSource;
  }
}