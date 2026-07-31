/**
 * interceptor.js
 * Hooks into file input change events to capture uploads before they
 * are transmitted, then routes them through the domain checker and
 * background service worker.
 */

(function () {
  const EXT_NAME = 'SafeLens Privacy Shield AI';

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFile(file, inputEl) {
    if (!file || !file.type.startsWith('image/')) return;

    const isTrusted = await window.SafeLensDomainChecker.isTrustedDomain();

    if (isTrusted) {
      console.log(`[${EXT_NAME}] Trusted domain - allowing original upload flow.`);
      return; // do nothing, let the original upload proceed
    }

    console.log(`[${EXT_NAME}] Untrusted domain - intercepting for processing...`);

    const dataUrl = await fileToDataURL(file);

    chrome.runtime.sendMessage(
      {
        action: 'PROCESS_UPLOAD',
        payload: {
          fileDataUrl: dataUrl,
          extracted_text: '',
          target_domain: window.location.hostname,
          pii_type: 'file_upload'
        }
      }, // <-- the missing comma, restored
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(`[${EXT_NAME}] Message error:`, chrome.runtime.lastError.message);
          return;
        }

        console.log(`[${EXT_NAME}] Processing result:`, response);

        // Notify toast injector regardless of outcome
        window.dispatchEvent(
          new CustomEvent('safelens:notify', {
            detail: {
              status: response.status === 'success' ? 'success' : 'error',
              message:
                response.status === 'success'
                  ? 'Data auto-protected & uploaded securely.'
                  : 'Protection check failed - please review manually.'
            }
          })
        );

        // If a decoy payload was generated, swap the file (future step)
        if (response.decoyPayload) {
          // Placeholder: swap logic will use DataTransfer to replace input.files
        }
      }
    );
  }

  function attachToFileInputs() {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach((input) => {
      if (input.dataset.safelensAttached) return;
      input.dataset.safelensAttached = 'true';
      input.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          handleFile(files[0], input);
        }
      });
    });
  }

  attachToFileInputs();

  const observer = new MutationObserver(() => attachToFileInputs());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // ---------------------------------------------------------------------
  // Dashboard bridge — responds to window.postMessage from
  // services/extensionBridge.js so the dashboard can show live
  // Active/Snoozed/Not-Detected shield status.
  // ---------------------------------------------------------------------
  const STORAGE_KEYS = {
    paused: 'safelens_extensionPaused',
    pauseUntil: 'safelens_pauseUntilTimestamp',
    whitelist: 'safelens_whitelist',
  };

  async function getShieldStatus() {
    const stored = await chrome.storage.local.get([
      STORAGE_KEYS.paused,
      STORAGE_KEYS.pauseUntil,
      STORAGE_KEYS.whitelist,
    ]);
    let paused = stored[STORAGE_KEYS.paused] || false;
    const pauseUntil = stored[STORAGE_KEYS.pauseUntil] || null;

    // Auto-resume if the snooze window has already elapsed
    if (paused && pauseUntil && Date.now() >= pauseUntil) {
      paused = false;
      await chrome.storage.local.set({
        [STORAGE_KEYS.paused]: false,
        [STORAGE_KEYS.pauseUntil]: null,
      });
    }

    return {
      extensionPaused: paused,
      pauseUntilTimestamp: paused ? pauseUntil : null,
      whitelist: stored[STORAGE_KEYS.whitelist] || [],
    };
  }

  function replyWithStatus() {
    getShieldStatus().then((status) => {
      console.log(
        `[${EXT_NAME}] \u{1F6E1} Protection State Synced from Dashboard: ${status.extensionPaused ? 'PAUSED' : 'ACTIVE'}`
      );
      window.postMessage(
        { direction: 'from-content-script', type: 'SAFELENS_STATUS_RESPONSE', payload: status },
        '*'
      );
    });
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    const data = event.data || {};
    if (data.direction !== 'from-page-script') return;

    if (data.type === 'SAFELENS_STATUS_REQUEST') {
      replyWithStatus();
      return;
    }

    if (data.type === 'SAFELENS_TOGGLE_STATE') {
      const { extensionPaused, pauseUntilTimestamp } = data.payload || {};
      chrome.storage.local
        .set({
          [STORAGE_KEYS.paused]: Boolean(extensionPaused),
          [STORAGE_KEYS.pauseUntil]: extensionPaused ? pauseUntilTimestamp : null,
        })
        .then(replyWithStatus);
      return;
    }

    if (data.type === 'SAFELENS_WHITELIST_ADD') {
      const { domain } = data.payload || {};
      if (!domain) return;
      chrome.storage.local.get([STORAGE_KEYS.whitelist]).then((stored) => {
        const whitelist = stored[STORAGE_KEYS.whitelist] || [];
        if (!whitelist.includes(domain)) whitelist.push(domain);
        chrome.storage.local.set({ [STORAGE_KEYS.whitelist]: whitelist }).then(replyWithStatus);
      });
    }
  });
})();