/**
 * interceptor.js - SafeLens Ultimate (Maximum PII Shield Engine + Contextual AI Rules)
 * Fixed: Regex lastIndex resetting, React State Synchronization, Event Loop Guards.
 */

(function () {
  'use strict';

  const EXT_NAME = 'SafeLens Privacy Shield AI';
  let isRedacting = false;
  let isSubmitting = false;
  let bypassInterception = false;
  let isEvaluating = false;
  let activeOverlay = null;
  let activeDisabledBtn = null;
  let activeDisabledBtnPrevPointerEvents = '';

  let DYNAMIC_WHITELIST = ['localhost', '127.0.0.1', 'gov.in', 'nic.in', 'uidai.gov.in'];

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['customWhitelist', 'extensionPaused'], (result) => {
      if (result.customWhitelist && Array.isArray(result.customWhitelist)) {
        DYNAMIC_WHITELIST = Array.from(new Set([...DYNAMIC_WHITELIST, ...result.customWhitelist]));
      }
      if (result.extensionPaused === true) {
        window.SAFELENS_PAUSED = true;
      }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        if (changes.customWhitelist?.newValue) {
          DYNAMIC_WHITELIST = Array.from(new Set(['localhost', '127.0.0.1', 'gov.in', 'nic.in', 'uidai.gov.in', ...changes.customWhitelist.newValue]));
        }
        if (changes.extensionPaused !== undefined) {
          window.SAFELENS_PAUSED = changes.extensionPaused.newValue;
        }
      }
    });
  }

  function isDomainWhitelisted(url) {
    if (window.SAFELENS_PAUSED) return true;
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      const safeProductivity = ['whatsapp.com', 'linkedin.com', 'mail.google.com', 'docs.google.com', 'drive.google.com'];
      return DYNAMIC_WHITELIST.some(d => hostname === d || hostname.endsWith('.' + d)) ||
        safeProductivity.some(d => hostname === d || hostname.endsWith('.' + d));
    } catch (_) {
      return false;
    }
  }

  function isAIChatbot() {
    try {
      const hostname = window.location.hostname.toLowerCase();
      const knownAIBots = ['chatgpt.com', 'claude.ai', 'gemini.google.com', 'perplexity.ai', 'poe.com', 'grok.com', 'x.com', 'google.com'];

      if (hostname === 'www.google.com' && window.location.pathname === '/search') return true;
      if (knownAIBots.some(bot => hostname.includes(bot))) return true;

      const aiKeywords = ['chat', 'ai', 'bot', 'gpt', 'llm', 'assistant', 'copilot'];
      return hostname.split('.').some(part => aiKeywords.includes(part));
    } catch (e) {
      return false;
    }
  }

  // 🚀 Immediate Log on script execution
  if (isAIChatbot()) {
    console.log(`%c[${EXT_NAME}] AI chatbot detected`, 'color: #00ff00; font-weight: bold; font-size: 14px;');
  }

  function notifyUser(msg, type = 'warning') {
    try {
      console.log(`%c[${EXT_NAME}] ${msg}`, 'color: #00ff00; font-weight: bold; font-size: 14px;');
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        window.dispatchEvent(new CustomEvent('safelens:notify', { detail: { status: type, message: msg } }));
      }
    } catch (e) {
      console.warn(`[${EXT_NAME}] Extension context invalidated.`);
    }
  }

  // ==========================================
  // FACTORY REGEX GETTERS (Avoids State Mutation Issues)
  // ==========================================
  function createRegexes() {
    return {
      AADHAAR: /(?:^|[^\d])([2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4})(?:[^\d]|$)/g,
      CREDIT_CARD: /(?:^|[^\d])((?:\d[ -]*?){13,16})(?:[^\d]|$)/g,
      PAN: /(?:^|[^A-Z0-9])([A-Z]{5}[0-9]{4}[A-Z]{1})(?=[^A-Z0-9]|$)/gi,
      PASSPORT: /(?:^|[^A-Z0-9])([A-PR-WYA-Z][0-9]{7})(?=[^A-Z0-9]|$)/gi,
      VOTER_ID: /(?:^|[^A-Z0-9])([A-Z]{3}[0-9]{7})(?=[^A-Z0-9]|$)/gi,
      DRIVING_LICENSE: /(?:^|[^A-Z0-9])([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{11})(?=[^A-Z0-9]|$)/gi,
      IFSC: /(?:^|[^A-Z0-9])([A-Z]{4}0[A-Z0-9]{6})(?=[^A-Z0-9]|$)/gi,
      UPI_ID: /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/gi,
      PHONE: /(?:^|[^\d])(?:\+91[\s-]?)?([6-9]\d{9})(?:[^\d]|$)/g,
      EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
      API_KEY: /(?:key|token|secret|api[_\-]?key|aws[_\-]?access[_\-]?key[_\-]?id|aws[_\-]?secret[_\-]?access[_\-]?key)\s*[:=]\s*["']?[A-Za-z0-9\-_/+=]{16,}["']?|(?:pk|sk)_(?:test|live)_[0-9a-zA-Z]{24,}|(?:AKIA|ASIA)[0-9A-Z]{16}/gi,
      JWT: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
      PRIVATE_KEY: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi
    };
  }

  function mightContainPII(text) {
    if (!text || text.trim().length < 4) return false;

    // Broad pre-filter optimization: 
    // Only skip strings that have absolutely NO numbers, NO special characters (other than space), and NO capitalized words.
    if (/^[a-z\s]+$/.test(text)) {
      return false;
    }
    
    return true; // Forward all other non-empty chat submissions to the backend
  }

  function sanitizeTextLocally(text, decoy) {
    if (!text) return '';
    const r = createRegexes();

    return text
      .replace(r.AADHAAR, (m, g1) => m.replace(g1, decoy || '[Aadhaar Redacted]'))
      .replace(r.CREDIT_CARD, (m, g1) => m.replace(g1, decoy || '[REDACTED_CARD]'))
      .replace(r.PAN, (m, g1) => m.replace(g1, decoy || '[REDACTED_PAN]'))
      .replace(r.PASSPORT, (m, g1) => m.replace(g1, decoy || '[REDACTED_PASSPORT]'))
      .replace(r.VOTER_ID, (m, g1) => m.replace(g1, decoy || '[REDACTED_VOTER_ID]'))
      .replace(r.DRIVING_LICENSE, (m, g1) => m.replace(g1, decoy || '[REDACTED_DL]'))
      .replace(r.IFSC, (m, g1) => m.replace(g1, decoy || '[REDACTED_IFSC]'))
      .replace(r.UPI_ID, () => decoy || '[REDACTED_UPI_ID]')
      .replace(r.PHONE, (m, g1) => m.replace(g1, decoy || '[REDACTED_PHONE]'))
      .replace(r.EMAIL, () => decoy || '[REDACTED_EMAIL]')
      .replace(r.API_KEY, () => decoy || '[REDACTED_API_KEY]')
      .replace(r.JWT, () => decoy || '[REDACTED_JWT_TOKEN]')
      .replace(r.PRIVATE_KEY, () => decoy || '[REDACTED_PRIVATE_KEY]');
  }

  // ==========================================
  // DOM & ELEMENT HELPERS
  // ==========================================
  function getRootEditable(target, event) {
    let actualTarget = target;
    if (event && event.composedPath && event.composedPath().length > 0) {
      actualTarget = event.composedPath()[0];
    }
    if (!actualTarget) return null;
    if (actualTarget.tagName === 'TEXTAREA' || actualTarget.tagName === 'INPUT') return actualTarget;

    const editable = actualTarget.closest ? actualTarget.closest('[contenteditable="true"]') : null;
    if (editable) return editable;
    if (actualTarget.isContentEditable) return actualTarget;
    return null;
  }

  function findActiveInput() {
    const active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT' || active.isContentEditable)) {
      return active;
    }
    return document.querySelector('textarea, [contenteditable="true"], input[type="text"]');
  }

  function findSendButton(event) {
    const selectors = [
      'button[aria-label*="Send"]',
      'button[aria-label*="Grok"]',
      'button[aria-label*="Submit"]',
      'button[aria-label*="Search"]',
      'button[data-testid="send-button"]',
      'button[type="submit"]',
      'button.send-button'
    ];

    if (event && event.composedPath) {
      const path = event.composedPath();
      for (const el of path) {
        if (el && el.tagName === 'BUTTON') {
          for (const sel of selectors) {
            if (el.matches && el.matches(sel)) return el;
          }
        }
      }
    }

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function omniHydrateInput(inputEl, text) {
    if (!inputEl) return;
    inputEl.focus();

    const isMetaAI = window.location.hostname.includes('meta.ai');

    if (window.location.hostname.includes('gemini.google.com')) {
      const targetEl = inputEl.querySelector('[contenteditable="true"]') || inputEl;
      targetEl.focus();

      // 1. Select all content
      const selection = window.getSelection();
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(targetEl);
      selection.addRange(range);

      // 2. Overwrite via native execCommand
      document.execCommand('insertText', false, text);

      // 3. Dispatch input event to sync Gemini's state
      targetEl.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      
      return;
    }

    if (isMetaAI) {
      try {
        const targetEl = inputEl.querySelector('[contenteditable="true"]') || inputEl;
        targetEl.focus();

        // 1. Select all content natively
        const selection = window.getSelection();
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(targetEl);
        selection.addRange(range);

        // 2. Execute execCommand to replace selected range
        document.execCommand('delete', false, null);
        document.execCommand('insertText', false, text);

        // 3. Force React Fiber state update if available
        const reactKey = Object.keys(targetEl).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactProps$'));
        if (reactKey && targetEl[reactKey]) {
          const props = targetEl[reactKey].memoizedProps || targetEl[reactKey].pendingProps;
          if (props && typeof props.onChange === 'function') {
            props.onChange({ target: { value: text }, currentTarget: { value: text } });
          }
        }

        // 4. Dispatch single 'input' event to sync Slate AST
        targetEl.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        return;
      } catch (err) {
        console.error(`[${EXT_NAME}] Meta AI React Fiber Hydration Error:`, err);
      }
    }

    const isContentEditable = inputEl.getAttribute('contenteditable') === 'true' ||
                              inputEl.isContentEditable ||
                              inputEl.closest('.ProseMirror, [data-lexical-editor="true"], [contenteditable="true"], .slate-editor') !== null;

    if (isContentEditable) {
      // Dedicated Rich-Text Editor State Mutator (ProseMirror, Lexical, Slate.js)
      try {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(inputEl);
        selection.removeAllRanges();
        selection.addRange(range);

        let success = false;
        try {
          success = document.execCommand('insertText', false, text);
        } catch (_) {}

        if (!success) {
          try {
            const dt = new DataTransfer();
            dt.setData('text/plain', text);
            const pasteEvent = new ClipboardEvent('paste', {
              clipboardData: dt,
              bubbles: true,
              cancelable: true,
              composed: true
            });
            inputEl.dispatchEvent(pasteEvent);
          } catch (_) {
            inputEl.textContent = text;
          }
        }

        // Dispatch Framework Input Events to sync internal AST models
        inputEl.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertFromPaste', data: text, bubbles: true, composed: true }));
        inputEl.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: text, bubbles: true, composed: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      } catch (err) {
        console.error(`[${EXT_NAME}] Rich-Text Hydration Error:`, err);
        inputEl.textContent = text;
      }
    } else {
      // Standard Input / Textarea (React 18 Prototype Bypass)
      try {
        const isTextarea = inputEl.tagName === 'TEXTAREA';
        const proto = isTextarea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

        if (inputEl._valueTracker) {
          inputEl._valueTracker.setValue(text);
        }

        if (nativeSetter) {
          nativeSetter.call(inputEl, text);
        } else {
          inputEl.value = text;
        }

        inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, composed: true, inputType: 'insertText', data: text }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      } catch (_) {
        inputEl.value = text;
      }
    }
  }

  function findClickedSendButton(target, event) {
    if (!target) return null;

    // Check if target or any ancestor is a button matching send/submit criteria
    const selectors = [
      'button[aria-label*="Send" i]',
      'button[aria-label*="Grok" i]',
      'button[aria-label*="Submit" i]',
      'button[aria-label*="Search" i]',
      'button[data-testid*="send" i]',
      'button[data-testid*="submit" i]',
      'button[type="submit"]',
      'button.send-button',
      '[role="button"][aria-label*="Send" i]',
      '[role="button"][aria-label*="Submit" i]'
    ];

    let current = target;
    while (current && current !== document) {
      if (current.tagName === 'BUTTON' || current.getAttribute('role') === 'button') {
        for (const sel of selectors) {
          if (current.matches && current.matches(sel)) {
            return current;
          }
        }
        const lowerClass = (current.className || '').toString().toLowerCase();
        const lowerId = (current.id || '').toString().toLowerCase();
        if (lowerClass.includes('send') || lowerClass.includes('submit') || lowerId.includes('send') || lowerId.includes('submit')) {
          return current;
        }
        const form = current.closest('form');
        if (form) {
          const hasInput = form.querySelector('textarea, [contenteditable="true"]');
          if (hasInput && (current.tagName === 'BUTTON' || current.getAttribute('type') === 'submit')) {
            return current;
          }
        }
      }
      
      if (current.tagName === 'svg' || current.tagName === 'path') {
        const parentBtn = current.closest('button, [role="button"]');
        if (parentBtn) {
          return findClickedSendButton(parentBtn, event);
        }
      }

      current = current.parentElement;
    }

    return null;
  }

  function showOverlay(inputEl, sendBtn) {
    hideOverlay();
    if (!inputEl) return;

    const btn = sendBtn || findSendButton();
    if (btn) {
      activeDisabledBtn = btn;
      activeDisabledBtnPrevPointerEvents = btn.style.pointerEvents || '';
      btn.disabled = true;
      btn.style.pointerEvents = 'none';
    }

    const rect = inputEl.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.id = 'safelens-eval-overlay';

    Object.assign(overlay.style, {
      position: 'fixed',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: '999999',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      webkitBackdropFilter: 'blur(6px)',
      borderRadius: window.getComputedStyle(inputEl).borderRadius || '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      pointerEvents: 'all',
      boxSizing: 'border-box'
    });

    if (!document.getElementById('safelens-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'safelens-spinner-style';
      style.textContent = `
        @keyframes safelens-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    overlay.innerHTML = `
      <div style="
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid #38bdf8;
        border-radius: 50%;
        animation: safelens-spin 0.8s linear infinite;
      "></div>
      <span style="letter-spacing: 0.3px; color: #f8fafc;">Securing PII...</span>
    `;

    document.body.appendChild(overlay);
    activeOverlay = overlay;
  }

  function hideOverlay() {
    if (activeOverlay) {
      if (activeOverlay.parentNode) {
        activeOverlay.parentNode.removeChild(activeOverlay);
      }
      activeOverlay = null;
    }
    if (activeDisabledBtn) {
      activeDisabledBtn.disabled = false;
      activeDisabledBtn.style.pointerEvents = activeDisabledBtnPrevPointerEvents;
      activeDisabledBtn = null;
    }
  }

  async function executeFinalSubmission(inputEl, sendBtn) {
    hideOverlay();
    if (inputEl) inputEl.style.opacity = '1';

    // Settling delay tick: 200ms for Meta AI (Slate.js deep AST), 150ms for Gemini, 120ms for others
    const isMetaAI = window.location.hostname.includes('meta.ai');
    const isGemini = window.location.hostname.includes('gemini.google.com');
    const settlingDelay = isMetaAI ? 200 : (isGemini ? 150 : 120);
    await new Promise(r => setTimeout(r, settlingDelay));

    const freshBtn = findSendButton();
    const liveBtn = (freshBtn && freshBtn.isConnected) ? freshBtn : (sendBtn && sendBtn.isConnected ? sendBtn : null);

    bypassInterception = true;
    try {
      if (isMetaAI) {
        // For Meta AI: dispatch native Enter keydown on the active contenteditable
        // instead of clicking a potentially-disabled sendBtn
        const metaEditor = document.querySelector('[contenteditable="true"]') || inputEl;
        await new Promise(r => setTimeout(r, 250));
        metaEditor.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
          bubbles: true, cancelable: true, composed: true
        }));
      } else if (liveBtn && typeof liveBtn.click === 'function' && !liveBtn.disabled) {
        liveBtn.click();
      } else if (inputEl) {
        inputEl.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
          bubbles: true, cancelable: true, composed: true
        }));
      }
    } finally {
      setTimeout(() => {
        bypassInterception = false;
        isSubmitting = false;
        isRedacting = false;
        isEvaluating = false;
        hideOverlay();
      }, 100);
    }
  }

  // ==========================================
  // UNIFIED INTENT-TO-SUBMIT HANDLER
  // ==========================================
  function handleSubmissionIntent(e, inputEl, sendBtn) {
    if (window.SAFELENS_PAUSED || isDomainWhitelisted(window.location.href) || !isAIChatbot()) return;
    if (!inputEl) return;

    if (isSubmitting || isEvaluating) return;

    const rawText = (inputEl.value !== undefined ? inputEl.value : inputEl.innerText) || inputEl.textContent || '';
    if (!rawText || !rawText.trim()) return;

    // IMMEDIATE CAPTURE-PHASE HIJACKING
    e.preventDefault();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    if (e.stopPropagation) e.stopPropagation();

    console.log("[SafeLens Debug] handleSubmissionIntent triggered with rawText:", rawText);

    // 1. Immediate Synchronous Local Redaction (Zero Lag)
    let sanitized = sanitizeTextLocally(rawText);
    const locallyRedacted = (sanitized !== rawText);

    if (locallyRedacted) {
      omniHydrateInput(inputEl, sanitized);
      notifyUser('SafeLens AI Shield: Sensitive Data Redacted!', 'success');
    }

    const needsGLiNER = locallyRedacted || mightContainPII(rawText);
    if (!needsGLiNER) {
      // No local PII and no contextual keywords, proceed naturally
      executeFinalSubmission(inputEl, sendBtn);
      return;
    }

    isSubmitting = true;
    isRedacting = true;
    isEvaluating = true;
    showOverlay(inputEl, sendBtn);

    // 2. Background Async GLiNER Verification
    const payload = { text: sanitized };
    console.log("[SafeLens Debug] Sending payload to backend GLiNER...", payload);

    let hasResponded = false;

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      const fallbackTimer = setTimeout(() => {
        try {
          if (!hasResponded) {
            hasResponded = true;
            console.warn("[SafeLens Debug] GLiNER backend request timed out. Proceeding with submission...");
          }
        } finally {
          if (hasResponded) executeFinalSubmission(inputEl, sendBtn);
        }
      }, 3000);

      try {
        chrome.runtime.sendMessage({
          action: 'PROCESS_TEXT_FORM',
          payload: payload
        }, (response) => {
          try {
            if (hasResponded) return;
            hasResponded = true;
            clearTimeout(fallbackTimer);

            console.log("[SafeLens Debug] Received GLiNER Response:", response);

            if (!chrome.runtime.lastError && response && response.sanitized_text) {
              sanitized = response.sanitized_text;
              omniHydrateInput(inputEl, sanitized);
              console.log(`[${EXT_NAME}] GLiNER AI Server Evaluated Text:`, sanitized);
            }
          } finally {
            executeFinalSubmission(inputEl, sendBtn);
          }
        });
      } catch (err) {
        console.error("SafeLens Error:", err);
        if (!hasResponded) {
           hasResponded = true;
           clearTimeout(fallbackTimer);
           executeFinalSubmission(inputEl, sendBtn);
        }
      }
    } else {
      executeFinalSubmission(inputEl, sendBtn);
    }
  }

  function handleKeydownEvent(e) {
    if (bypassInterception) return;
    if (e.key !== 'Enter' || e.shiftKey) return;

    if (isSubmitting || isRedacting || isEvaluating) {
      e.preventDefault();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      return;
    }

    const rootEditable = getRootEditable(e.target, e);
    if (rootEditable) {
      handleSubmissionIntent(e, rootEditable, null);
    }
  }

  function handleKeyupAndPress(e) {
    if (bypassInterception) return;
    if (e.key === 'Enter' && (isRedacting || isSubmitting || isEvaluating)) {
      e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
  }

  function handlePointerClickEvent(e) {
    if (bypassInterception) return;

    const clickedSendBtn = findClickedSendButton(e.target, e);
    if (clickedSendBtn) {
      if (isSubmitting || isRedacting || isEvaluating) {
        e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        return;
      }

      const activeInput = findActiveInput();
      if (activeInput) {
        const rawText = (activeInput.value !== undefined ? activeInput.value : activeInput.innerText) || activeInput.textContent || '';
        if (rawText && rawText.trim()) {
          handleSubmissionIntent(e, activeInput, clickedSendBtn);
        }
      }
    }
  }

  // Helper Functions & Image Handlers remain intact...
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function getImageDimensions(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }

  function containsPIIText(text) {
    if (!text) return false;
    const t = text.toUpperCase();
    const keywords = ['AADHAAR', 'INCOME TAX', 'PERMANENT', 'DOB', 'GOVT', 'GOVERNMENT', 'CREDIT', 'DEBIT', 'MASTERCARD', 'VISA', 'ELECTION', 'SIGNATURE', 'PASSPORT', 'VOTER'];
    if (keywords.some(k => t.includes(k))) return true;
    return mightContainPII(text);
  }

  function createRedactedImage(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = '#000000';

        const boxWidth = Math.floor(canvas.width * 0.75);
        const boxHeight = Math.max(32, Math.floor(canvas.height * 0.085));
        const startX = (canvas.width - boxWidth) / 2;

        const y1 = Math.floor(canvas.height * 0.62);
        ctx.fillRect(startX, y1, boxWidth, boxHeight);

        const y2 = Math.floor(canvas.height * 0.42);
        ctx.fillRect(startX, y2, boxWidth, boxHeight);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.max(14, Math.floor(boxHeight * 0.38))}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('████ [CONFIDENTIAL PII REDACTED] ████', canvas.width / 2, y1 + boxHeight / 2);
        ctx.fillText('████ [CONFIDENTIAL PII REDACTED] ████', canvas.width / 2, y2 + boxHeight / 2);

        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.55)';
        const fontSize = Math.max(26, Math.floor(canvas.width / 12));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6);
        ctx.fillText('SAFELENS DECOY - PII PROTECTED', 0, 0);
        ctx.restore();

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          const redactedFile = new File([blob], `redacted_${file.name}`, { type: file.type || 'image/png' });
          resolve(redactedFile);
        }, file.type || 'image/png');
      };
      img.src = url;
    });
  }

  async function handleFile(file, inputEl) {
    console.log(`[${EXT_NAME}] Scanning file "${file.name}" for PII...`);
    const dataUrl = await fileToDataURL(file);

    chrome.runtime.sendMessage(
      { action: 'PROCESS_UPLOAD', payload: { fileDataUrl: dataUrl, targetUrl: window.location.href } },
      async (response) => {
        let isPiiDetected = false;

        if (chrome.runtime.lastError) {
          console.warn(`[${EXT_NAME}] Backend unreachable. Falling back to Client-Side Heuristics...`);
        } else if (response) {
          if (response.redaction_applied === true || response.decoy_applied === true || response.status === 'DECOYED' || response.pii_found === true) {
            isPiiDetected = true;
          }
          if (response.extractedText && containsPIIText(response.extractedText)) isPiiDetected = true;
          if (response.pii_boxes && response.pii_boxes.length > 0) isPiiDetected = true;
        }

        const filename = file.name.toLowerCase();
        const sensitiveKeywords = ['aadhaar', 'aadhar', 'pan', 'card', 'credit', 'debit', 'id', 'passport', 'voter', 'license', 'tax', 'kyc'];
        if (sensitiveKeywords.some(kw => filename.includes(kw))) {
          isPiiDetected = true;
        }

        if (!isPiiDetected) {
          const safeKeywords = ['book', 'index', 'page', 'nature', 'selfie', 'profile'];
          if (!safeKeywords.some(kw => filename.includes(kw))) {
            const dims = await getImageDimensions(file);
            const aspectRatio = dims.width / dims.height;

            if (aspectRatio >= 1.3 && aspectRatio <= 1.9) {
              isPiiDetected = true;
            }
          }
        }

        const dataTransfer = new DataTransfer();

        if (!isPiiDetected) {
          dataTransfer.items.add(file);
          inputEl.dataset.safelensBypass = 'true';
          inputEl.files = dataTransfer.files;

          window.dispatchEvent(new CustomEvent('safelens:notify', {
            detail: { status: 'success', message: 'Image scanned: No sensitive PII. Upload allowed.' }
          }));
        } else {
          const redactedFile = await createRedactedImage(file);
          dataTransfer.items.add(redactedFile);
          inputEl.dataset.safelensBypass = 'true';
          inputEl.files = dataTransfer.files;

          window.dispatchEvent(new CustomEvent('safelens:notify', {
            detail: { status: 'success', message: 'Sensitive PII detected! Image auto-protected & redacted.' }
          }));
        }

        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
    );
  }

  async function handleFormSubmit(e) {
    if (isEvaluating || isSubmitting || isRedacting) {
      e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      return;
    }
    if (window.SAFELENS_PAUSED || isDomainWhitelisted(window.location.href)) return;
    if (e.target.tagName !== 'FORM') return;
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const formPayload = Object.fromEntries(formData.entries());

    chrome.runtime.sendMessage(
      { action: 'PROCESS_TEXT_FORM', payload: formPayload },
      (response) => {
        if (chrome.runtime.lastError) return;

        const isSuccess = response && (
          response.status === 'success' || response.status === 'SUCCESS' || response.status === 'DECOYED' || response.decoy_applied !== undefined || response.success === true
        );

        window.dispatchEvent(new CustomEvent('safelens:notify', {
          detail: {
            status: isSuccess ? 'success' : 'error',
            message: isSuccess ? 'Sensitive Form Data Swapped with Synthetic Decoy!' : 'Form Protection failed.'
          }
        }));
      }
    );
  }

  function initGeminiListener() {
    window.addEventListener('SAFELENS_FETCH_REQ', (e) => {
      const originalBody = e.detail?.body;
      if (!originalBody) return;

      try {
        const params = new URLSearchParams(originalBody);
        let freq = params.get('f.req');

        if (freq && mightContainPII(freq)) {
          const sanitizedFreq = sanitizeTextLocally(freq);
          if (sanitizedFreq !== freq) {
            params.set('f.req', sanitizedFreq);
            notifyUser('SafeLens: Network Payload Intercepted & PII Redacted!', 'success');
            window.dispatchEvent(new CustomEvent('SAFELENS_FETCH_RES', { detail: { body: params.toString() } }));
            return;
          }
        }
      } catch (err) {
        console.error(`[${EXT_NAME}] Payload Parsing Error:`, err);
      }
      window.dispatchEvent(new CustomEvent('SAFELENS_FETCH_RES', { detail: { body: originalBody } }));
    });
  }

  function initInterceptors() {
    // Note: AI chatbot detection is logged on script load (line 66)

    document.addEventListener('keydown', handleKeydownEvent, { capture: true, passive: false });
    document.addEventListener('keypress', handleKeyupAndPress, { capture: true, passive: false });
    document.addEventListener('keyup', handleKeyupAndPress, { capture: true, passive: false });
    document.addEventListener('mousedown', handlePointerClickEvent, { capture: true, passive: false });
    document.addEventListener('pointerdown', handlePointerClickEvent, { capture: true, passive: false });
    document.addEventListener('click', handlePointerClickEvent, { capture: true, passive: false });

    document.addEventListener('submit', handleFormSubmit, { capture: true, passive: false });
    document.addEventListener('change', (e) => {
      if (e.target.tagName === 'INPUT' && e.target.type === 'file') {
        if (window.SAFELENS_PAUSED || isDomainWhitelisted(window.location.href)) return;

        if (e.target.dataset.safelensBypass === 'true') {
          e.target.dataset.safelensBypass = 'false';
          return;
        }

        const files = e.target.files;
        if (files && files.length > 0 && files[0].type.startsWith('image/')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();

          handleFile(files[0], e.target);
        }
      }
    }, true);

    if (isAIChatbot() && window.location.hostname.includes('gemini.google.com')) {
      initGeminiListener();
    }
  }

  const observer = new MutationObserver(() => {
    if (isAIChatbot() && !window.safelensInitialized) {
      window.safelensInitialized = true;
      initInterceptors();
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (!window.safelensInitialized) {
    window.safelensInitialized = true;
    initInterceptors();
  }
})();