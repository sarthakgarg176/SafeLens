import { pipeline, env } from '@xenova/transformers';
import { createWorker } from 'tesseract.js';

// 🚀 ENV Config
env.allowLocalModels = false;
env.backends.onnx.wasm.proxy = false;
env.backends.onnx.wasm.numThreads = 1;

console.log('[Offscreen] Ready to accept dedicated connections.');

// --- Helper Functions ---
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function prepareImageForTesseract(payload) {
  return new Promise((resolve, reject) => {
    try {
      let base64Str = typeof payload === 'string' ? payload : (payload.base64Data || payload.data || payload.canvasData);
      if (!base64Str) return reject(new Error("No valid image data provided for OCR."));
      const prefix = 'data:image/png;base64,';
      let cleanBase64 = base64Str.includes('base64,') ? base64Str.split('base64,')[1] : base64Str;
      cleanBase64 = cleanBase64.replace(/\s+/g, '');
      while (cleanBase64.length % 4 !== 0) cleanBase64 += '=';
      if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleanBase64)) return reject(new Error("Base64 string contains invalid characters."));
      let src = prefix + cleanBase64;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || payload.width || 100;
        canvas.height = img.height || payload.height || 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error(`Image decoding failed.`));
      img.src = src;
    } catch (err) { reject(err); }
  });
}

const pendingRequests = new Map();
let messageIdCounter = 0;

window.addEventListener('message', (event) => {
  if (event.data?.type === 'PREPROCESS_IMAGE_RESULT') {
    const { messageId, success, payload, error } = event.data;
    const request = pendingRequests.get(messageId);
    if (request) {
      pendingRequests.delete(messageId);
      if (success) request.resolve({ success: true, payload });
      else request.reject(new Error(error || 'Sandbox error'));
    }
  }
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'offscreen-channel') return;
  port.onMessage.addListener(async (msg) => {
    if (msg.type === 'PREPROCESS_IMAGE') {
      try {
        const sandboxIframe = document.getElementById('sandboxFrame');
        if (!sandboxIframe) throw new Error('Sandbox not found.');
        const messageId = `msg_${++messageIdCounter}`;
        const responsePromise = new Promise((resolve, reject) => { pendingRequests.set(messageId, { resolve, reject }); });
        const transferBuffer = msg.payload.base64Data ? base64ToArrayBuffer(msg.payload.base64Data) : msg.payload.data;
        sandboxIframe.contentWindow.postMessage({ type: 'PREPROCESS_IMAGE', payload: { messageId, ...msg.payload, data: transferBuffer } }, '*', [transferBuffer]);
        const result = await responsePromise;
        const outBase64 = arrayBufferToBase64(result.payload.data);
        port.postMessage({ success: true, data: { width: result.payload.width, height: result.payload.height, base64Data: outBase64 } });
      } catch (err) { port.postMessage({ success: false, error: err.message }); }
    }

    if (msg.type === 'RECOGNIZE_IMAGE') {
      try {
        const pngDataUrl = await prepareImageForTesseract(msg.payload);
        const worker = await createWorker('eng', 1, {
           workerPath: chrome.runtime.getURL('tesseract/worker.min.js'),
           corePath: chrome.runtime.getURL('tesseract/tesseract-core.wasm.js'),
           workerBlobURL: false 
        });
        // 🚀 Improved OCR call with PSM 6 for better accuracy on blocks of text
        const ocr = await worker.recognize(pngDataUrl, { psm: '6' });
        await worker.terminate();
        const formattedWords = (ocr?.data?.words || []).map(w => ({
          text: w.text || "",
          x: w.bbox?.x0 || 0, y: w.bbox?.y0 || 0,
          width: (w.bbox?.x1 || 0) - (w.bbox?.x0 || 0),
          height: (w.bbox?.y1 || 0) - (w.bbox?.y0 || 0)
        }));
        port.postMessage({ success: true, data: { words: formattedWords, text: ocr?.data?.text || "" } });
      } catch (e) {
        port.postMessage({ success: false, error: e.message });
      }
    }
  });
});