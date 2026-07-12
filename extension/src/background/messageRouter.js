import { preprocessImage } from '../ai/preprocessing/preprocessImage.js';
import { protectImagePipeline } from '../services/protectService.js';
import { bridgeClient } from '../communication/bridgeClient.js';

/**
 * Central Message Router for SafeLens Background Service Worker (Isolated Core Network Gateway)
 */

let logScanLock = Promise.resolve();

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
    const ctx = canvas.getContext('2d');
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
    if (!payload || (!payload.arrayBuffer && !payload.storageKey)) {
      throw new Error('Invalid payload: arrayBuffer or storageKey is required');
    }

    let arrayBuffer = payload.arrayBuffer;
    if (payload.storageKey) {
      const storageData = await chrome.storage.session.get(payload.storageKey);
      arrayBuffer = storageData[payload.storageKey];
      await chrome.storage.session.remove(payload.storageKey);
      console.log('[MessageRouter] image transferred via storage.session successfully');
    }

    const { name, type, settings } = payload;
    await waitForOpenCV();

    const mockFile = {
      name: name || 'upload.png',
      size: arrayBuffer.byteLength,
      type: type || 'image/png',
      arrayBuffer: () => Promise.resolve(arrayBuffer)
    };

    const result = await protectImagePipeline(mockFile, settings);
    
    let outBuffer;
    if (result.protectedFile && typeof result.protectedFile.arrayBuffer === 'function') {
      outBuffer = await result.protectedFile.arrayBuffer();
    } else {
      outBuffer = arrayBuffer;
    }

    const outKey = 'protected_image_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await chrome.storage.session.set({ [outKey]: outBuffer });

    return {
      success: result.success !== false,
      storageKey: outKey,
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

  /**
   * New Handler: Securely executes binary uploads to deployed Render production API from SW context
   */
  REGISTER_BACKEND_ASSET: async (payload) => {
    if (!payload || !payload.storageKey) {
      throw new Error('Invalid payload: storageKey containing image buffer is mandatory');
    }

    // 1. Recover arrayBuffer from session space safely
    const storageData = await chrome.storage.session.get(payload.storageKey);
    const arrayBuffer = storageData[payload.storageKey];
    await chrome.storage.session.remove(payload.storageKey);

    if (!arrayBuffer) {
      throw new Error('Image data not found in background session allocation room');
    }

    const blob = new Blob([arrayBuffer], { type: payload.type || 'image/png' });
    const file = new File([blob], payload.name || 'upload.png', { type: payload.type || 'image/png' });

    console.log('[MessageRouter] Dispatching isolated proxy upload process via BridgeClient framework...');
    
    // 2. Delegate execution logic to centralized bridge network pipeline
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
    return data.settings || {};
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
      const { scans = [] } = await chrome.storage.local.get('scans');
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
            const { scans: currentScans = [] } = await chrome.storage.local.get('scans');
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