/**
 * Tesseract.js Worker Manager
 * 
 * Responsibility:
 * - Creates, initializes, and terminates Tesseract OCR worker instances.
 * - Caches and manages worker lifecycles to avoid excessive thread spin-up overhead.
 * - Handles loading appropriate languages (e.g. 'eng').
 * 
 * Input/Output Contract:
 * - Input: None (initialization request)
 * - Output: Promise<Tesseract.Worker> (Loaded and initialized Tesseract worker)
 * 
 * Interacts with:
 * - extension/src/ai/ocr/recognizeImage.js (Requires the worker for OCR queries)
 */

let cachedWorker = null;

/**
 * Initializes and retrieves a cached Tesseract.js Worker.
 * 
 * @param {string} [lang='eng'] - Language code to initialize
 * @returns {Promise<Object>} Tesseract worker instance reference
 */
export async function getOCRWorker(lang = 'eng') {
  try {
    if (cachedWorker) {
      return cachedWorker;
    }

    console.log(`[TesseractWorker] Spawning new OCR worker for language: ${lang}...`);

    // In production, we import Tesseract programmatically or load it.
    // For scaffolding, we expose the worker creation signature.
    // const { createWorker } = window.Tesseract; 
    // const worker = await createWorker();
    // await worker.loadLanguage(lang);
    // await worker.initialize(lang);
    
    // Mock Worker definition to allow Phase 2/3 coordination without Tesseract loaded
    const mockWorker = {
      isMock: true,
      recognize: async (image) => ({
        data: {
          text: 'Mock scanned document contents. Email: test@example.com Phone: +1-555-0199 SSN: 000-12-3456.',
          words: [
            { text: 'Mock', bbox: { x0: 10, y0: 10, x1: 50, y1: 30 }, confidence: 95 },
            { text: 'scanned', bbox: { x0: 60, y0: 10, x1: 120, y1: 30 }, confidence: 95 },
            { text: 'test@example.com', bbox: { x0: 200, y0: 50, x1: 350, y1: 70 }, confidence: 98 },
            { text: 'Phone:', bbox: { x0: 10, y0: 90, x1: 50, y1: 110 }, confidence: 90 },
            { text: '+1-555-0199', bbox: { x0: 60, y0: 90, x1: 180, y1: 110 }, confidence: 97 },
            { text: 'SSN:', bbox: { x0: 10, y0: 130, x1: 50, y1: 150 }, confidence: 91 },
            { text: '000-12-3456.', bbox: { x0: 60, y0: 130, x1: 180, y1: 150 }, confidence: 99 }
          ],
          lines: [
            { text: 'Mock scanned document contents.', bbox: { x0: 10, y0: 10, x1: 150, y1: 30 } },
            { text: 'Email: test@example.com', bbox: { x0: 10, y0: 50, x1: 350, y1: 70 } },
            { text: 'Phone: +1-555-0199', bbox: { x0: 10, y0: 90, x1: 180, y1: 110 } },
            { text: 'SSN: 000-12-3456.', bbox: { x0: 10, y0: 130, x1: 180, y1: 150 } }
          ]
        }
      }),
      terminate: async () => {
        console.log('[TesseractWorker] Terminating mock worker thread.');
      }
    };

    cachedWorker = mockWorker;
    return cachedWorker;

  } catch (error) {
    console.error('[TesseractWorker] Failed to create or load worker:', error);
    throw error;
  }
}

/**
 * Cleanly terminates the cached worker thread to release browser memory.
 */
export async function terminateWorker() {
  if (cachedWorker) {
    console.log('[TesseractWorker] Terminating worker to clean resources.');
    if (typeof cachedWorker.terminate === 'function') {
      await cachedWorker.terminate();
    }
    cachedWorker = null;
  }
}
