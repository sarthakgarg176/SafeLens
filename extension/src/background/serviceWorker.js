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
  routeMessage(message, sender)
    .then((response) => {
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

