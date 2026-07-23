import { resizeCanvas } from './resize.js';
import { toGrayscale } from './grayscale.js';
import { denoiseImage } from './denoise.js';
import { deskewCanvas } from './deskew.js';
import { applyThreshold } from './threshold.js';
import { executeOffscreenTask } from '../../background/offscreenManager.js';

export async function preprocessImage(imageSource, options = {}) {
  // Offscreen handling (Service Worker)
  if (typeof document === 'undefined' && typeof chrome !== 'undefined' && chrome.offscreen) {
    return imageSource;
  }

  const {
    enableDenoise = false,
    enableDeskew = true,
    thresholdValue = 0,
    maxWidth = 1920,
    maxHeight = 1080,
    bypass = false
  } = options;

  console.log('[Preprocessor] Beginning Safe-Mode pipeline...');

  if (bypass) {
    console.log('[Preprocessor] Bypass mode - returning raw canvas');
    return imageSource;
  }

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