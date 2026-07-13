import { preprocessImage } from '../ai/preprocessing/preprocessImage.js';

console.log('[Sandbox] Sandbox loaded and initializing...');

// Waits for the OpenCV library to initialize fully
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

// Calculates image brightness and inverts colors if dark mode is detected
function applySmartInvert(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  let totalBrightness = 0;

  // Calculate luminance for each pixel
  for (let i = 0; i < data.length; i += 4) {
    const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    totalBrightness += brightness;
  }

  const avgBrightness = totalBrightness / (width * height);
  console.log(`[Sandbox] Image average brightness: ${avgBrightness.toFixed(2)}`);

  // Threshold for dark mode (100 out of 255)
  if (avgBrightness < 100) {
    console.log('[Sandbox] Dark mode detected. Inverting colors for OCR compatibility...');
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];         // Red
      data[i + 1] = 255 - data[i + 1]; // Green
      data[i + 2] = 255 - data[i + 2]; // Blue
      // Alpha channel data[i+3] remains untouched
    }
    ctx.putImageData(imgData, 0, 0);
  }
}

waitForOpenCV()
  .then(() => console.log('[Sandbox] OpenCV.js is fully loaded and ready.'))
  .catch((err) => console.error('[Sandbox] OpenCV.js initialization error:', err));

window.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'PREPROCESS_IMAGE') {
    console.log('[Sandbox] PREPROCESS_IMAGE message received.');
    
    const { width, height, data, options, messageId } = event.data.payload;

    try {
      await waitForOpenCV();

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const imgData = new ImageData(new Uint8ClampedArray(data), width, height);
      ctx.putImageData(imgData, 0, 0);

      // 🚀 SMART INVERSION: Fixes dark mode screenshots before preprocessing
      applySmartInvert(ctx, width, height);

      console.log('[Sandbox] Executing preprocessImage()...');
      const preprocessedCanvas = await preprocessImage(canvas, options);

      const outCtx = preprocessedCanvas.getContext('2d', { willReadFrequently: true });
      const outImgData = outCtx.getImageData(0, 0, preprocessedCanvas.width, preprocessedCanvas.height);
      
      // Pass ArrayBuffer directly to avoid memory bottlenecks
      const outputArray = outImgData.data.buffer; 

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