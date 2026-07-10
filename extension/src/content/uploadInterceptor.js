/**
 * Upload Interceptor for SafeLens Content Script
 * 
 * Responsibility:
 * - Suspends and intercepts file uploads on target web pages.
 * - Renders a visually premium modal overlay for user decision (Protect / Upload Anyway / Cancel).
 * - Exposes standard hooks for future AI pipeline and React UI overlays.
 * - Re-injects approved or redacted files back into the target DOM element.
 * 
 * Interacts with:
 * - extension/src/content/uploadDetector.js (Receives detected image files)
 * - window.__SafeLensProtectPipeline (Global hook for the AI protection orchestrator)
 */

/**
 * Hook definition for the future AI pipeline.
 * If registered, this replaces the mock UI with the production React decision flows.
 * @type {null|function(File[]): Promise<{action: 'protect'|'anyway'|'cancel', files: File[]}>}
 */
window.__SafeLensProtectPipeline = null;

/**
 * Intercepts the upload list, pauses execution, and initiates the decision dialog.
 * 
 * @param {File[]} files - Selected image files
 * @param {FileMetadata[]} metadata - Metadata extracted by the detector
 * @param {HTMLElement} targetElement - Original DOM target element of the upload
 * @param {Function} onApprovalCallback - Callback to resume upload with approved file list
 */
export function interceptUpload(files, metadata, targetElement, onApprovalCallback) {
  console.log('[UploadInterceptor] Intercepted upload request', { fileCount: files.length, targetElement });

  // Check if a production pipeline has been registered
  if (typeof window.__SafeLensProtectPipeline === 'function') {
    window.__SafeLensProtectPipeline(files)
      .then(({ action, processedFiles }) => {
        handleAction(action, processedFiles || files, onApprovalCallback);
      })
      .catch((error) => {
        console.error('[UploadInterceptor] Custom protect pipeline failed:', error);
        showMockModal(files, metadata, onApprovalCallback);
      });
  } else {
    // Fall back to the visually styled mock modal for Phase 1/2 verification
    showMockModal(files, metadata, onApprovalCallback);
  }
}

/**
 * Handle resolved actions from the decision interface.
 * 
 * @param {'protect'|'anyway'|'cancel'} action - User action selected
 * @param {File[]} files - Files list to upload
 * @param {Function} onApprovalCallback - Resumes the event propagation
 */
function handleAction(action, files, onApprovalCallback) {
  switch (action) {
    case 'protect':
      console.log('[UploadInterceptor] User selected: PROTECT. Simulating AI pipeline...');
      // Simulate pipeline delay (e.g. 1.2s to mock OCR/Redaction)
      simulateProtectionPipeline(files).then((protectedFiles) => {
        onApprovalCallback(protectedFiles);
      });
      break;

    case 'anyway':
      console.log('[UploadInterceptor] User selected: UPLOAD ANYWAY. Re-triggering original files.');
      onApprovalCallback(files);
      break;

    case 'cancel':
    default:
      console.log('[UploadInterceptor] User selected: CANCEL. Upload terminated.');
      break;
  }
}

/**
 * Simulates redacting and watermark protection on files.
 * 
 * @param {File[]} files - Original files
 * @returns {Promise<File[]>} Cloned files with simulated modifications
 */
async function simulateProtectionPipeline(files) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const protectedFiles = files.map((file) => {
        // Create a new File wrapper indicating protection has occurred
        return new File(
          [file],
          file.name.replace(/(\.[\w\d]+)$/, '_protected$1'),
          { type: file.type, lastModified: Date.now() }
        );
      });
      console.log('[UploadInterceptor] Protection complete. Simulated redacted files:', protectedFiles);
      resolve(protectedFiles);
    }, 1200);
  });
}

/**
 * Escapes special HTML characters to prevent XSS.
 * 
 * @param {string} str - Raw input string
 * @returns {string} HTML-escaped string
 */
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (match) => {
    const escapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapes[match];
  });
}

/**
 * Displays a premium styled HTML modal overlay for user selection.
 * 
 * @param {File[]} files - Original files
 * @param {FileMetadata[]} metadata - File information
 * @param {Function} onApprovalCallback - Resumes the event
 */
