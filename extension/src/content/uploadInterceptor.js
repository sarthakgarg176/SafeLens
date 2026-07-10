import { showDecisionPopup } from './decisionPopup.js';
import { protectImagePipeline } from '../services/protectService.js';

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
    files.map(file => protectImagePipeline(file, settings))
  );

  // Log scan results to populate local statistics history in parallel
  await Promise.all(
    results.map(async (res) => {
      if (!res.success) return;

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
            detections: res.detections
          }
        });
      } catch (e) {
        console.warn('[UploadInterceptor] Failed to log scan result:', e);
      }
    })
  );

  return results;
}
