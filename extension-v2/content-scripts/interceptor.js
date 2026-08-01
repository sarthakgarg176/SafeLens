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
  // TEXT / PROMPT INTERCEPTION
  // Same idea as the file interception above: block the native Enter
  // keypress / Send-button click synchronously, scan the typed text via
  // PROCESS_TEXT_FORM, then either let a (possibly sanitized) resend
  // through or block it entirely if it can't be verified safe.
  //
  // NOTE: ChatGPT/Claude-style chat UIs generally use a contenteditable
  // div for the prompt box rather than a <textarea>. This handles both.
  // Site-specific selectors weren't available, so the "send button"
  // detection below is a heuristic (looks for aria-label/data-testid
  // containing "send" on the clicked element or its nearby ancestors).
  // If it doesn't fire on a particular site, tell me the exact selector
  // for that site's send button/prompt box and I'll tighten this up.
  // ---------------------------------------------------------------------

  // Set right before we programmatically re-dispatch a "send" trigger
  // (Enter keydown / button click) so our own listener lets it through
  // instead of re-intercepting and looping forever.
  let bypassNextSubmit = false;
  let textCheckInFlight = false;

  function getPromptText(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return el.value || '';
    if (el.isContentEditable) return el.innerText || el.textContent || '';
    return '';
  }

  // Replaces the text inside the prompt box with `text`, without breaking
  // rich-text editors (ProseMirror, Slate, Lexical, etc.) that ChatGPT/
  // Claude-style sites commonly use for contenteditable prompt boxes.
  //
  // Directly setting textContent/innerText bypasses the editor's own
  // input pipeline, so its internal document model gets out of sync with
  // the DOM — the editor then submits its OWN (stale/unredacted) copy on
  // send, ignoring what we just wrote. Using execCommand('insertText')
  // instead fires real beforeinput/input events through the browser's
  // native editing pipeline, which is what these editors listen to, so
  // their internal state gets updated correctly along with the DOM.
  function setPromptText(el, text) {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      nativeSetter.call(el, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    if (el.isContentEditable) {
      el.focus();

      // Select all existing content inside this specific editable element
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const inserted = document.execCommand('insertText', false, text);
      if (!inserted) {
        // Fallback if execCommand isn't available/supported
        el.textContent = text;
        el.dispatchEvent(new InputEvent('input', { bubbles: true }));
      }
      return true;
    }

    return false;
  }

  function findSendButtonAncestor(target) {
    let el = target;
    for (let i = 0; i < 4 && el; i++, el = el.parentElement) {
      if (!el.getAttribute) continue;
      const label = el.getAttribute('aria-label') || el.getAttribute('data-testid') || '';
      if (/send/i.test(label)) return el;
    }
    return null;
  }

  function requestTextProtection(text) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: 'PROCESS_TEXT_FORM', // matches service-worker.js listener
          payload: { text }
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(`[${EXT_NAME}] Text message error:`, chrome.runtime.lastError.message);
            resolve({ status: 'error', message: chrome.runtime.lastError.message });
            return;
          }
          resolve(response || {});
        }
      );
    });
  }

  // Normalizes the two possible backend response shapes:
  //  - legacy engine: { status, recommendation, hits, riskScore, decoyPayload }
  //  - new agent:      { status, decoy_applied, sanitized_text, payload }
  //
  // When PII is found and the backend gives us a spoofed/decoy value
  // (sanitized_text, or payload.synthetic_value as a fallback), we swap
  // it into the prompt box and let the send proceed with THAT text — the
  // real number/email never gets sent. If no safe replacement text is
  // available at all (e.g. legacy engine, which only flags PII without
  // producing a decoy), we fall back to blocking the send entirely.
  function interpretTextResponse(response) {
    if (!response || response.status === 'error') {
      return { piiFound: true, replacementText: null, verified: false };
    }

    if (typeof response.recommendation === 'string') {
      // legacy engine — verdict only, no decoy/spoofed text is produced
      return {
        piiFound: response.recommendation === 'REDACT_MANDATORY',
        replacementText: null,
        verified: true
      };
    }

    // new agent path
    const piiFound = Boolean(response.decoy_applied);
    let replacementText = response.sanitized_text || null;
    const syntheticValue = response.payload && response.payload.synthetic_value;

    // Safety net: if sanitized_text wasn't actually swapped for some
    // reason, fall back to the synthetic value directly.
    if (piiFound && syntheticValue && (!replacementText || replacementText === response.text)) {
      replacementText = syntheticValue;
    }

    return { piiFound, replacementText, verified: true };
  }

  async function scanAndSubmit(el, dispatchResend) {
    const rawText = getPromptText(el).trim();
    if (!rawText) {
      dispatchResend();
      return;
    }

    const isTrusted = await window.SafeLensDomainChecker.isTrustedDomain();
    if (isTrusted) {
      dispatchResend();
      return;
    }

    console.log(`[${EXT_NAME}] Untrusted domain - scanning prompt text before send...`);
    const response = await requestTextProtection(rawText);
    console.log(`[${EXT_NAME}] Text scan result:`, response);

    window.postMessage({ type: 'SAFELENS_SCAN_COMPLETED', payload: response }, '*');

    const { piiFound, replacementText, verified } = interpretTextResponse(response);

    if (!verified) {
      window.dispatchEvent(new CustomEvent('safelens:notify', {
        detail: { status: 'error', message: 'Protection check failed - please review manually.' }
      }));
      return; // don't resend — we couldn't verify the text is safe
    }

    if (!piiFound) {
      // Clean — safe to send as-is
      dispatchResend();
      return;
    }

    if (replacementText && replacementText !== rawText) {
      setPromptText(el, replacementText);

      // CRITICAL: verify the swap actually took effect — and STAYS in
      // effect — before letting the send proceed. Rich-text editors like
      // ChatGPT's (ProseMirror-based) maintain their own internal document
      // model. An immediate check right after execCommand can show the
      // replacement text in the DOM, but the editor's framework may then
      // asynchronously re-render and revert the DOM back to what ITS model
      // thinks the content is (the original, unredacted text) a moment
      // later. So we check twice: once immediately, and once again after
      // a short delay (giving any such re-render a chance to happen)
      // before we trust it enough to dispatch the send.
      const immediateMatch = getPromptText(el).trim() === replacementText.trim();

      if (immediateMatch) {
        await new Promise((resolve) => setTimeout(resolve, 120));
        const delayedMatch = getPromptText(el).trim() === replacementText.trim();

        if (delayedMatch) {
          window.dispatchEvent(new CustomEvent('safelens:notify', {
            detail: { status: 'success', message: 'Sensitive data replaced with a decoy before sending.' }
          }));
          dispatchResend();
          return;
        }

        console.warn(`[${EXT_NAME}] Prompt box reverted to original text after swap (editor re-render) - blocking send to avoid leaking real data.`);
      } else {
        console.warn(`[${EXT_NAME}] Text swap could not be verified - blocking send to avoid leaking real data.`);
      }
    }

    // No usable decoy text (legacy engine, or the swap failed) — block
    // the send rather than risk leaking the real value.
    window.dispatchEvent(new CustomEvent('safelens:notify', {
      detail: {
        status: 'error',
        message: 'Sensitive data detected (phone/email/etc.) - message blocked. Please remove it and resend.'
      }
    }));
  }

  document.addEventListener(
    'keydown',
    (e) => {
      if (bypassNextSubmit) { bypassNextSubmit = false; return; }
      if (e.key !== 'Enter' || e.shiftKey) return;

      const el = e.target;
      const isEditable = el && (el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (!isEditable) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      if (textCheckInFlight) return; // a check is already running, drop this extra Enter
      textCheckInFlight = true;

      scanAndSubmit(el, () => {
        bypassNextSubmit = true;
        el.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
          bubbles: true, cancelable: true
        }));
      }).finally(() => { textCheckInFlight = false; });
    },
    true // capture phase
  );

  document.addEventListener(
    'click',
    (e) => {
      if (bypassNextSubmit) { bypassNextSubmit = false; return; }

      const sendBtn = findSendButtonAncestor(e.target);
      if (!sendBtn) return;

      const el = findActivePromptBox();
      if (!el) return; // no prompt box found — let the click through as-is

      e.preventDefault();
      e.stopImmediatePropagation();

      if (textCheckInFlight) return;
      textCheckInFlight = true;

      scanAndSubmit(el, () => {
        bypassNextSubmit = true;
        sendBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }).finally(() => { textCheckInFlight = false; });
    },
    true // capture phase
  );

  function findActivePromptBox() {
    const active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || active.isContentEditable)) {
      return active;
    }
    const candidates = Array.from(document.querySelectorAll('textarea, [contenteditable="true"]'));
    return candidates.sort((a, b) => (b.offsetWidth * b.offsetHeight) - (a.offsetWidth * a.offsetHeight))[0] || null;
  }

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