import { createWorker } from 'tesseract.js';

/**
 * Tesseract.js Worker Manager (Manifest V3 Optimized)
 * 
 * Responsibility:
 * - Creates, initializes, and terminates Tesseract OCR worker instances locally.
 * - Caches the worker instance globally to avoid thread spin-up overhead.
 * - Implements a Promise-based lock queue to serialize concurrent scan operations.
 * - Bypasses MV3 Blob CSP limits by executing directly from the extension origin.
 */

let cachedWorker = null;
let initPromise = null;

// Lock promise to queue parallel scanning threads sequentially
let workerLock = Promise.resolve();

/**
 * Initializes and retrieves the cached Tesseract.js Worker.
 * Sets local URLs for worker scripts, WebAssembly binary wrappers, and training datasets.
 * 
 * @param {string} [lang='eng'] - Language code to initialize
 * @returns {Promise<Object>} Tesseract worker instance reference
 */
export async function getOCRWorker(lang = 'eng') {
  if (cachedWorker) {
    return cachedWorker;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      console.log(`[TesseractWorker] Spawning local OCR worker for language: ${lang}...`);

      // Point Tesseract configuration to local build directory root structure
      const workerPath = chrome.runtime.getURL('tesseract/worker.min.js');
      const corePath = chrome.runtime.getURL('tesseract/tesseract-core.wasm.js');
      const langPath = chrome.runtime.getURL('tesseract/'); // Enforced trailing slash

      console.log('[TesseractWorker] Configuring local sandboxed paths:', { workerPath, corePath, langPath });

      // Create local worker instance
      const worker = await createWorker(lang, 1, {
        workerPath,
        corePath,
        langPath,
        workerBlobURL: false, // <-- CRITICAL MV3 FIX: Disables Blob workers to bypass importScripts CSP
        cacheMethod: 'none',   // Prevent trying to write to browser IndexedDB caches
        gzip: true,            // eng.traineddata.gz is compressed
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`[TesseractWorker] OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      cachedWorker = worker;
      return worker;
    } catch (error) {
      console.error('[TesseractWorker] Failed to create or load worker:', error);
      initPromise = null; // Clear so subsequent attempts can retry
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Runs OCR recognition on a canvas in a thread-safe, serialized queue.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Source image canvas
 * @returns {Promise<Object>} Raw Tesseract result
 */
export async function runOCROnWorker(canvas) {
  let release;
  
  // 1. Create a promise that resolves when the current lock chain resolves
  const nextLock = new Promise((resolve) => {
    workerLock.then(() => resolve());
  });

  // 2. Update the lock chain to block subsequent parallel callers
  workerLock = new Promise((resolve) => {
    release = resolve;
  });

  await nextLock;

  try {
    const worker = await getOCRWorker();

    console.log('[TesseractWorker] Invoking worker.recognize directly with canvas context object...');
    
    // FIX: Pass the raw canvas directly! Tesseract automatically extracts pixels 
    // seamlessly from canvas/offscreenCanvas environments without crashing Leptonica.
    const result = await worker.recognize(canvas);
    return result;

  } finally {
    // 3. Release the lock to trigger the next queued scanner
    release();
  }
}

/**
 * Cleanly terminates the cached worker thread to release browser memory.
 */
export async function terminateWorker() {
  if (cachedWorker) {
    console.log('[TesseractWorker] Terminating worker to clean resources.');
    try {
      await cachedWorker.terminate();
    } catch (e) {
      console.error('[TesseractWorker] Error during worker termination:', e);
    }
    cachedWorker = null;
    initPromise = null;
  }
}