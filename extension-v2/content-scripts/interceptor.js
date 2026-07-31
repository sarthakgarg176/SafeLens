/**
 * interceptor.js
 * Hooks into file input change events to capture uploads before they
 * are transmitted, then routes them through the domain checker and
 * background service worker.
 *
 * IMPORTANT: The 'change' event on a file input fires synchronously and
 * the page's own listeners (React onChange, plain addEventListener, etc.)
 * can read/consume input.files immediately — before our async domain
 * check + backend redaction call ever resolves. To guarantee the page
 * never sees the raw, unprocessed file, we listen in the CAPTURE phase
 * at the document level (which runs before the event reaches the input
 * element itself) and stop it from propagating any further. Once we've
 * decided what the page is allowed to see (the original file if trusted/
 * clean, or the redacted file otherwise), we swap input.files and
 * dispatch a fresh 'change' event ourselves so the page's listeners fire
 * against the safe version.
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

  function dataUrlToFile(dataUrl, filename, mimeType) {
    const [meta, base64] = dataUrl.split(',');
    const mime = mimeType || (meta.match(/data:(.*?);base64/) || [])[1] || 'image/png';
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mime });
  }

  // Files in this set are "cleared" — either already redacted by us, or
  // confirmed safe to pass through as-is (trusted domain / no PII found).
  // When our capture-phase listener sees a change event carrying one of
  // these files, it lets the event through untouched instead of
  // re-intercepting it, which avoids an infinite loop.
  const clearedFiles = new WeakSet();

  function swapInputFiles(inputEl, newFile) {
    clearedFiles.add(newFile);
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(newFile);
    inputEl.files = dataTransfer.files;
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function requestImageProcessing(file) {
    return new Promise(async (resolve) => {
      const dataUrl = await fileToDataURL(file);
      chrome.runtime.sendMessage(
        {
          action: 'PROCESS_IMAGE', // matches service-worker.js listener
          payload: {
            base64Data: dataUrl,       // service-worker does fetch(base64Data) -> blob
            filename: file.name || 'image.png',
            type: file.type
          }
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(`[${EXT_NAME}] Message error:`, chrome.runtime.lastError.message);
            resolve({ success: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(response);
        }
      );
    });
  }

  async function handleFile(file, inputEl) {
    if (!file || !file.type.startsWith('image/')) {
      // Not an image (or empty) — nothing for us to inspect, let it through.
      swapInputFiles(inputEl, file);
      return;
    }

    const isTrusted = await window.SafeLensDomainChecker.isTrustedDomain();

    if (isTrusted) {
      console.log(`[${EXT_NAME}] Trusted domain - allowing original upload flow.`);
      swapInputFiles(inputEl, file);
      return;
    }

    console.log(`[${EXT_NAME}] Untrusted domain - intercepting for processing...`);

    const response = await requestImageProcessing(file);
    console.log(`[${EXT_NAME}] Processing result:`, response);

    // service-worker.js replies with { success: true/false, ... } — not { status: 'success' }
    window.dispatchEvent(
      new CustomEvent('safelens:notify', {
        detail: {
          status: response.success ? 'success' : 'error',
          message: response.success
            ? 'Data auto-protected & uploaded securely.'
            : 'Protection check failed - please review manually.'
        }
      })
    );

    // Broadcast scan completion so the dashboard (SecurityContext.jsx)
    // refreshes its incidents/takedowns immediately instead of waiting
    // for the next 15-second poll.
    window.postMessage({ type: 'SAFELENS_SCAN_COMPLETED', payload: response }, '*');

    if (response.success && response.isRedacted && response.base64Data) {
      // Backend found PII and returned a redacted image — this is the
      // ONLY version of the file the page is allowed to see.
      try {
        const redactedFile = dataUrlToFile(
          response.base64Data,
          response.filename || file.name || 'redacted_image.png',
          response.mimeType || file.type
        );
        swapInputFiles(inputEl, redactedFile);
        console.log(`[${EXT_NAME}] Original file swapped with redacted version: ${redactedFile.name}`);
      } catch (swapErr) {
        console.error(`[${EXT_NAME}] Failed to build/swap in redacted file:`, swapErr);
        // Fail safe: don't let the raw file through if we can't confirm redaction.
      }
      return;
    }

    if (response.success && !response.isRedacted) {
      // Backend checked the image and found nothing sensitive (CLEAN) —
      // safe to release the original file to the page.
      swapInputFiles(inputEl, file);
      return;
    }

    // response.success === false: backend/processing failed. We don't have
    // a verified-safe version of the file, so we do NOT release the raw
    // original to the untrusted site. The toast above already told the
    // user to review manually; they can choose to re-select the file if
    // they want to proceed anyway.
    console.warn(`[${EXT_NAME}] Processing failed - blocking upload of unverified file.`);
  }

  // Single capture-phase listener at the document level. Capture-phase
  // listeners run before the event reaches its target, so this fires
  // before any listener the page attached directly to the input.
  document.addEventListener(
    'change',
    (e) => {
      const inputEl = e.target;
      if (!inputEl || inputEl.tagName !== 'INPUT' || inputEl.type !== 'file') return;

      const files = inputEl.files;
      const file = files && files.length > 0 ? files[0] : null;

      if (file && clearedFiles.has(file)) {
        // This is a change event we dispatched ourselves after clearing
        // the file — let it proceed to the page normally.
        return;
      }

      // Block the page from seeing this raw event/file entirely.
      e.stopImmediatePropagation();
      e.preventDefault();

      if (file) {
        handleFile(file, inputEl);
      }
    },
    true // capture phase
  );

  // ---------------------------------------------------------------------
  // Dashboard bridge — responds to window.postMessage from
  // services/extensionBridge.js so the dashboard can show live
  // Active/Snoozed/Not-Detected shield status.
  // ---------------------------------------------------------------------
  const STORAGE_KEYS = {
    paused: 'extensionPaused',
    pauseUntil: 'pauseUntilTimestamp',
    whitelist: 'SAFELENS_WHITELIST',
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