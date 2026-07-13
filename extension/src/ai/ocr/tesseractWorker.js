import { createWorker } from 'tesseract.js';

let cachedWorker = null;
let initPromise = null;
let workerLock = Promise.resolve();

export async function getOCRWorker(lang = 'eng') {
  if (cachedWorker) return cachedWorker;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log(`[TesseractWorker] Spawning local OCR worker...`);
      const worker = await createWorker(lang, 1, {
        workerPath: chrome.runtime.getURL('tesseract/worker.min.js'),
        corePath: chrome.runtime.getURL('tesseract/tesseract-core.wasm.js'),
        langPath: chrome.runtime.getURL('tesseract/'),
        workerBlobURL: false,
        cacheMethod: 'none'
      });

      // ULTIMATE CONFIG: Force layout generation
      // TSV aur HOCR on karne se Tesseract.js hamesha `data.words` populate karta hai
      await worker.setParameters({
        tessedit_pageseg_mode: '3',   // Auto segmentation
        tessedit_create_hocr: '1',    // Force HTML layout metadata
        tessedit_create_tsv: '1',     // Force Tabular layout (guarantees words array)
        tessedit_ocr_engine_mode: '1' // Neural Net (best accuracy)
      });

      cachedWorker = worker;
      return worker;
    } catch (error) {
      console.error('[TesseractWorker] Failed to create worker:', error);
      initPromise = null;
      throw error;
    }
  })();
  return initPromise;
}

export async function runOCROnWorker(canvas) {
  let release;
  const nextLock = new Promise((resolve) => { workerLock.then(() => resolve()); });
  workerLock = new Promise((resolve) => { release = resolve; });
  await nextLock;

  try {
    const worker = await getOCRWorker();
    
    // Explicitly pass options during recognition as a fallback
    const result = await worker.recognize(canvas, {
       tessjs_create_hocr: '1',
       tessjs_create_tsv: '1'
    });
    return result;
  } finally {
    release();
  }
}

export async function terminateWorker() {
  if (cachedWorker) {
    await cachedWorker.terminate();
    cachedWorker = null;
    initPromise = null;
  }
}