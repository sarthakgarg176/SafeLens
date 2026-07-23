/**
 * Decision Popup Modal UI for SafeLens Content Script
 * 
 * Responsibility:
 * - Renders a visually premium, modern, dark-themed modal overlay.
 * - Displays a list of files intercepted.
 * - Prompts the user with three options: Protect, Upload Anyway, or Cancel.
 * - Resolves a Promise with the selected action.
 * 
 * Input/Output Contract:
 * - Input: File[] (list of files), Object[] (metadata logs)
 * - Output: Promise<'protect'|'anyway'|'cancel'>
 */

/**
 * Escapes HTML characters to prevent XSS.
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
 * Creates and displays the decision popup. Resolves with the user's selected choice.
 * 
 * @param {File[]} files - Selected image files
 * @param {Object[]} metadata - Extracted file metadata
 * @returns {Promise<'protect'|'anyway'|'cancel'>} Action selection Promise
 */
export function showDecisionPopup(files, metadata) {
  return new Promise((resolve) => {
    // 1. Prevent duplicate modals
    if (document.getElementById('safelens-intercept-modal')) {
      return resolve('cancel');
    }

    if (!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id)) {
      console.warn('[DecisionPopup] Extension context isolated. Bypassing popup rendering.');
      alert("SafeLens Privacy Shield Alert: The extension background service is currently disconnected or updating. Outbound uploads have been securely blocked to prevent potential leaking of sensitive data. Please refresh the page to restart protection.");
      return resolve('cancel');
    }

    // 2. Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'safelens-intercept-modal';

    // 3. Inject premium styles
    const style = document.createElement('style');
    style.textContent = `
      #safelens-intercept-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(10, 12, 16, 0.88);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 2147483647;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
        color: #e2e8f0;
      }
      .sl-modal-card {
        width: 440px;
        background: linear-gradient(135deg, #131722 0%, #0c0e14 100%);
        border: 1px solid rgba(102, 252, 241, 0.25);
        border-radius: 20px;
        padding: 30px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(102, 252, 241, 0.05);
        display: flex;
        flex-direction: column;
        gap: 22px;
        animation: sl-scale-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes sl-scale-up {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      .sl-header {
        display: flex;
        align-items: center;
        gap: 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 18px;
      }
      .sl-pulse-glow {
        width: 12px;
        height: 12px;
        background-color: #66fcf1;
        border-radius: 50%;
        box-shadow: 0 0 15px #66fcf1;
        animation: sl-pulse-anim 2s infinite;
      }
      @keyframes sl-pulse-anim {
        0% { transform: scale(0.9); opacity: 0.8; }
        50% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 25px #66fcf1; }
        100% { transform: scale(0.9); opacity: 0.8; }
      }
      .sl-title {
        font-size: 22px;
        font-weight: 800;
        margin: 0;
        background: linear-gradient(90deg, #66fcf1 0%, #00d2ff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .sl-badge {
        background: rgba(102, 252, 241, 0.12);
        border: 1px solid rgba(102, 252, 241, 0.4);
        color: #66fcf1;
        font-size: 11px;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 99px;
        margin-left: auto;
      }
      .sl-body {
        font-size: 14px;
        line-height: 1.6;
        color: #a0aec0;
      }
      .sl-body p {
        margin: 0 0 14px 0;
      }
      .sl-file-list {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 14px;
        max-height: 120px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .sl-file-item {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        font-family: 'Space Mono', monospace;
        color: #e2e8f0;
      }
      .sl-file-size {
        color: #718096;
      }
      .sl-footer {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 6px;
      }
      .sl-btn {
        padding: 13px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        text-align: center;
        border: 1px solid transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .sl-btn-protect {
        background: linear-gradient(90deg, #66fcf1 0%, #00b4db 100%);
        color: #0b0c10;
        box-shadow: 0 4px 15px rgba(102, 252, 241, 0.2);
      }
      .sl-btn-protect:hover {
        background: linear-gradient(90deg, #76fff5 0%, #00c6f0 100%);
        box-shadow: 0 6px 20px rgba(102, 252, 241, 0.35);
        transform: translateY(-1px);
      }
      .sl-btn-anyway {
        background: rgba(246, 173, 85, 0.06);
        border: 1px solid rgba(246, 173, 85, 0.4);
        color: #f6ad55;
      }
      .sl-btn-anyway:hover {
        background: rgba(246, 173, 85, 0.15);
        border-color: #f6ad55;
        transform: translateY(-1px);
      }
      .sl-btn-cancel {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #a0aec0;
      }
      .sl-btn-cancel:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        transform: translateY(-1px);
      }
    `;

    // 4. Populate files HTML
    const filesListHtml = metadata.map((m) => {
      const displayName = m.name.length > 30 ? m.name.substring(0, 27) + '...' : m.name;
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
          <div class="sl-pulse-glow"></div>
          <h2 class="sl-title">SafeLens Shield</h2>
          <span class="sl-badge">Intercepted</span>
        </div>
        <div class="sl-body">
          <p>An outbound image upload was intercepted. Select your privacy protection level to proceed:</p>
          <div class="sl-file-list">
            ${filesListHtml}
          </div>
        </div>
        <div class="sl-footer">
          <div id="sl-btn-protect" class="sl-btn sl-btn-protect">🛡️ Protect & Upload (Secure)</div>
          <div id="sl-btn-anyway" class="sl-btn sl-btn-anyway">⚠️ Upload Anyway (Unsecured)</div>
          <div id="sl-btn-cancel" class="sl-btn sl-btn-cancel">❌ Cancel Upload</div>
        </div>
      </div>
    `;

    overlay.appendChild(style);
    document.body.appendChild(overlay);

    // 5. Setup UI Event Listeners
    const btnProtect = document.getElementById('sl-btn-protect');
    const btnAnyway = document.getElementById('sl-btn-anyway');
    const btnCancel = document.getElementById('sl-btn-cancel');

    const handleSelect = (choice) => {
      if (!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id)) {
        console.warn('[DecisionPopup] Extension context isolated during user interaction. Falling back safely.');
        cleanup();
        alert("SafeLens Privacy Shield Alert: The extension background service is currently disconnected or updating. Outbound uploads have been securely blocked to prevent potential leaking of sensitive data. Please refresh the page to restart protection.");
        return resolve('cancel');
      }
      cleanup();
      resolve(choice);
    };

    btnProtect.addEventListener('click', () => handleSelect('protect'));
    btnAnyway.addEventListener('click', () => handleSelect('anyway'));
    btnCancel.addEventListener('click', () => handleSelect('cancel'));

    function cleanup() {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  });
}
