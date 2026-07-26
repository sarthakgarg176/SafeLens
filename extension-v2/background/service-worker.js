/**
 * service-worker.js
 * Central background orchestrator (V2 - Hybrid Engine).
 * 
 * NOTE: Image uploads are now handled directly via fetch() in interceptor.js. 
 * This service worker exclusively routes Contextual Text (GLiNER/NLP) & Form Data 
 * to the FastAPI backend for RAG Policy Evaluation.
 */

import { getSettings } from './feature-flags.js';
import { runLegacyRules } from './rules-engine.js';
import { sendToBackend } from './api-client.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[SafeLens] Background service worker initialized (v2 - Hybrid AI Engine).');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'PROCESS_IMAGE') {
    (async () => {
      try {
        const { base64Data, filename, type } = message.payload;
        console.log(`[ServiceWorker] Processing image via background fetch: ${filename}`);

        // Helper to convert base64 to Blob natively (Much faster and memory efficient)
        const res = await fetch(base64Data);
        const imageBlob = await res.blob();

        // Helper to convert Blob to base64 without FileReader (which is unavailable in MV3 Service Workers)
        const blobToBase64 = async (blobObj) => {
          const buffer = await blobObj.arrayBuffer();
          let binary = '';
          const bytes = new Uint8Array(buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          return `data:${blobObj.type};base64,${base64}`;
        };

        const formData = new FormData();
        formData.append('file', imageBlob, filename || 'image.png');

        // 🚀 FIX: Used 'localhost' instead of '127.0.0.1' to match manifest.json host_permissions
        const backendUrl = 'http://localhost:8000/api/process-image';
        
        const apiResponse = await fetch(backendUrl, {
          method: 'POST',
          body: formData
        });

        if (!apiResponse.ok) {
          throw new Error(`FastAPI Image Redaction endpoint returned status ${apiResponse.status}`);
        }

        const contentDisposition = apiResponse.headers.get('Content-Disposition');
        let outFilename = filename || 'image.png';
        let isRedacted = false;

        if (contentDisposition && contentDisposition.includes('filename=')) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match) {
            outFilename = match[1];
            if (outFilename.startsWith('redacted_')) isRedacted = true;
          }
        } else {
          outFilename = `redacted_${filename || 'image.png'}`;
          isRedacted = true;
        }

        const redactedBlob = await apiResponse.blob();
        const base64Redacted = await blobToBase64(redactedBlob);

        sendResponse({
          success: true,
          base64Data: base64Redacted,
          filename: outFilename,
          isRedacted: isRedacted,
          mimeType: redactedBlob.type || type || 'image/png'
        });

      } catch (err) {
        console.error('[ServiceWorker] Background image processing failed:', err);
        sendResponse({ success: false, error: err.toString() });
      }
    })();
    return true; // Keep the message channel open for the async response
  }

  if (message.action === 'PROCESS_TEXT_FORM') {
    (async () => {
      try {
        const settings = await getSettings();
        let result;

        const formPayload = message.payload;
        const targetDomain = sender.tab && sender.tab.url ? new URL(sender.tab.url).hostname : "unknown_domain";
        
        const textToProtect = typeof formPayload === 'string'
          ? formPayload
          : (formPayload && typeof formPayload === 'object' && formPayload.text ? formPayload.text : JSON.stringify(formPayload));
        
        console.log(`[ServiceWorker] Routing NLP payload to backend for domain: ${targetDomain}`);

        if (settings.USE_NEW_AGENT) {
          result = await sendToBackend(
            settings.backendApiBaseUrl || 'http://localhost:8000', // 🚀 FIX: Also updated this to localhost
            '/api/protect', 
            { 
                target_domain: targetDomain,
                text: textToProtect,
                pii_type: "form_data"
            }
          );
        } else {
          console.log('[ServiceWorker] USE_NEW_AGENT is false - falling back to legacy regex rules.');
          result = runLegacyRules(textToProtect || '');
        }

        sendResponse(result);
      } catch (error) {
        console.error('[ServiceWorker] Error processing text payload:', error);
        sendResponse({ status: 'error', message: error.toString() });
      }
    })();
    return true; // Keep the message channel open for the async response
  }
  
  return false;
});