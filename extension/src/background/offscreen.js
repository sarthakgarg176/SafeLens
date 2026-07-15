import { preprocessImage } from '../ai/preprocessing/preprocessImage.js';

console.log('[Offscreen] Offscreen script loaded and initializing...');

// Helper to wait until OpenCV.js is fully loaded in global scope
async function waitForOpenCV() {
  if (typeof cv !== 'undefined' && cv.matFromImageData) {
    return;
  }

  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (typeof cv !== 'undefined' && cv.matFromImageData) {
        clearInterval(interval);
        resolve();
      } else if (attempts > 100) { // 10 seconds timeout
        clearInterval(interval);
        reject(new Error('OpenCV.js loading in Offscreen Document timed out (10s)'));
      }
    }, 100);
  });
}

// Ensure cv is initialized
waitForOpenCV()
  .then(() => console.log('[Offscreen] OpenCV.js is fully loaded and ready.'))
  .catch((err) => console.error('[Offscreen] OpenCV.js initialization error:', err));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') {
    return false;
  }

  if (message.type === 'PREPROCESS_IMAGE') {
    const { width, height, data, options } = message.payload;
    
    (async () => {
      try {
        await waitForOpenCV();

        // 1. Reconstruct canvas from serialized pixel buffer
        const canvas = typeof OffscreenCanvas !== 'undefined'
          ? new OffscreenCanvas(width, height)
          : document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        const imgData = new ImageData(new Uint8ClampedArray(data), width, height);
        ctx.putImageData(imgData, 0, 0);

        // 2. Execute local OpenCV.js preprocessing pipeline
        const preprocessedCanvas = await preprocessImage(canvas, options);

        // 3. Extract and serialize preprocessed pixels
        const outCtx = preprocessedCanvas.getContext('2d');
        const outImgData = outCtx.getImageData(0, 0, preprocessedCanvas.width, preprocessedCanvas.height);
        
        sendResponse({
          success: true,
          payload: {
            width: preprocessedCanvas.width,
            height: preprocessedCanvas.height,
            data: outImgData.data.buffer
          }
        });
      } catch (error) {
        console.error('[Offscreen] Preprocessing error:', error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown offscreen preprocessing failure'
        });
      }
    })();

    return true; // Keep the runtime channel open for asynchronous response
  }

  return false;
});
