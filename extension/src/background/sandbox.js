import { preprocessImage } from '../ai/preprocessing/preprocessImage.js';

console.log('[Sandbox] Initialized.');

async function waitForOpenCV() {
  if (typeof cv !== 'undefined' && cv.matFromImageData) return;
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (typeof cv !== 'undefined' && cv.matFromImageData) {
        clearInterval(interval); resolve();
      }
    }, 100);
  });
}

function applySmartInvert(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  let totalBrightness = 0;

  for (let i = 0; i < data.length; i += 4) {
    const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    totalBrightness += brightness;
  }

  const avgBrightness = totalBrightness / (width * height);
  console.log(`[Sandbox] Image average brightness: ${avgBrightness.toFixed(2)}`);

  if (avgBrightness < 100) {
    console.log('[Sandbox] Dark mode detected. Inverting colors for OCR compatibility...');
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];         
      data[i + 1] = 255 - data[i + 1]; 
      data[i + 2] = 255 - data[i + 2]; 
    }
    ctx.putImageData(imgData, 0, 0);
  }
}

waitForOpenCV()
  .then(() => console.log('[Sandbox] OpenCV.js is fully loaded and ready.'))
  .catch((err) => console.error('[Sandbox] OpenCV.js initialization error:', err));

window.addEventListener('message', async (event) => {
  if (event.data?.type === 'PREPROCESS_IMAGE') {
    const { width, height, data, options, messageId } = event.data.payload;

    try {
      if (!data || data.byteLength === 0) throw new Error("Sandbox: Received empty input buffer");

      await waitForOpenCV();
      
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0);
      
      applySmartInvert(ctx, width, height);

      console.log('[Sandbox] Executing preprocessImage()...');
      const preprocessedCanvas = await preprocessImage(canvas, options || {});
      
      if (preprocessedCanvas.width === 0 || preprocessedCanvas.height === 0) {
        throw new Error("Sandbox: Preprocessing failed, returned zero-size canvas");
      }

      const outCtx = preprocessedCanvas.getContext('2d', { willReadFrequently: true });
      const outImgData = outCtx.getImageData(0, 0, preprocessedCanvas.width, preprocessedCanvas.height);
      const outputBuffer = outImgData.data.buffer.slice(0);

      event.source.postMessage({
        type: 'PREPROCESS_IMAGE_RESULT',
        messageId,
        success: true,
        payload: {
          width: preprocessedCanvas.width,
          height: preprocessedCanvas.height,
          data: outputBuffer
        }
      }, event.origin === 'null' ? '*' : event.origin, [outputBuffer]); 
      
    } catch (error) {
      console.error('[Sandbox] Preprocessing error:', error);
      event.source.postMessage({ 
        type: 'PREPROCESS_IMAGE_RESULT', 
        messageId, 
        success: false, 
        error: error.message 
      }, event.origin === 'null' ? '*' : event.origin);
    }
  }
});