function showMockModal(files, metadata, onApprovalCallback) {
  // Prevent duplicate modals
  if (document.getElementById('safelens-intercept-modal')) {
    return;
  }

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'safelens-intercept-modal';
  
  // Inject CSS styling directly for sandbox isolation
  const style = document.createElement('style');
  style.textContent = `
    #safelens-intercept-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(10, 12, 16, 0.85);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: 2147483647;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
      color: #c5c6c7;
    }
    .sl-modal-card {
      width: 420px;
      background: linear-gradient(135deg, #121824 0%, #0b0c10 100%);
      border: 1px solid #2f3e46;
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      gap: 20px;
      animation: sl-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes sl-fade-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .sl-header {
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #2f3e46;
      padding-bottom: 16px;
    }
    .sl-pulse {
      width: 10px;
      height: 10px;
      background-color: #66fcf1;
      border-radius: 50%;
      box-shadow: 0 0 10px #66fcf1;
    }
    .sl-title {
      font-size: 20px;
      font-weight: 800;
      margin: 0;
      background: linear-gradient(90deg, #66fcf1 0%, #4facfe 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sl-badge {
      background: rgba(102, 252, 241, 0.1);
      border: 1px solid #66fcf1;
      color: #66fcf1;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 99px;
      margin-left: auto;
    }
    .sl-body {
      font-size: 13px;
      line-height: 1.5;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .sl-file-list {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid #2f3e46;
      border-radius: 8px;
      padding: 12px;
      max-height: 100px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .sl-file-item {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-family: monospace;
    }
    .sl-file-size {
      color: #718096;
    }
    .sl-footer {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 8px;
    }
    .sl-btn {
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
      border: 1px solid transparent;
    }
    .sl-btn-protect {
      background: #66fcf1;
      color: #0b0c10;
    }
    .sl-btn-protect:hover {
      box-shadow: 0 0 15px rgba(102, 252, 241, 0.4);
      background: #76fff5;
    }
    .sl-btn-anyway {
      background: rgba(246, 173, 85, 0.1);
      border: 1px solid #f6ad55;
      color: #f6ad55;
    }
    .sl-btn-anyway:hover {
      background: rgba(246, 173, 85, 0.2);
    }
    .sl-btn-cancel {
      background: rgba(113, 128, 150, 0.1);
      border: 1px solid #718096;
      color: #cbd5e0;
    }
    .sl-btn-cancel:hover {
      background: rgba(113, 128, 150, 0.2);
    }
  `;

  // Build card HTML
  const filesListHtml = metadata.map((m) => {
    const displayName = m.name.length > 28 ? m.name.substring(0, 25) + '...' : m.name;
    return `
      <div class="sl-file-item">
        <span>📄 ${escapeHtml(displayName)}</span>
        <span class="sl-file-size">${(m.size / 1024).toFixed(1)} KB</span>
      </div>
    `;
  }).join('');

  overlay.innerHTML = `
    <div class="sl-modal-card">
      <div class="sl-header">
        <div class="sl-pulse"></div>
        <h2 class="sl-title">SafeLens Shield</h2>
        <span class="sl-badge">Intercepted</span>
      </div>
      <div class="sl-body">
        <p>SafeLens intercepted a file upload request. Choose how you want to proceed to secure your privacy:</p>
        <div class="sl-file-list">
          ${filesListHtml}
        </div>
      </div>
      <div class="sl-footer">
        <div id="sl-btn-protect" class="sl-btn sl-btn-protect">🛡️ Protect (Redact & Upload)</div>
        <div id="sl-btn-anyway" class="sl-btn sl-btn-anyway">⚠️ Upload Anyway (Unprotected)</div>
        <div id="sl-btn-cancel" class="sl-btn sl-btn-cancel">❌ Cancel Upload</div>
      </div>
    </div>
  `;

  overlay.appendChild(style);
  document.body.appendChild(overlay);

  // Setup UI Event Listeners
  document.getElementById('sl-btn-protect').addEventListener('click', () => {
    cleanup();
    handleAction('protect', files, onApprovalCallback);
  });

  document.getElementById('sl-btn-anyway').addEventListener('click', () => {
    cleanup();
    handleAction('anyway', files, onApprovalCallback);
  });

  document.getElementById('sl-btn-cancel').addEventListener('click', () => {
    cleanup();
    handleAction('cancel', files, onApprovalCallback);
  });

  function cleanup() {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }
}
