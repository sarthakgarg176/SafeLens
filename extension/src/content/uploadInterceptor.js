import { showDecisionPopup } from './decisionPopup.js';

/**
 * Upload Interceptor for SafeLens Content Script (Fixed Context Isolation Version)
 */

export async function interceptUpload(files, metadata, targetElement, onApprovalCallback) {
  console.log('[UploadInterceptor] Intercepting upload event for files:', metadata.map(m => m.name));

  try {
    let settings = { protectionEnabled: true, autoProtect: false };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get('settings');
      if (data.settings) {
        settings = data.settings;
      }
    }

    if (settings.protectionEnabled === false) {
      console.log('[UploadInterceptor] Shield is suspended. Resuming original upload.');
      return onApprovalCallback(files);
    }

    const autoProtect = settings.autoProtect === true || settings.autoRedact === true;

    if (autoProtect) {
      console.log('[UploadInterceptor] Auto Protect is ON. Running protection pipeline immediately...');
      const results = await runPipeline(files, settings);
      const protectedFiles = results.map(r => r.protectedFile);
      onApprovalCallback(protectedFiles);
    } else {
      const choice = await showDecisionPopup(files, metadata);
      
      if (choice === 'protect') {
        console.log('[UploadInterceptor] User selected: PROTECT. Executing pipeline...');
        const results = await runPipeline(files, settings);
        const protectedFiles = results.map(r => r.protectedFile);
        onApprovalCallback(protectedFiles);
      } else if (choice === 'anyway') {
        console.log('[UploadInterceptor] User selected: UPLOAD ANYWAY. Re-triggering original files.');
        onApprovalCallback(files);
      } else {
        console.log('[UploadInterceptor] User selected: CANCEL. Upload aborted.');
      }
    }

  } catch (error) {
    console.error('[UploadInterceptor] Interception pipeline failure:', error);
    onApprovalCallback(files);
  }
}

async function runPipeline(files, settings) {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        console.log('[UploadInterceptor] Serializing and delegating file to SW:', file.name);
        const arrayBuffer = await file.arrayBuffer();

        console.log('[UploadInterceptor] Sending PING to wake Service Worker...');
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: 'PING' }, (res) => {
            if (chrome.runtime.lastError) {
              console.warn('[UploadInterceptor] PING failed or no response:', chrome.runtime.lastError.message);
            } else {
              console.log('[UploadInterceptor] PING response received. SW is awake.');
            }
            resolve(res);
          });
        });

        const storageKey = 'pending_image_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await chrome.storage.session.set({ [storageKey]: arrayBuffer });

        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            type: 'RUN_PROTECT_PIPELINE',
            payload: {
              storageKey: storageKey,
              name: file.name,
              type: file.type,
              settings: settings
            }
          }, (res) => {
            if (chrome.runtime.lastError) {
              console.error('[UploadInterceptor] SW message error:', chrome.runtime.lastError.message);
              resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
              resolve(res || { success: false, error: 'No response from Service Worker' });
            }
          });
        });

        if (response && response.success && response.data) {
          const resData = response.data;
          let outBuffer;
          if (resData.storageKey) {
            const storageData = await chrome.storage.session.get(resData.storageKey);
            outBuffer = storageData[resData.storageKey];
            await chrome.storage.session.remove(resData.storageKey);
          } else {
            outBuffer = resData.arrayBuffer || arrayBuffer;
          }

          const blob = new Blob([outBuffer], { type: resData.type });
          const protectedFile = new File([blob], resData.name, {
            type: resData.type,
            lastModified: Date.now()
          });

          return {
            success: true,
            originalFile: file,
            protectedFile: protectedFile,
            phash: resData.phash,
            whash: resData.whash,
            metadata: {
              name: file.name,
              size: file.size,
              type: file.type
            },
            detections: resData.detections,
            risk: resData.risk,
            protectionSummary: resData.protectionSummary
          };
        } else {
          throw new Error((response && response.error) || 'Failed protection pipeline execution');
        }
      } catch (err) {
        console.error('[UploadInterceptor] Pipeline delegation failed. Falling back to original:', file.name, err);
        return {
          success: false,
          originalFile: file,
          protectedFile: file,
          phash: '',
          whash: '',
          metadata: { name: file.name, size: file.size, type: file.type },
          detections: [],
          risk: 'low',
          protectionSummary: { processingTime: 0, redacted: false },
          error: err.message
        };
      }
    })
  );

  // Defer network operations entirely to the Background Service Worker context
  await Promise.all(
    results.map(async (res) => {
      if (!res.success) return;

      let assetId = null;
      try {
        console.log('[UploadInterceptor] Delegating asset registration to SW to bypass host CSP restrictions...');
        
        // Render target setup requires transfer via session storage or short array conversion
        const protectedBuffer = await res.protectedFile.arrayBuffer();
        const uploadStorageKey = 'upload_image_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await chrome.storage.session.set({ [uploadStorageKey]: protectedBuffer });

        // Request background routing channel to safely push to production Render endpoint
        const uploadResponse = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            type: 'REGISTER_BACKEND_ASSET',
            payload: {
              storageKey: uploadStorageKey,
              name: res.protectedFile.name,
              type: res.protectedFile.type,
              blur_enabled: (settings.blurMode === 'blur' && res.protectionSummary.redacted) ? 'true' : 'false',
              ai_cloak: (settings.aiCloakEnabled && res.protectionSummary.redacted) ? 'true' : 'false',
              watermark: (settings.watermarkEnabled && res.protectionSummary.redacted) ? 'true' : 'false'
            }
          }, (resObj) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
              resolve(resObj || { success: false });
            }
          });
        });

        if (uploadResponse && uploadResponse.success && uploadResponse.data) {
          assetId = uploadResponse.data.assetId;
          console.log('[UploadInterceptor] Safely registered asset via Background Worker. ID:', assetId);
        }
      } catch (err) {
        console.warn('[UploadInterceptor] Background asset registration messaging failed:', err.message);
      }

      // Dispatch scan logs metrics safely to local storage
      try {
        const maxConfidence = res.detections.reduce((max, d) => Math.max(max, d.fusedConfidence || 0), 0) || 0.8;
        
        await chrome.runtime.sendMessage({
          type: 'LOG_SCAN',
          payload: {
            scanId: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fileName: res.originalFile.name,
            size: res.originalFile.size,
            riskLevel: res.risk,
            confidence: parseFloat(maxConfidence.toFixed(2)),
            piiCount: res.detections.length,
            processingTime: res.protectionSummary.processingTime,
            status: res.protectionSummary.redacted ? 'protected' : 'passed',
            detections: res.detections,
            assetId: assetId
          }
        });
      } catch (e) {
        console.warn('[UploadInterceptor] Failed to dispatch scan log metrics:', e);
      }
    })
  );

  return results;
}