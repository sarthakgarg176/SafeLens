// Initialize Module settings for OpenCV WASM loading
self.Module = {
  onRuntimeInitialized: () => {
    console.log('[ServiceWorker] OpenCV.js (WASM) initialized successfully.');
  }
};

try {
  importScripts('/opencv.js');
} catch (err) {
  console.error('[ServiceWorker] Failed to load OpenCV.js:', err);
}

import { routeMessage } from './messageRouter.js';

/**
 * SafeLens Background Service Worker
 * 
 * Responsibility:
 * - Coordinates the lifecycle events (installation, updates) of the extension.
 * - Seeds default configuration settings in chrome storage on install.
 * - Handles runtime extension messaging, delegating to the central MessageRouter.
 * 
 * Interacts with:
 * - extension/src/background/messageRouter.js (Delegates message resolution)
 * - chrome.storage (Initializes settings configuration)
 */

// Default settings applied on extension initialization
const DEFAULT_SETTINGS = {
  protectionEnabled: true,
  riskLevelThreshold: 'medium', // low, medium, high
  autoRedact: false,
  watermarkEnabled: false,
  aiCloakEnabled: false,
  allowedDomains: []
};

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
