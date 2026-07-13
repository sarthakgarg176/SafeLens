import { preprocessImage } from '../ai/preprocessing/preprocessImage.js';

console.log('[Sandbox] Sandbox loaded and initializing...');

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
      } else if (attempts > 100) {
        clearInterval(interval);
        reject(new Error('OpenCV.js loading in Sandbox Document timed out (10s)'));
      }
    }, 100);
  });
}

waitForOpenCV()
  .then(() => console.log('[Sandbox] OpenCV.js is fully loaded and ready.'))
  .catch((err) => console.error('[Sandbox] OpenCV.js initialization error:', err));

window.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'PREPROCESS_IMAGE') {
    console.log('[Sandbox] PREPROCESS_IMAGE message received.');
    
    console.log("IsArray?", Array.isArray(event.data.payload.data));
    console.log("Length =", event.data.payload.data?.length);

    const { width, height, data, options, messageId } = event.data.payload;

    try {
      await waitForOpenCV();

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const imgData = new ImageData(new Uint8ClampedArray(data), width, height);
      ctx.putImageData(imgData, 0, 0);

      console.log('[Sandbox] Executing preprocessImage()...');
      const preprocessedCanvas = await preprocessImage(canvas, options);

      const outCtx = preprocessedCanvas.getContext('2d', { willReadFrequently: true });
      const outImgData = outCtx.getImageData(0, 0, preprocessedCanvas.width, preprocessedCanvas.height);
      
      const outputArray = Array.from(outImgData.data);

      event.source.postMessage({
        type: 'PREPROCESS_IMAGE_RESULT',
        messageId,
        success: true,
        payload: {
          width: preprocessedCanvas.width,
          height: preprocessedCanvas.height,
          data: outputArray
        }
      }, event.origin === 'null' ? '*' : event.origin);
      
    } catch (error) {
      console.error('[Sandbox] Preprocessing error:', error);
      event.source.postMessage({
        type: 'PREPROCESS_IMAGE_RESULT',
        messageId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sandbox preprocessing failure'
      }, event.origin === 'null' ? '*' : event.origin);
    }
  }
});