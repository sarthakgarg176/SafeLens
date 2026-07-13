/**
 * SafeLens Background Service Worker (Manifest V3, ES Module)
 *
 * Responsibility:
 * - Coordinates background tasks and extension lifetime.
 * - Seeds default settings configuration on installation.
 * - Routes runtime messages to the messageRouter.
 *
 * OpenCV Loading & Compliance:
 * - OpenCV.js is run inside an Offscreen Document (complying with Manifest V3 security).
 * - No eval(), importScripts(), or dynamic import() is present in the Service Worker.
 */

import { DEFAULT_SETTINGS } from '../config/defaults.js';
import { routeMessage } from './messageRouter.js';


/**
 * Handle Extension installation or updates
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log(`[ServiceWorker] Extension installation event: ${details.reason}`);
  
  if (details.reason === 'install') {
    try {
      // Seed default settings configuration
      const existing = await chrome.storage.local.get('settings');
      if (!existing.settings) {
        await chrome.storage.local.set({ 
          settings: DEFAULT_SETTINGS,
          scans: [] // Initialize scan log history
        });
        console.log('[ServiceWorker] Default settings storage initialized.');
      }
    } catch (error) {
      console.error('[ServiceWorker] Error initializing storage settings:', error);
    }
  } else if (details.reason === 'update') {
    console.log('[ServiceWorker] SafeLens successfully updated to new version.');
  }
});

/**
 * Listen for runtime communications from Popup or Content script.
 * We must return `true` to signify we want to resolve the sendResponse callback asynchronously.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[ServiceWorker] Raw onMessage received:', message ? message.type : 'unknown');

  // Prevent Service Worker from hijacking the sendResponse channel for offscreen documents
  if (message && message.target === 'offscreen') {
    return false; 
  }

  let isResponseSent = false;
  const safeSendResponse = (res) => {
    if (!isResponseSent) {
      isResponseSent = true;
      if (keepWarmInterval) clearInterval(keepWarmInterval);
      if (timeoutId) clearTimeout(timeoutId);
      try {
        sendResponse(res);
      } catch (e) {
        console.error('[ServiceWorker] Failed to execute sendResponse (channel may be dead):', e);
      }
    }
  };

  // Keep the service worker channel warm to prevent 30s idle suspension during long AI canvas processing
  const keepWarmInterval = setInterval(() => {
    if (chrome.runtime && chrome.runtime.getPlatformInfo) {
      chrome.runtime.getPlatformInfo(); 
    }
  }, 20000);

  // Hard timeout guarantee to ensure sendResponse is ALWAYS invoked before Chrome's 5-minute port death
  const timeoutId = setTimeout(() => {
    console.warn('[ServiceWorker] Message routing timed out (240s). Forcefully resolving channel.');
    safeSendResponse({ success: false, error: 'Background async processing timeout (240s)' });
  }, 240000);

  try {
    routeMessage(message, sender)
      .then((response) => {
        // ==================== ADDED DEBUGGING LOGS START ====================
        // Intercepting response packet if it contains execution results from offscreen/pipeline
        if (response && response.success && response.payload) {
          const result = response.payload;
          
          console.log("===== RESULT FROM OFFSCREEN =====");
          console.log(result);
          console.log(result.data);
          console.log(result.data?.constructor?.name);
          console.log(result.data?.byteLength);
          console.log(result.data?.length);
        }
        // ==================== ADDED DEBUGGING LOGS END ======================

        safeSendResponse(response);
      })
      .catch((err) => {
        console.error('[ServiceWorker] Message routing failure:', err);
        safeSendResponse({ 
          success: false, 
          error: err instanceof Error ? err.message : 'Async processing exception' 
        });
      });
  } catch (err) {
    console.error('[ServiceWorker] Synchronous crash during routing:', err);
    safeSendResponse({ success: false, error: 'Synchronous routing crash: ' + err.message });
  }
    
  return true; // Keep the runtime communication channel open for asynchronous response
});