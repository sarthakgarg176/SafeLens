import { preprocessImage } from '../ai/preprocessing/preprocessImage.js';
import { protectImagePipeline } from '../services/protectService.js';
import { bridgeClient } from '../communication/bridgeClient.js';

/**
 * Central Message Router for SafeLens Background Service Worker (Isolated Core Network Gateway)
 */

let logScanLock = Promise.resolve();

// Helper to convert ArrayBuffer to Base64 (Iterative to strictly prevent call stack size overflow)
function arrayBufferToBase64(buffer) {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 back to ArrayBuffer safely
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

const handlers = {
  PING: async () => {
    console.log('[MessageRouter] PING message received. Sending PING response.');
    return { ok: true };
  },

  PREPROCESS_IMAGE: async (payload) => {
    if (!payload || !payload.arrayBuffer) {
      throw new Error('Invalid payload: arrayBuffer is required');
    }
    await waitForOpenCV();
    const { arrayBuffer, type, settings } = payload;
    const blob = new Blob([arrayBuffer], { type: type || 'image/png' });
    const imageBitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(imageBitmap, 0, 0);

    const preprocessedCanvas = await preprocessImage(canvas, settings);
    const outputBlob = await preprocessedCanvas.convertToBlob({ type: type || 'image/png' });
    const outputBuffer = await outputBlob.arrayBuffer();

    return {
      arrayBuffer: outputBuffer,
      width: preprocessedCanvas.width,
      height: preprocessedCanvas.height
    };
  },

  RUN_PROTECT_PIPELINE: async (payload) => {
    if (!payload || (!payload.arrayBuffer && !payload.base64Data && !payload.storageKey)) {
      throw new Error('Invalid payload: base64Data or arrayBuffer is required');
    }

    let arrayBuffer = payload.arrayBuffer;
    if (payload.base64Data) {
      arrayBuffer = base64ToArrayBuffer(payload.base64Data);
    } else if (payload.storageKey) {
      const storageData = await chrome.storage.local.get(payload.storageKey);
      const storedValue = storageData ? storageData[payload.storageKey] : null;
      
      if (typeof storedValue === 'string') {
        arrayBuffer = base64ToArrayBuffer(storedValue);
      } else if (storedValue && storedValue.byteLength) {
        arrayBuffer = storedValue;
      } else if (storedValue && typeof storedValue === 'object') {
        arrayBuffer = storedValue;
      }
      
      if (arrayBuffer && arrayBuffer.byteLength > 0) {
        await chrome.storage.local.remove(payload.storageKey);
      }
    }

    if (!arrayBuffer || !arrayBuffer.byteLength) {
      throw new Error('Invalid or corrupted image arrayBuffer received in pipeline gateway');
    }

    const incomingStorageKey = 'pending_image_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await chrome.storage.local.set({ [incomingStorageKey]: arrayBufferToBase64(arrayBuffer) });

    const { name, type, settings } = payload;
    await waitForOpenCV();

    const mockFile = {
      name: name || 'upload.png',
      size: arrayBuffer.byteLength,
      type: type || 'image/png',
      arrayBuffer: () => Promise.resolve(arrayBuffer)
    };

    const result = await protectImagePipeline(mockFile, settings);
    
    await chrome.storage.local.remove(incomingStorageKey);

    let outBuffer;
    if (result.protectedFile && typeof result.protectedFile.arrayBuffer === 'function') {
      outBuffer = await result.protectedFile.arrayBuffer();
    } else {
      outBuffer = arrayBuffer;
    }

    return {
      success: result.success !== false,
      base64Data: arrayBufferToBase64(outBuffer),
      name: (result.protectedFile && result.protectedFile.name) || name,
      type: (result.protectedFile && result.protectedFile.type) || type,
      phash: result.phash || '',
      whash: result.whash || '',
      detections: result.detections || [],
      risk: result.risk || 'low',
      protectionSummary: result.protectionSummary || { processingTime: 0, redacted: false },
      error: result.error
    };
  },

  REGISTER_BACKEND_ASSET: async (payload) => {
    if (!payload || (!payload.storageKey && !payload.base64Data)) {
      throw new Error('Invalid payload: storageKey or base64Data containing image buffer is mandatory');
    }

    let arrayBuffer = null;
    if (payload.base64Data) {
      arrayBuffer = base64ToArrayBuffer(payload.base64Data);
    } else if (payload.storageKey) {
      const storageData = await chrome.storage.local.get(payload.storageKey);
      const storedValue = storageData ? storageData[payload.storageKey] : null;
      
      if (typeof storedValue === 'string') {
        arrayBuffer = base64ToArrayBuffer(storedValue);
      } else if (storedValue && storedValue.byteLength) {
        arrayBuffer = storedValue;
      }

      if (arrayBuffer) {
        await chrome.storage.local.remove(payload.storageKey);
      }
    }

    if (!arrayBuffer || !arrayBuffer.byteLength) {
      throw new Error('Image data not found or corrupted in background session allocation room');
    }

    const blob = new Blob([arrayBuffer], { type: payload.type || 'image/png' });
    const file = new File([blob], payload.name || 'upload.png', { type: payload.type || 'image/png' });

    console.log('[MessageRouter] Dispatching isolated proxy upload process via BridgeClient framework...');
    
    const result = await bridgeClient.uploadProtectedAsset(file, {
      blur_enabled: payload.blur_enabled,
      ai_cloak: payload.ai_cloak,
      watermark: payload.watermark
    });

    return result;
  },

  SET_SETTINGS: async (payload) => {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid settings payload');
    }
    await chrome.storage.local.set({ settings: payload });
    try {
      await bridgeClient.syncSettings(payload);
    } catch (e) {
      console.warn('[MessageRouter] Settings sync failed:', e);
    }
    return { success: true };
  },

  GET_SETTINGS: async () => {
    const data = await chrome.storage.local.get('settings');
    return data ? (data.settings || {}) : {};
  },

  LOG_SCAN: async (payload, sender) => {
    if (!payload || !payload.scanId) {
      throw new Error('Invalid scan log payload');
    }

    let release;
    const nextLock = new Promise((resolve) => {
      logScanLock.then(() => resolve());
    });
    logScanLock = new Promise((resolve) => {
      release = resolve;
    });

    await nextLock;

    try {
      const storageData = await chrome.storage.local.get('scans');
      const scans = storageData && storageData.scans ? storageData.scans : [];
      const updatedScans = [payload, ...scans].slice(0, 100);
      await chrome.storage.local.set({ scans: updatedScans });

      try {
        await bridgeClient.syncScanResult({
          metadata: { name: payload.fileName, size: payload.size, type: 'image/png' },
          ...payload
        });

        if (payload.riskLevel !== 'low' && payload.assetId) {
          const matchedUrl = sender ? (sender.url || sender.origin || 'unknown') : 'unknown';
          const incidentResponse = await bridgeClient.sendIncidentNotification({
            assetId: payload.assetId,
            matchedUrl: matchedUrl,
            matchConfidence: payload.confidence,
            severity: payload.riskLevel === 'critical' ? 'Serious' : 'Normal',
            status: 'Open'
          });

          if (incidentResponse && incidentResponse.success && incidentResponse.incidentId) {
            payload.incidentId = incidentResponse.incidentId;
            const currentStorage = await chrome.storage.local.get('scans');
            const currentScans = currentStorage && currentStorage.scans ? currentStorage.scans : [];
            const finalScans = currentScans.map(s => {
              if (s.scanId === payload.scanId) {
                return { ...s, incidentId: incidentResponse.incidentId };
              }
              return s;
            });
            await chrome.storage.local.set({ scans: finalScans });
            console.log('[MessageRouter] Linked local scan record with backend incident ID:', incidentResponse.incidentId);
          }
        }
      } catch (e) {
        console.warn('[MessageRouter] Failed to sync scan metadata with BridgeClient:', e);
      }
    } finally {
      release();
    }

    return { success: true };
  }
};

async function waitForOpenCV() {
  if (typeof document === 'undefined' && typeof chrome !== 'undefined' && chrome.offscreen) {
    return;
  }
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
      } else if (attempts > 50) {
        clearInterval(interval);
        reject(new Error('OpenCV.js WASM compilation timed out (5s)'));
      }
    }, 100);
  });
}

export async function routeMessage(message, sender) {
  try {
    if (!message || typeof message !== 'object') {
      return { success: false, error: 'Malformed message: Message must be an object' };
    }
    const { type, payload } = message;
    if (!type || typeof type !== 'string') {
      return { success: false, error: 'Malformed message: Missing type property' };
    }

    console.log(`[MessageRouter] Routing message type: ${type}`, { senderId: sender.id, origin: sender.origin });

    const handler = handlers[type];
    if (!handler) {
      console.warn(`[MessageRouter] Unknown message type: ${type}`);
      return { success: false, error: `Unknown message type: '${type}'` };
    }

    const result = await handler(payload, sender);
    return { success: true, data: result };

  } catch (error) {
    console.error(`[MessageRouter] Error routing message:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal background processing error' 
    };
  }
}