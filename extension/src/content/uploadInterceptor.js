import { showDecisionPopup } from './decisionPopup.js';

function arrayBufferToBase64(buffer) {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  if (!base64) return new ArrayBuffer(0);
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer;
}

// 🛡️ THE ULTIMATE FAILSAFE MASKING (Aspect-Ratio Aware)
async function applyUniversalPrivacyMask(buffer, fileType, fileName, detections = []) {
  const nameLower = fileName.toLowerCase();
  
  const isTargetDocument = nameLower.includes('adhar') || 
                           nameLower.includes('aadhaar') || 
                           nameLower.includes('pan') || 
                           nameLower.includes('card') ||
                           nameLower.includes('front') ||
                           nameLower.includes('back');

  if (!isTargetDocument && (!detections || detections.length === 0)) return buffer;

  return new Promise((resolve) => {
    const blob = new Blob([buffer], { type: fileType });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = '#000000';

      // 1. DYNAMIC OCR MASKING
      if (detections && detections.length > 0) {
        detections.forEach(d => {
          const box = d.boundingBox || d;
          if (box && typeof box.x === 'number') {
            ctx.fillRect(Math.max(0, box.x - 6), Math.max(0, box.y - 6), box.width + 12, box.height + 12);
          }
        });
      }

      // 2. FALLBACK (Aspect-Ratio Aware)
      if (isTargetDocument && (!detections || detections.length === 0)) {
        console.log('[SafeLens Shield] Fallback protection triggered!');
        const isPortrait = img.height > img.width;
        const scale = isPortrait ? img.width / 1000 : img.height / 1000;
        
        if (nameLower.includes('front')) {
          ctx.fillRect(img.width * 0.25, img.height * 0.40, img.width * 0.50, img.height * 0.15);
        } else {
          ctx.fillRect(img.width * 0.10, img.height * 0.70, img.width * 0.80, img.height * 0.20);
        }
      }

      canvas.toBlob((newBlob) => {
        newBlob ? newBlob.arrayBuffer().then(resolve) : resolve(buffer);
      }, fileType);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(buffer); };
    img.src = url;
  });
}

class GlobalUploadInterceptor {
  constructor() { 
    this.isProcessing = false;
    this.isProgrammaticChange = false; // 🚀 Infinite loop protection guard
    this.initGlobalListeners(); 
  }

  initGlobalListeners() {
    window.addEventListener('change', (e) => {
      // 🚀 Guard: Ignore programmatic triggers to prevent loops
      if (this.isProgrammaticChange) {
        this.isProgrammaticChange = false;
        return;
      }
      if (this.isProcessing) return;
      try { if (chrome.runtime?.id) this.handleGlobalInputChange(e); } catch (err) {}
    }, true);
    
    window.addEventListener('drop', (e) => {
      try { if (chrome.runtime?.id) this.handleGlobalDrop(e); } catch (err) {}
    }, true);
  }

  async handleGlobalInputChange(e) {
    if (!chrome.runtime?.id || this.isProcessing) return;
    if (e.target.tagName === 'INPUT' && e.target.type === 'file' && e.target.files.length > 0) {
      const interceptedFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      if (interceptedFiles.length > 0) {
        e.preventDefault(); e.stopPropagation(); this.isProcessing = true;
        
        await interceptUpload(interceptedFiles, e.target, (approvedFiles) => {
          const dataTransfer = new DataTransfer();
          approvedFiles.forEach(f => dataTransfer.items.add(f));
          
          this.isProgrammaticChange = true; // 🚀 Flag set before trigger
          e.target.files = dataTransfer.files;
          e.target.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
          this.isProcessing = false;
        });
      }
    }
  }

  async handleGlobalDrop(e) {
    if (!chrome.runtime?.id || !e.dataTransfer?.files.length) return;
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (droppedFiles.length > 0) {
      e.preventDefault(); e.stopPropagation();
      await interceptUpload(droppedFiles, e.target, () => {});
    }
  }
}
new GlobalUploadInterceptor();

export async function interceptUpload(files, targetElement, onApprovalCallback) {
  if (!chrome.runtime?.id) return onApprovalCallback([]);
  try {
    let settings = { protectionEnabled: true, autoProtect: false };
    const results = await runPipeline(files, settings);
    onApprovalCallback(results.map(r => r.protectedFile));
  } catch (error) {
    onApprovalCallback(files);
  }
}

async function runPipeline(files, settings) {
  return await Promise.all(files.map(async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = arrayBufferToBase64(arrayBuffer);

      const response = await new Promise((res) => {
        chrome.runtime.sendMessage({
          type: 'RUN_PROTECT_PIPELINE',
          payload: { base64Data, name: file.name, type: file.type, settings }
        }, res);
      });

      let finalDetections = response?.data?.detections || [];
      let outBuffer = (response?.success && response?.data?.base64Data) ? base64ToArrayBuffer(response.data.base64Data) : arrayBuffer;

      // APPLY MASKS
      outBuffer = await applyUniversalPrivacyMask(outBuffer, file.type, file.name, finalDetections);

      const blob = new Blob([outBuffer], { type: file.type });
      return { success: true, protectedFile: new File([blob], file.name, { type: file.type }) };
    } catch (err) {
      return { success: false, protectedFile: file };
    }
  }));
}