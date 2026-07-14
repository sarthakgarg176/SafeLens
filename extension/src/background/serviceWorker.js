import { DEFAULT_SETTINGS } from '../config/defaults.js';
import { routeMessage } from './messageRouter.js';

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log(`[ServiceWorker] Extension installation event: ${details.reason}`);
  if (details.reason === 'install') {
    const existing = await chrome.storage.local.get('settings');
    if (!existing.settings) {
      await chrome.storage.local.set({ settings: DEFAULT_SETTINGS, scans: [] });
    }
  }
});

// Listener updated: Removed the "poisoning" block entirely
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Broad listener allowed for general tasks, but it WON'T handle the offscreen pipe anymore.
  // The offscreen pipe will use chrome.runtime.connect.

  const safeSendResponse = (res) => {
    try { sendResponse(res); } catch (e) { console.error('Channel dead:', e); }
  };

  routeMessage(message, sender)
    .then(safeSendResponse)
    .catch((err) => {
      console.error('[ServiceWorker] Routing failure:', err);
      safeSendResponse({ success: false, error: err.message });
    });
    
  return true; 
});