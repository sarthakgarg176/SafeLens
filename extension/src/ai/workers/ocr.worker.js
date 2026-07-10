/**
 * Background OCR Web Worker
 * 
 * Responsibility:
 * - Runs Tesseract OCR operations in a separate web worker thread.
 * - Prevents text recognition from locking the browser tab thread.
 * - Communicates with the content script via standard postMessage events.
 * 
 * Input/Output Contract (Events):
 * - Input Event (onmessage): { type: 'RECOGNIZE', imageData: ImageData }
 * - Output Event (postMessage): { type: 'OCR_RESULT', data: Object } or { type: 'OCR_ERROR', error: string }
 */

// Worker execution context
self.onmessage = async function (e) {
  const { type, payload } = e.data;

  if (type === 'RECOGNIZE') {
    try {
      console.log('[OCRWorker] Received recognition request in worker thread.');
      
      // Perform background OCR.
      // In production, we import Tesseract worker script here using importScripts()
      // importScripts('tesseract.min.js');
      
      // Mock recognition logic
      const result = {
        text: 'Background scanned document context. Phone: +1-555-0199',
        words: [
          { text: 'Background', bbox: { x0: 10, y0: 10, x1: 100, y1: 30 }, confidence: 95 },
          { text: 'Phone:', bbox: { x0: 10, y0: 50, x1: 50, y1: 70 }, confidence: 91 },
          { text: '+1-555-0199', bbox: { x0: 60, y0: 50, x1: 180, y1: 70 }, confidence: 98 }
        ]
      };

      // Simulate thread execution delay
      setTimeout(() => {
        self.postMessage({
          type: 'OCR_RESULT',
          payload: result
        });
      }, 500);

    } catch (error) {
      console.error('[OCRWorker] Background OCR execution failed:', error);
      self.postMessage({
        type: 'OCR_ERROR',
        payload: error.message || 'Worker thread execution exception'
      });
    }
  }
};
