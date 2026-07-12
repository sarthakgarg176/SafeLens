import { showDecisionPopup } from './decisionPopup.js';

/**
 * Upload Interceptor for SafeLens Content Script
 * 
 * Responsibility:
 * - Intercepts file uploads on target web pages.
 * - Inspects active settings status to check if protection is enabled and if Auto Protect is ON/OFF.
 * - Displays decisionPopup UI dialog if Auto Protect is OFF.
 * - Executes the local protection pipeline (OpenCV preprocessing, Tesseract OCR, Rules, redacting/masking, hashes, cloaking, watermarking).
 * - Logs scan results to storage via messaging to sync stats.
 * - Resumes the browser upload event with approved or secured File objects.
 * 
 * Interacts with:
 * - extension/src/content/uploadDetector.js (Receives intercepted files)
 * - extension/src/content/decisionPopup.js (Prompts user actions)
 * - extension/src/services/protectService.js (Runs the protection pipeline)
 */

/**
 * Intercepts the upload list, checks settings, and coordinates the protection pipeline.
 * 
 * @param {File[]} files - Selected image files
 * @param {Object[]} metadata - Metadata extracted by the detector
 * @param {HTMLElement} targetElement - Original DOM target element of the upload
 * @param {Function} onApprovalCallback - Callback to resume upload with approved file list
 */
export async function interceptUpload(files, metadata, targetElement, onApprovalCallback) {
  console.log('[UploadInterceptor] Intercepting upload event for files:', metadata.map(m => m.name));

  try {
    // 1. Retrieve current settings from storage
    let settings = { protectionEnabled: true, autoProtect: false };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get('settings');
      if (data.settings) {
        settings = data.settings;
      }
    }

    // 2. If the protection shield is globally suspended, let files pass through unmodified
    if (settings.protectionEnabled === false) {
      console.log('[UploadInterceptor] Shield is suspended. Resuming original upload.');
      return onApprovalCallback(files);
    }

    const autoProtect = settings.autoProtect === true || settings.autoRedact === true;

    if (autoProtect) {
      // Flow A: Auto Protect is ON -> immediately run pipeline and continue upload
      console.log('[UploadInterceptor] Auto Protect is ON. Running protection pipeline immediately...');
      const results = await runPipeline(files, settings);
      const protectedFiles = results.map(r => r.protectedFile);
      onApprovalCallback(protectedFiles);
    } else {
      // Flow B: Auto Protect is OFF -> show choice popup
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
    // Graceful fallback: upload original files on critical failure
    onApprovalCallback(files);
  }
}

/**
 * Runs the full protection pipeline on a list of files and logs stats back to storage.
 * 
 * @param {File[]} files - Original files to protect
 * @param {Object} settings - Pipeline configuration options
 * @returns {Promise<Object[]>} Pipeline result objects
 */
async function runPipeline(files, settings) {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        console.log('[UploadInterceptor] Serializing and delegating file to SW:', file.name);
        const arrayBuffer = await file.arrayBuffer();

        // 1. Logs added before PING
        console.log('====================================');
        console.log('A: Before PING');
        console.log('chrome =', chrome);
        console.log('chrome.runtime =', chrome?.runtime);
        console.log('typeof sendMessage =', typeof chrome?.runtime?.sendMessage);
        console.log('====================================');

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

        console.log('[UploadInterceptor] PING complete. typeof chrome.storage.session:', typeof chrome.storage.session);

        const storageKey = 'pending_image_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await chrome.storage.session.set({ [storageKey]: arrayBuffer });

        // 2. Logs added before RUN_PROTECT_PIPELINE
        console.log('====================================');
        console.log('B: Before RUN_PROTECT_PIPELINE');
        console.log('chrome =', chrome);
        console.log('chrome.runtime =', chrome?.runtime);
        console.log('typeof sendMessage =', typeof chrome?.runtime?.sendMessage);
        console.log('====================================');

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
            outBuffer = resData.arrayBuffer || arrayBuffer; // fallback
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
          metadata: {
            name: file.name,
            size: file.size,
            type: file.type
          },
          detections: [],
          risk: 'low',
          protectionSummary: { processingTime: 0, redacted: false },
          error: err.message
        };
      }
    })
  );

  // Log scan results to populate local statistics history in parallel
  await Promise.all(
    results.map(async (res) => {
      if (!res.success) return;

      // 1. Upload protected/original file to backend /api/protect
      let assetId = null;
      try {
        const formData = new FormData();
        formData.append('image', res.protectedFile);
        formData.append('blur_enabled', (settings.blurMode === 'blur' && res.protectionSummary.redacted) ? 'true' : 'false');
        formData.append('ai_cloak', (settings.aiCloakEnabled && res.protectionSummary.redacted) ? 'true' : 'false');
        formData.append('watermark', (settings.watermarkEnabled && res.protectionSummary.redacted) ? 'true' : 'false');

        const uploadResponse = await fetch('http://localhost:8000/api/protect', {
          method: 'POST',
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          if (uploadResult.success && uploadResult.data) {
            assetId = uploadResult.data.asset_id;
            console.log('[UploadInterceptor] Registered asset on backend. ID:', assetId);
          }
        }
      } catch (err) {
        console.warn('[UploadInterceptor] Backend asset registration bypassed (server offline):', err.message);
      }

      // 3. Logs added before LOG_SCAN
      console.log('====================================');
      console.log('C: Before LOG_SCAN');
      console.log('chrome =', chrome);
      console.log('chrome.runtime =', chrome?.runtime);
      console.log('typeof sendMessage =', typeof chrome?.runtime?.sendMessage);
      console.log('====================================');

      // 2. Dispatch LOG_SCAN message to background Service Worker
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
            assetId: assetId // Link the backend asset
          }
        });
      } catch (e) {
        console.warn('[UploadInterceptor] Failed to log scan result:', e);
      }
    })
  );

  return results;
}