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
import { preprocessImage } from '../ai/preprocessing/preprocessImage.js';

/**
 * Registry of message handlers
 */
const handlers = {
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
   * Toggle or set extension settings in storage.
   */
  SET_SETTINGS: async (payload) => {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid settings payload');
    }
    await chrome.storage.local.set({ settings: payload });
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
  LOG_SCAN: async (payload) => {
    if (!payload || !payload.scanId) {
      throw new Error('Invalid scan log payload');
    }
    const { scans = [] } = await chrome.storage.local.get('scans');
    const updatedScans = [payload, ...scans].slice(0, 100); // Keep last 100 scans
    await chrome.storage.local.set({ scans: updatedScans });
    return { success: true };
  }
};

/**
 * Poll-awaits OpenCV WASM initialization in the background thread.
 * Timeout triggers after 5 seconds to prevent execution hangs.
 * 
 * @returns {Promise<void>} Resolves when global cv object is loaded and parsed
 */
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
