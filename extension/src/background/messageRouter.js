import { preprocessImage } from '../ai/preprocessing/preprocessImage.js';
import { protectImagePipeline } from '../services/protectService.js';
import { bridgeClient } from '../communication/bridgeClient.js';

/**
 * Central Message Router for SafeLens Background Service Worker
 * 
 * Responsibility:
 * - Validates incoming chrome runtime messages.
 * - Routes validated messages to registered handlers based on message types.
 * - Formats and returns uniform, structured success/error responses.
 * - Handles unknown message types gracefully.
 * 
 * Interacts with:
 * - extension/src/background/serviceWorker.js (Invokes this router onMessage)
 */

/**
 * @typedef {Object} SafeLensMessage
 * @property {string} type - The action type of the message
 * @property {Object} [payload] - Optional parameters associated with the message
 */

/**
 * @typedef {Object} SafeLensResponse
 * @property {boolean} success - Indicates if the operation was successful
 * @property {*} [data] - The return data of the operation on success
 * @property {string} [error] - The error message on failure
 */

// Mutex lock to serialize LOG_SCAN operations and prevent storage race conditions
let logScanLock = Promise.resolve();

const handlers = {
  /**
   * PING handler to forcefully wake up the Service Worker and ensure 
   * synchronous top-level execution (like session setAccessLevel) completes.
   */
  PING: async () => {
    console.log('[MessageRouter] PING message received. Sending PING response.');
    return { ok: true };
  },
  /**
   * Preprocesses intercepted image files using local OpenCV.js (WASM) inside the Service Worker.
   * Runs OffscreenCanvas operations completely isolated from host webpage scopes.
   */
  PREPROCESS_IMAGE: async (payload) => {
    if (!payload || !payload.arrayBuffer) {
      throw new Error('Invalid payload: arrayBuffer is required');
    }

    // 1. Ensure OpenCV.js WASM compilation is ready
    await waitForOpenCV();

    const { arrayBuffer, type, settings } = payload;
    const blob = new Blob([arrayBuffer], { type: type || 'image/png' });

    // 2. Decode file buffer to ImageBitmap using background-safe global
    const imageBitmap = await createImageBitmap(blob);

    // 3. Render into an OffscreenCanvas context
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageBitmap, 0, 0);

    // 4. Execute OpenCV Preprocessing Pipeline (Resize -> Gray -> Denoise -> Deskew -> Threshold)
    const preprocessedCanvas = await preprocessImage(canvas, settings);

    // 5. Convert processed canvas back to ArrayBuffer
    const outputBlob = await preprocessedCanvas.convertToBlob({ type: type || 'image/png' });
    const outputBuffer = await outputBlob.arrayBuffer();

    return {
      arrayBuffer: outputBuffer,
      width: preprocessedCanvas.width,
      height: preprocessedCanvas.height
    };
  },

  /**
   * Runs the complete local privacy protection pipeline on the file's ArrayBuffer.
   */
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

    // Ensure OpenCV.js is fully loaded and ready
    await waitForOpenCV();

    // Build background-safe File interface mock object
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
   * Toggle or set extension settings in storage.
   */
  SET_SETTINGS: async (payload) => {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid settings payload');
    }
    await chrome.storage.local.set({ settings: payload });
    
    // Sync settings change to the backend server profile
    try {
      await bridgeClient.syncSettings(payload);
    } catch (e) {
      console.warn('[MessageRouter] Settings sync failed:', e);
    }
    
    return { success: true };
  },

  /**
   * Retrieve active extension settings from storage.
   */
  GET_SETTINGS: async () => {
    const data = await chrome.storage.local.get('settings');
    return data.settings || {};
  },

  /**
   * Log an intercepted upload scan result to session storage.
   */
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
      // 1. Fetch current scans from storage
      const { scans = [] } = await chrome.storage.local.get('scans');
      
      // 2. Add to log immediately so it's in storage early
      const updatedScans = [payload, ...scans].slice(0, 100);
      await chrome.storage.local.set({ scans: updatedScans });

      // 3. Sync metrics and dispatch alerts to bridge channels
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
            
            // Re-fetch current scans from storage to avoid overwriting changes from other serialized runs
            const { scans: currentScans = [] } = await chrome.storage.local.get('scans');
            
            // Update the specific scan element in the array
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

/**
 * Poll-awaits OpenCV WASM initialization in the background thread.
 * 
 * @returns {Promise<void>} Resolves when global cv object is loaded and parsed
 */
async function waitForOpenCV() {
  // If in Service Worker, delegation handles waiting, so bypass local check
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


/**
 * Central router dispatcher function.
 * 
 * @param {SafeLensMessage} message - The incoming message object
 * @param {chrome.runtime.MessageSender} sender - The sender metadata object
 * @returns {Promise<SafeLensResponse>} Resolved structured response
 */
export async function routeMessage(message, sender) {
  try {
    // 1. Validate basic message structure
    if (!message || typeof message !== 'object') {
      return { success: false, error: 'Malformed message: Message must be an object' };
    }

    const { type, payload } = message;
    if (!type || typeof type !== 'string') {
      return { success: false, error: 'Malformed message: Missing type property' };
    }

    console.log(`[MessageRouter] Routing message type: ${type}`, { senderId: sender.id, origin: sender.origin });

    // 2. Locate registered handler
    const handler = handlers[type];
    if (!handler) {
      console.warn(`[MessageRouter] Unknown message type: ${type}`);
      return { success: false, error: `Unknown message type: '${type}'` };
    }

    // 3. Execute and format success response
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
