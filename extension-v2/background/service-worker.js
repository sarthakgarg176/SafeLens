/**
 * service-worker.js
 * Central background orchestrator. Routes intercepted uploads either to
 * the new backend agent (Policy-RAG + Decoy Generation) or to the legacy
 * local rules engine, depending on the USE_NEW_AGENT feature flag.
 */

import { getSettings } from './feature-flags.js';
import { runLegacyRules } from './rules-engine.js';
import { sendToBackend } from './api-client.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[SafeLens] Background service worker initialized (v2 - agentic).');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action !== 'PROCESS_UPLOAD') {
    return false; // not handled here
  }

  (async () => {
    const settings = await getSettings();
    const { fileDataUrl, extractedText, targetUrl } = message.payload;

    let result;

    if (settings.USE_NEW_AGENT) {
      console.log('[ServiceWorker] Routing to new agentic backend...');
      result = await sendToBackend(
        settings.backendApiBaseUrl,
        settings.newAgentApiEndpoint,
        { image: fileDataUrl, extractedText, targetUrl }
      );
    } else {
      console.log('[ServiceWorker] USE_NEW_AGENT is false - using legacy rules engine.');
      result = runLegacyRules(extractedText || '');
    }

    sendResponse(result);
  })();

  return true; // async response
});