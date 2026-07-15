import { showDecisionPopup } from './decisionPopup.js';

/**
 * SafeLens Global Outbound Image Upload Interceptor (Universal Robust Execution Framework)
 */

// Helper to convert ArrayBuffer to Base64 (Iterative to strictly prevent call stack size overflow)
function arrayBufferToBase64(buffer) {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 back to ArrayBuffer safely
function base64ToArrayBuffer(base64) {
  if (!base64) return new ArrayBuffer(0);
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

class GlobalUploadInterceptor {
  constructor() {
    this.initGlobalListeners();
  }

  initGlobalListeners() {
    // 1. Drag & Drop Global Target Listener (Captures drops across structural nodes)
    window.addEventListener('drop', (e) => {
      try {
        if (!chrome.runtime || !chrome.runtime.id) {
          console.log('[UploadInterceptor] Orphaned listener detected due to extension reload. Execution safely aborted.');
          return;
        }
        this.handleGlobalDrop(e);
      } catch (err) {
        if (err.message && (err.message.includes('Extension context invalidated') || err.message.includes('Context isolated'))) return;
        throw err;
      }
    }, true);

    // 2. Direct Form Submission Change Listener (Captures interactive file browsing actions)
    window.addEventListener('change', (e) => {
      try {
        if (!chrome.runtime || !chrome.runtime.id) {
          console.log('[UploadInterceptor] Orphaned listener detected due to extension reload. Execution safely aborted.');
          return;
        }
        this.handleGlobalInputChange(e);
      } catch (err) {
        if (err.message && (err.message.includes('Extension context invalidated') || err.message.includes('Context isolated'))) return;
        throw err;
      }
    }, true);

    // 3. Dynamic DOM Mutation Observer (Hooks onto runtime injected file components)
    const domObserver = new MutationObserver((mutations) => {
      try {
        if (!chrome.runtime || !chrome.runtime.id) {
          domObserver.disconnect();
          return;
        }
        for (let mutation of mutations) {
          for (let addedNode of mutation.addedNodes) {
            if (addedNode.nodeType === Node.ELEMENT_NODE) {
              this.bindInputNodeTrackers(addedNode);
            }
          }
        }
      } catch (err) {
        if (err.message && (err.message.includes('Extension context invalidated') || err.message.includes('Context isolated'))) {
          domObserver.disconnect();
        } else {
          throw err;
        }
      }
    });
    domObserver.observe(document.body, { childList: true, subtree: true });
  }

  bindInputNodeTrackers(element) {
    if (!chrome.runtime || !chrome.runtime.id) return;
    
    const targetInputs = element.tagName === 'INPUT' && element.type === 'file' 
      ? [element] 
      : element.querySelectorAll('input[type="file"]');
      
    targetInputs.forEach(input => {
      if (!input.dataset.safelensTracked) {
        input.dataset.safelensTracked = 'true';
        input.addEventListener('change', (e) => {
          try {
            if (!chrome.runtime || !chrome.runtime.id) return;
            this.handleGlobalInputChange(e);
          } catch (err) {
            if (err.message && (err.message.includes('Extension context invalidated') || err.message.includes('Context isolated'))) {
              console.log('[UploadInterceptor] Orphaned listener safely caught an isolated context. Aborting.');
            } else {
              throw err;
            }
          }
        }, true);
      }
    });
  }

  isContextValid() {
    return !!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
  }

  async handleGlobalInputChange(e) {
    if (!chrome.runtime || !chrome.runtime.id) {
      console.log('[UploadInterceptor] Orphaned listener detected due to extension reload. Execution safely aborted.');
      return;
    }

    if (!this.isContextValid()) {
      console.warn('[GlobalUploadInterceptor] Extension context isolated. Bypassing upload interception handler.');
      return;
    }

    if (e.target.tagName === 'INPUT' && e.target.type === 'file' && e.target.files.length > 0) {
      const interceptedFiles = Array.from(e.target.files);
      const imageFiles = interceptedFiles.filter(file => file.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        e.preventDefault();
        e.stopPropagation();

        const metadata = imageFiles.map(f => ({ name: f.name, size: f.size, type: f.type }));
        
        await interceptUpload(imageFiles, metadata, e.target, (approvedFiles) => {
          // Re-injecting approved safe files back into the original input element target context
          const dataTransfer = new DataTransfer();
          approvedFiles.forEach(f => dataTransfer.items.add(f));
          e.target.files = dataTransfer.files;

          // Dispatch synthetic event triggers to let the host application know files are updated
          const syntheticChangeEvent = new Event('change', { bubbles: true, cancelable: true });
          e.target.dispatchEvent(syntheticChangeEvent);
        });
      }
    }
  }

  async handleGlobalDrop(e) {
    if (!chrome.runtime || !chrome.runtime.id) {
      console.log('[UploadInterceptor] Orphaned listener detected due to extension reload. Execution safely aborted.');
      return;
    }

    if (!this.isContextValid()) return;

    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const imageFiles = droppedFiles.filter(file => file.type.startsWith('image/'));

      if (imageFiles.length > 0) {
        e.preventDefault();
        e.stopPropagation();

        const metadata = imageFiles.map(f => ({ name: f.name, size: f.size, type: f.type }));
        
        await interceptUpload(imageFiles, metadata, e.target, (approvedFiles) => {
          console.log('[GlobalUploadInterceptor] Triggering original upload processing stream for approved files.');
        });
      }
    }
  }
}

// Initializing the universal network shield hook
new GlobalUploadInterceptor();

export async function interceptUpload(files, metadata, targetElement, onApprovalCallback) {
  console.log('[UploadInterceptor] Intercepting upload event across host domain:', window.location.hostname, metadata.map(m => m.name));

  if (!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id)) {
    console.warn('[UploadInterceptor] Extension runtime context isolated. Bypassing worker communication.');
    alert("SafeLens Privacy Shield Alert: The extension background service is currently disconnected or updating. Outbound uploads have been securely blocked to prevent potential leaking of sensitive data. Please refresh the page to restart protection.");
    return onApprovalCallback([]);
  }

  try {
    if (!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id)) {
      alert("SafeLens Privacy Shield Alert: The extension background service is currently disconnected or updating. Outbound uploads have been securely blocked to prevent potential leaking of sensitive data. Please refresh the page to restart protection.");
      return onApprovalCallback([]);
    }
    let settings = { protectionEnabled: true, autoProtect: false };
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, resolve);
      });
      if (response && response.success && response.data) {
        settings = response.data;
      }
    } catch (e) {
      console.warn('[UploadInterceptor] Could not fetch settings, using defaults.', e);
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
      
      if (!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id)) {
        console.warn('[UploadInterceptor] Context isolated during user popup interaction. Falling back safely.');
        alert("SafeLens Privacy Shield Alert: The extension background service is currently disconnected or updating. Outbound uploads have been securely blocked to prevent potential leaking of sensitive data. Please refresh the page to restart protection.");
        return onApprovalCallback([]);
      }
      
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
    if (error.message && (error.message.includes('Extension context invalidated') || error.message.includes('Context isolated'))) {
      console.warn('[UploadInterceptor] Context isolated during interception pipeline. Gracefully failing secure.');
      alert("SafeLens Privacy Shield Alert: The extension background service is currently disconnected or updating. Outbound uploads have been securely blocked to prevent potential leaking of sensitive data. Please refresh the page to restart protection.");
      return onApprovalCallback([]);
    }
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

        const base64Data = arrayBufferToBase64(arrayBuffer);

        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            type: 'RUN_PROTECT_PIPELINE',
            payload: {
              base64Data: base64Data,
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
          if (resData.base64Data) {
            outBuffer = base64ToArrayBuffer(resData.base64Data);
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
        if (err.message && (err.message.includes('Extension context invalidated') || err.message.includes('Context isolated'))) {
           throw err; // Propagate to outer interceptUpload catch block to safely fallback
        }
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

  await Promise.all(
    results.map(async (res) => {
      if (!res.success) return;

      if (!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id)) return;

      let assetId = null;
      try {
        console.log('[UploadInterceptor] Delegating asset registration to SW to bypass host CSP restrictions...');
        
        const protectedBuffer = await res.protectedFile.arrayBuffer();
        const base64Protected = arrayBufferToBase64(protectedBuffer);

        const uploadResponse = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            type: 'REGISTER_BACKEND_ASSET',
            payload: {
              base64Data: base64Protected,
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
            assetId: assetId,
            matchedUrl: window.location.href
          }
        });
      } catch (e) {
        console.warn('[UploadInterceptor] Failed to dispatch scan log metrics:', e);
      }
    })
  );

  return results;
}