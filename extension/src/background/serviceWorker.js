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

// Enable storage.session for content scripts (untrusted contexts)
if (chrome.storage.session && chrome.storage.session.setAccessLevel) {
  chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });
  console.log('[ServiceWorker] chrome.storage.session.setAccessLevel() executed');
}

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

      sendResponse(response);
    })
    .catch((err) => {
      console.error('[ServiceWorker] Message routing failure:', err);
      sendResponse({ 
        success: false, 
        error: err instanceof Error ? err.message : 'Async processing exception' 
      });
    });
    
  return true; // Keep the runtime communication channel open for asynchronous response
});