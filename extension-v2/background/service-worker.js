/**
 * service-worker.js
 * Central background orchestrator. Routes intercepted uploads and text forms either to
 * the new backend agent (Policy-RAG + Decoy Generation) or to the legacy local rules engine.
 */

import { getSettings } from './feature-flags.js';
import { runLegacyRules } from './rules-engine.js';
import { sendToBackend } from './api-client.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[SafeLens] Background service worker initialized (v2 - agentic).');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Allow BOTH Uploads and Text Forms to pass through
  if (message.action !== 'PROCESS_UPLOAD' && message.action !== 'PROCESS_TEXT_FORM') {
    return false; // not handled here
  }

  (async () => {
    try {
      const settings = await getSettings();
      let result;

      if (message.action === 'PROCESS_UPLOAD') {
        const { fileDataUrl, extractedText, targetUrl } = message.payload;
        if (settings.USE_NEW_AGENT) {
          console.log('[ServiceWorker] Routing upload to new agentic backend...');
          const targetDomain = targetUrl ? (targetUrl.startsWith('http') ? new URL(targetUrl).hostname : targetUrl) : (sender.tab && sender.tab.url ? new URL(sender.tab.url).hostname : "unknown_domain");
          result = await sendToBackend(
            settings.backendApiBaseUrl,
            '/api/protect',
            { 
              target_domain: targetDomain,
              text: extractedText || fileDataUrl || "",
              pii_type: "file_upload"
            }
          );
        } else {
          console.log('[ServiceWorker] USE_NEW_AGENT is false - using legacy rules engine.');
          result = runLegacyRules(extractedText || '');
        }
      } 
      else if (message.action === 'PROCESS_TEXT_FORM') {
        const formPayload = message.payload;
        console.log('[ServiceWorker] Routing text form to backend...');
        
        // Extract domain from the sender tab URL
        const targetDomain = sender.tab && sender.tab.url ? new URL(sender.tab.url).hostname : "unknown_domain";
        
        // Route directly to the backend's /api/protect endpoint
        // Format the payload to match FastAPI's ProtectRequest model
        result = await sendToBackend(
          settings.backendApiBaseUrl,
          '/api/protect',
          { 
              target_domain: targetDomain,
              text: JSON.stringify(formPayload),
              pii_type: "form_data"
          }
        );
      }

      sendResponse(result);
    } catch (error) {
      console.error('[ServiceWorker] Error processing message:', error);
      sendResponse({ status: 'error', message: error.toString() });
    }
  })();

  return true; // async response
});
