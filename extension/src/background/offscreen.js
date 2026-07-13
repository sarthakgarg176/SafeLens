import { recognizeImage } from '../ai/ocr/recognizeImage.js';

console.log('[Offscreen] Offscreen script loaded and initializing...');

// Hyper-Fast Stack-Safe Helpers
function arrayBufferToBase64(buffer) {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  if (!base64) return new ArrayBuffer(0);
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') {
    return false;
  }

  if (message.type === 'PING') {
    sendResponse({ success: true, from: 'offscreen' });
    return false;
  }

  if (message.type === 'PREPROCESS_IMAGE') {
    console.log('[Offscreen] PREPROCESS_IMAGE message received.');
    const { width, height, base64Data, options } = message.payload;

    (async () => {
      try {
        if (!base64Data) {
          throw new Error(`Preprocess pipeline source data missing in payload`);
        }
        
        const buffer = base64ToArrayBuffer(base64Data);
        // THE FIX: Directly pass the TypedArray! Structured cloning handles it instantly. No Array.from() bottleneck!
        const data = new Uint8ClampedArray(buffer);

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

        console.log('[Offscreen] Forwarding raw memory payload to sandbox iframe...');
        iframe.contentWindow.postMessage({
          type: 'PREPROCESS_IMAGE',
          payload: { width, height, data, options, messageId }
        }, '*');

        const processedPayload = await responsePromise;
        
        // Smartly extract buffer depending on how the sandbox returned it
        let outBuffer;
        if (processedPayload.data instanceof ArrayBuffer) {
            outBuffer = processedPayload.data;
        } else if (processedPayload.data.buffer) {
            outBuffer = processedPayload.data.buffer;
        } else {
            outBuffer = new Uint8ClampedArray(processedPayload.data).buffer;
        }
        
        const outBase64 = arrayBufferToBase64(outBuffer);

        sendResponse({
          success: true,
          payload: {
            width: processedPayload.width,
            height: processedPayload.height,
            base64Data: outBase64
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

    return true;
  }

  if (message.type === 'RECOGNIZE_IMAGE') {
    console.log('[Offscreen] RECOGNIZE_IMAGE message received.');
    const { width, height, base64Data } = message.payload;

    (async () => {
      try {
        if (!base64Data) {
          throw new Error(`OCR processing source data missing in payload`);
        }

        const buffer = base64ToArrayBuffer(base64Data);

        const canvas = typeof OffscreenCanvas !== 'undefined'
          ? new OffscreenCanvas(width, height)
          : document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imgData = new ImageData(new Uint8ClampedArray(buffer), width, height);
        ctx.putImageData(imgData, 0, 0);

        console.log('[Offscreen] Executing recognizeImage() with reconstructed canvas...');
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