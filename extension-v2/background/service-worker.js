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
        const targetDomain = targetUrl
          ? (targetUrl.startsWith('http') ? new URL(targetUrl).hostname : targetUrl)
          : (sender.tab && sender.tab.url ? new URL(sender.tab.url).hostname : 'unknown_domain');

        if (settings.USE_NEW_AGENT) {
          // 🔵 [DIAGNOSTIC] Confirm routing to correct endpoint
          console.log('[ServiceWorker] [DEBUG] PROCESS_UPLOAD received. Routing to /api/v2/process-upload...');
          console.log('[ServiceWorker] [DEBUG] targetDomain:', targetDomain);
          console.log('[ServiceWorker] [DEBUG] fileDataUrl present:', !!fileDataUrl, '| extractedText present:', !!extractedText);

          // ✅ FIX: Route to /api/v2/process-upload with the FULL image payload
          result = await sendToBackend(
            settings.backendApiBaseUrl,
            '/api/v2/process-upload',
            {
              fileDataUrl: fileDataUrl || null,
              extracted_text: extractedText || null,
              target_domain: targetDomain,
              pii_type: 'file_upload'
            }
          );

          console.log('[ServiceWorker] [DEBUG] /api/v2/process-upload response:', result);
        } else {
          console.log('[ServiceWorker] USE_NEW_AGENT is false - using legacy rules engine.');
          result = runLegacyRules(extractedText || '');
        }
      } 
      else if (message.action === 'PROCESS_TEXT_FORM') {
        const formPayload = message.payload;
        console.log('[ServiceWorker] Routing text form to backend...');
        
        const targetDomain = sender.tab && sender.tab.url ? new URL(sender.tab.url).hostname : "unknown_domain";
        const textToProtect = typeof formPayload === 'string'
          ? formPayload
          : (formPayload && typeof formPayload === 'object' && formPayload.text ? formPayload.text : JSON.stringify(formPayload));
        
        result = await sendToBackend(
          settings.backendApiBaseUrl,
          '/api/protect',
          { 
              target_domain: targetDomain,
              text: textToProtect,
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
