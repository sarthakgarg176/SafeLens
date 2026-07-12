import { recognizeImage } from '../ai/ocr/recognizeImage.js';

console.log('[Offscreen] Offscreen script loaded and initializing...');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') {
    return false;
  }

  if (message.type === 'PREPROCESS_IMAGE') {
    console.log('[Offscreen] PREPROCESS_IMAGE message received.');
    const { width, height, data, options } = message.payload;

    console.log("========== OFFSCREEN RECEIVED ==========");
    console.log("Array?", Array.isArray(data));
    console.log("length =", data?.length);

    (async () => {
      try {
        const iframe = document.getElementById('sandbox-iframe');
        if (!iframe || !iframe.contentWindow) {
          throw new Error('Sandbox iframe not found or inaccessible');
        }

        const messageId = Date.now().toString() + Math.random().toString();
        const responsePromise = new Promise((resolve, reject) => {
          const listener = (event) => {
            if (event.data && event.data.messageId === messageId && event.data.type === 'PREPROCESS_IMAGE_RESULT') {
              window.removeEventListener('message', listener);
              if (event.data.success) {
                resolve(event.data.payload);
              } else {
                reject(new Error(event.data.error || 'Sandbox returned failure'));
              }
            }
          };
          window.addEventListener('message', listener);
        });

        console.log('[Offscreen] Forwarding array payload to sandbox iframe...');
        iframe.contentWindow.postMessage({
          type: 'PREPROCESS_IMAGE',
          payload: { width, height, data, options, messageId }
        }, '*');

        const processedPayload = await responsePromise;
        console.log("===== RESULT FROM SANDBOX =====");
        console.log("Array?", Array.isArray(processedPayload.data));
        console.log("length =", processedPayload.data?.length);

        sendResponse({
          success: true,
          payload: processedPayload
        });
      } catch (error) {
        console.error('[Offscreen] Preprocessing error:', error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown offscreen preprocessing failure'
        });
      }
    })();

    return true;
  }

  if (message.type === 'RECOGNIZE_IMAGE') {
    console.log('[Offscreen] RECOGNIZE_IMAGE message received.');
    const { width, height, data } = message.payload;

    (async () => {
      try {
        // 1. Reconstruct canvas properly
        const canvas = typeof OffscreenCanvas !== 'undefined'
          ? new OffscreenCanvas(width, height)
          : document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        const imgData = new ImageData(new Uint8ClampedArray(data), width, height);
        ctx.putImageData(imgData, 0, 0);

        console.log('[Offscreen] Executing recognizeImage() with reconstructed canvas...');
        // Pass the fully loaded canvas object downstream
        const ocrResult = await recognizeImage(canvas);
        console.log('[Offscreen] recognizeImage() complete.');

        sendResponse({
          success: true,
          payload: ocrResult
        });
      } catch (error) {
        console.error('[Offscreen] OCR error:', error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown offscreen OCR failure'
        });
      }
    })();

    return true;
  }
  return false;
});