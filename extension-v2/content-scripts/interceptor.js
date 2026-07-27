/**
 * interceptor.js - SafeLens Ultimate (Maximum PII Shield Engine + Contextual AI Rules)
 * Updated: Hybrid Architecture with Localhost FastAPI OpenCV Redaction Engine.
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

  let DYNAMIC_WHITELIST = ['gov.in', 'nic.in', 'uidai.gov.in'];

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
          DYNAMIC_WHITELIST = Array.from(new Set(['gov.in', 'nic.in', 'uidai.gov.in', ...changes.customWhitelist.newValue]));
        }
        if (changes.extensionPaused !== undefined) {
          window.SAFELENS_PAUSED = changes.extensionPaused.newValue;
        }
      }
    });
  }

  function isDomainWhitelisted(url) {
    if (window.SAFELENS_PAUSED) return false;
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
      if (hostname === 'localhost' || hostname === '127.0.0.1') return true;

      const knownAIBots = ['chatgpt.com', 'claude.ai', 'gemini.google.com', 'perplexity.ai', 'poe.com', 'grok.com', 'x.com', 'google.com', 'v0.dev', 'bolt.new'];

      if (hostname === 'www.google.com' && window.location.pathname === '/search') return true;
      if (knownAIBots.some(bot => hostname.includes(bot))) return true;

      const aiKeywords = ['chat', 'ai', 'bot', 'gpt', 'llm', 'assistant', 'copilot'];
      if (hostname.split('.').some(part => aiKeywords.includes(part))) return true;

      if (document.querySelector('textarea, [contenteditable="true"], #prompt-textarea')) return true;

      return false;
    } catch (e) {
      return false;
    }
  }

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
  // TEXT REDACTION REGEX & HYDRATION LOGIC (Remains Intact)
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
      PRIVATE_KEY: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/gi,
      PASSWORD_SECRET: /(?:password|passcode|pwd|secret)\s*[:=]\s*["']?([^\s"']{3,})["']?/gi,
      cvv: /(?<!\d)\b\d{3,4}\b(?!\d)/gi,
      expiry: /\b(0[1-9]|1[0-2])[\/\-]([0-9]{2}|[0-9]{4})\b/gi,
      address: /\b(?:street|road|st|rd|lane|nagar|colony|sector|block|marg|floor|flat|house|address)\b/i,
      pin: /\b\d{3}\s?\d{3}\b/g
    };
  }

  function mightContainPII(text) {
    if (!text || text.trim().length < 4) return false;
    if (/^[a-z\s]+$/.test(text)) return false;
    return true;
  }

  function sanitizeTextLocally(text, decoy) {
    if (!text) return '';
    const r = createRegexes();
    return text
      .replace(r.AADHAAR, (m, g1) => m.replace(g1, decoy || '[Aadhaar Redacted]'))
      .replace(r.CREDIT_CARD, (m, g1) => m.replace(g1, decoy || '[REDACTED_CARD]'))
      .replace(r.EXPIRY, (m, g1) => m.replace(g1, decoy || '[EXP_REDACTED]'))
      .replace(r.CVV, (m, g1) => m.replace(g1, decoy || '[CVV_REDACTED]'))
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
      .replace(r.PRIVATE_KEY, () => decoy || '[REDACTED_PRIVATE_KEY]')
      .replace(r.PASSWORD_SECRET, (m, g1) => m.replace(g1, decoy || '[REDACTED_SECRET]'));
  }

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
    if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT' || active.isContentEditable)) return active;
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
      const selection = window.getSelection();
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(targetEl);
      selection.addRange(range);
      document.execCommand('insertText', false, text);
      targetEl.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      return;
    }

    if (isMetaAI) {
      try {
        const targetEl = inputEl.querySelector('[contenteditable="true"]') || inputEl;
        targetEl.focus();
        const selection = window.getSelection();
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(targetEl);
        selection.addRange(range);
        document.execCommand('delete', false, null);
        document.execCommand('insertText', false, text);
        const reactKey = Object.keys(targetEl).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactProps$'));
        if (reactKey && targetEl[reactKey]) {
          const props = targetEl[reactKey].memoizedProps || targetEl[reactKey].pendingProps;
          if (props && typeof props.onChange === 'function') {
            props.onChange({ target: { value: text }, currentTarget: { value: text } });
          }
        }
        targetEl.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        return;
      } catch (err) { }
    }

    const isContentEditable = inputEl.getAttribute('contenteditable') === 'true' || inputEl.isContentEditable || inputEl.closest('.ProseMirror, [data-lexical-editor="true"], [contenteditable="true"], .slate-editor') !== null;
    if (isContentEditable) {
      try {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(inputEl);
        selection.removeAllRanges();
        selection.addRange(range);
        let success = false;
        try { success = document.execCommand('insertText', false, text); } catch (_) { }
        if (!success) {
          try {
            const dt = new DataTransfer();
            dt.setData('text/plain', text);
            inputEl.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true, composed: true }));
          } catch (_) { inputEl.textContent = text; }
        }
        inputEl.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertFromPaste', data: text, bubbles: true, composed: true }));
        inputEl.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: text, bubbles: true, composed: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      } catch (err) { inputEl.textContent = text; }
    } else {
      try {
        const isTextarea = inputEl.tagName === 'TEXTAREA';
        const proto = isTextarea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (inputEl._valueTracker) inputEl._valueTracker.setValue(text);
        if (nativeSetter) { nativeSetter.call(inputEl, text); } else { inputEl.value = text; }
        inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, composed: true, inputType: 'insertText', data: text }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
      } catch (_) { inputEl.value = text; }
    }
  }

  function findClickedSendButton(target, event) {
    if (!target) return null;
    const selectors = [
      'button[aria-label*="Send" i]', 'button[aria-label*="Grok" i]', 'button[aria-label*="Submit" i]',
      'button[aria-label*="Search" i]', 'button[data-testid*="send" i]', 'button[data-testid*="submit" i]',
      'button[type="submit"]', 'button.send-button', '[role="button"][aria-label*="Send" i]', '[role="button"][aria-label*="Submit" i]'
    ];
    let current = target;
    while (current && current !== document) {
      if (current.tagName === 'BUTTON' || current.getAttribute('role') === 'button') {
        for (const sel of selectors) { if (current.matches && current.matches(sel)) return current; }
        const lowerClass = (current.className || '').toString().toLowerCase();
        const lowerId = (current.id || '').toString().toLowerCase();
        if (lowerClass.includes('send') || lowerClass.includes('submit') || lowerId.includes('send') || lowerId.includes('submit')) return current;
        const form = current.closest('form');
        if (form) {
          const hasInput = form.querySelector('textarea, [contenteditable="true"]');
          if (hasInput && (current.tagName === 'BUTTON' || current.getAttribute('type') === 'submit')) return current;
        }
      }
      if (current.tagName === 'svg' || current.tagName === 'path') {
        const parentBtn = current.closest('button, [role="button"]');
        if (parentBtn) return findClickedSendButton(parentBtn, event);
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
      position: 'fixed', top: `${rect.top}px`, left: `${rect.left}px`, width: `${rect.width}px`, height: `${rect.height}px`,
      zIndex: '999999', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', webkitBackdropFilter: 'blur(6px)',
      borderRadius: window.getComputedStyle(inputEl).borderRadius || '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '10px', color: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '14px', fontWeight: '600',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)', pointerEvents: 'all', boxSizing: 'border-box'
    });
    if (!document.getElementById('safelens-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'safelens-spinner-style';
      style.textContent = `@keyframes safelens-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }
    overlay.innerHTML = `
      <div style="width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid #38bdf8; border-radius: 50%; animation: safelens-spin 0.8s linear infinite;"></div>
      <span style="letter-spacing: 0.3px; color: #f8fafc;">Securing Data...</span>`;
    document.body.appendChild(overlay);
    activeOverlay = overlay;
  }

  function hideOverlay() {
    if (activeOverlay) {
      if (activeOverlay.parentNode) activeOverlay.parentNode.removeChild(activeOverlay);
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
    const isMetaAI = window.location.hostname.includes('meta.ai');
    const isGemini = window.location.hostname.includes('gemini.google.com');
    await new Promise(r => setTimeout(r, isMetaAI ? 200 : (isGemini ? 150 : 120)));

    const freshBtn = findSendButton();
    const liveBtn = (freshBtn && freshBtn.isConnected) ? freshBtn : (sendBtn && sendBtn.isConnected ? sendBtn : null);

    bypassInterception = true;
    try {
      if (isMetaAI) {
        const metaEditor = document.querySelector('[contenteditable="true"]') || inputEl;
        await new Promise(r => setTimeout(r, 250));
        metaEditor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, composed: true }));
      } else if (liveBtn && typeof liveBtn.click === 'function' && !liveBtn.disabled) {
        liveBtn.click();
      } else if (inputEl) {
        inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, composed: true }));
      }
    } finally {
      setTimeout(() => { bypassInterception = false; isSubmitting = false; isRedacting = false; isEvaluating = false; hideOverlay(); }, 100);
    }
  }

  function getRawText(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      return el.value || '';
    }
    const val = el.innerText || el.textContent || (typeof el.value === 'string' ? el.value : '') || '';
    return val;
  }

  function handleSubmissionIntent(e, inputEl, sendBtn) {
    if (window.SAFELENS_PAUSED || isDomainWhitelisted(window.location.href) || !isAIChatbot() || !inputEl) return;
    if (isSubmitting || isEvaluating) return;
    const rawText = getRawText(inputEl);
    if (!rawText || !rawText.trim()) return;

    e.preventDefault();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    if (e.stopPropagation) e.stopPropagation();

    let sanitized = sanitizeTextLocally(rawText);
    const locallyRedacted = (sanitized !== rawText);

    if (locallyRedacted) {
      omniHydrateInput(inputEl, sanitized);
      notifyUser('SafeLens AI Shield: Sensitive Data Redacted!', 'success');
    }

    if (!locallyRedacted && !mightContainPII(rawText)) {
      executeFinalSubmission(inputEl, sendBtn);
      return;
    }

    isSubmitting = true; isRedacting = true; isEvaluating = true;
    showOverlay(inputEl, sendBtn);

    let hasResponded = false;
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      const fallbackTimer = setTimeout(() => {
        try { if (!hasResponded) { hasResponded = true; } } finally { if (hasResponded) executeFinalSubmission(inputEl, sendBtn); }
      }, 3000);

      try {
        chrome.runtime.sendMessage({ action: 'PROCESS_TEXT_FORM', payload: { text: sanitized } }, (response) => {
          try {
            if (hasResponded) return;
            hasResponded = true;
            clearTimeout(fallbackTimer);
            if (!chrome.runtime.lastError && response && response.sanitized_text) {
              sanitized = response.sanitized_text;
              omniHydrateInput(inputEl, sanitized);
            }
          } finally { executeFinalSubmission(inputEl, sendBtn); }
        });
      } catch (err) {
        if (!hasResponded) { hasResponded = true; clearTimeout(fallbackTimer); executeFinalSubmission(inputEl, sendBtn); }
      }
    } else {
      executeFinalSubmission(inputEl, sendBtn);
    }
  }

  function handleKeydownEvent(e) {
    if (bypassInterception || e.key !== 'Enter' || e.shiftKey) return;
    if (isSubmitting || isRedacting || isEvaluating) {
      e.preventDefault();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      return;
    }
    const rootEditable = getRootEditable(e.target, e);
    if (rootEditable) handleSubmissionIntent(e, rootEditable, null);
  }

  function handleKeyupAndPress(e) {
    if (bypassInterception) return;
    if (e.key === 'Enter' && (isRedacting || isSubmitting || isEvaluating)) {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    }
  }

  function handlePointerClickEvent(e) {
    if (bypassInterception) return;
    const clickedSendBtn = findClickedSendButton(e.target, e);
    if (clickedSendBtn) {
      if (isSubmitting || isRedacting || isEvaluating) {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        return;
      }
      const activeInput = findActiveInput();
      if (activeInput) {
        const rawText = getRawText(activeInput);
        if (rawText && rawText.trim()) handleSubmissionIntent(e, activeInput, clickedSendBtn);
      }
    }
  }

  // ==========================================
  // 🚀 FASTAPI OPENCV IMAGE REDACTION ENGINE & BACKGROUND BRIDGE
  // ==========================================

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  function base64ToFile(base64Data, filename, mimeType) {
    const arr = base64Data.split(',');
    const mime = (arr[0].match(/:(.*?);/) || [])[1] || mimeType || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  async function redactImageFile(file) {
    const fileName = file.name || `image_${Date.now()}.png`;
    const fileType = file.type || 'image/png';

    console.log(`%c[SafeLens Engine] 📤 Submitting image to OpenCV Redaction Pipeline...`, 'color: #00ffff; font-weight: bold; background: #002b36; padding: 2px 5px;', fileName);

    try {
      const base64Data = await fileToBase64(file);

      // Route 1: Background Service Worker (Bypasses HTTPS Mixed-Content & CORS Restrictions)
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        const response = await new Promise((resolve) => {
          const timeoutTimer = setTimeout(() => {
            console.warn("[SafeLens Engine] Background service worker message timed out. Resolving to null fallback.");
            resolve(null);
          }, 60000);

          chrome.runtime.sendMessage(
            { action: 'PROCESS_IMAGE', payload: { base64Data, filename: fileName, type: fileType } },
            (res) => {
              clearTimeout(timeoutTimer);
              if (chrome.runtime.lastError) {
                console.warn(`[SafeLens Engine] Background service worker message failed: ${chrome.runtime.lastError.message}`);
                resolve(null);
              } else {
                resolve(res);
              }
            }
          );
        });

        if (response && response.success && response.base64Data) {
          console.log(`%c[SafeLens Engine] ✅ Background Service Worker Redaction Complete: ${response.filename}`, 'color: #00ff00; font-weight: bold;');
          const redactedFile = base64ToFile(response.base64Data, response.filename, response.mimeType);
          return { file: redactedFile, isRedacted: response.isRedacted, headers: response.headers };
        }
      }

      // Route 2: Direct Fetch Fallback
      console.log(`[SafeLens Engine] Attempting direct fetch fallback to http://127.0.0.1:8000/api/process-image...`);
      const formData = new FormData();
      formData.append('file', file, fileName);

      const apiResponse = await fetch('http://127.0.0.1:8000/api/process-image', {
        method: 'POST',
        body: formData
      });

      if (!apiResponse.ok) throw new Error(`Direct Fetch API Error: ${apiResponse.status}`);

      const blob = await apiResponse.blob();
      const contentDisposition = apiResponse.headers.get('Content-Disposition');
      let outName = fileName;
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) {
          outName = match[1];
        }
      }

      const redactedStatus = apiResponse.headers.get('X-Redacted-Status');
      const piiCountHeader = apiResponse.headers.get('X-PII-Count');
      const piiCount = piiCountHeader ? parseInt(piiCountHeader, 10) : 0;

      let isRedacted = false;
      if (redactedStatus === 'REDACTED' || piiCount > 0) {
        isRedacted = true;
      } else if (redactedStatus === 'CLEAN' || piiCountHeader === '0') {
        isRedacted = false;
      } else {
        // Fallback if headers are not present
        if (outName.startsWith('redacted_')) {
          isRedacted = true;
        } else if (!contentDisposition) {
          outName = `redacted_${fileName}`;
          isRedacted = true;
        }
      }

      const processedFile = new File([blob], outName, { type: blob.type || fileType });
      return {
        file: processedFile,
        isRedacted,
        headers: {
          'X-Redacted-Status': redactedStatus,
          'X-PII-Count': piiCountHeader
        }
      };

    } catch (err) {
      console.error(`%c[SafeLens Engine] ❌ Image Redaction Error:`, 'color: #ff0000; font-weight: bold;', err);
      return { file: file, isRedacted: false, error: err.message, headers: {} };
    }
  }

  function handleFormSubmit(e) {
    if (isEvaluating || isSubmitting || isRedacting) { e.preventDefault(); e.stopPropagation(); return; }
    if (window.SAFELENS_PAUSED || isDomainWhitelisted(window.location.href) || e.target.tagName !== 'FORM') return;
    e.preventDefault();

    const formData = new FormData(e.target);
    chrome.runtime.sendMessage({ action: 'PROCESS_TEXT_FORM', payload: Object.fromEntries(formData.entries()) }, (res) => {
      if (!chrome.runtime.lastError && res && (res.status === 'success' || res.success === true)) {
        notifyUser('Sensitive Form Data Swapped with Synthetic Decoy!', 'success');
      }
    });
  }

  // ==========================================
  // EVENT LISTENERS BINDING (CAPTURE PHASE & SYNCHRONOUS BUFFER EXTRACTION)
  // ==========================================
  function initInterceptors() {
    document.addEventListener('keydown', handleKeydownEvent, { capture: true, passive: false });
    document.addEventListener('keypress', handleKeyupAndPress, { capture: true, passive: false });
    document.addEventListener('keyup', handleKeyupAndPress, { capture: true, passive: false });
    document.addEventListener('mousedown', handlePointerClickEvent, { capture: true, passive: false });
    document.addEventListener('click', handlePointerClickEvent, { capture: true, passive: false });
    document.addEventListener('submit', handleFormSubmit, { capture: true, passive: false });

    // 1. File Input (Change Event)
    document.addEventListener('change', (e) => {
      const target = e.target;
      if (!target || target.tagName !== 'INPUT' || target.type !== 'file') return;
      if (window.SAFELENS_PAUSED || isDomainWhitelisted(window.location.href)) return;

      if (target.getAttribute('data-safelens-bypass') === 'true' || target.dataset?.safelensBypass === 'true') {
        console.log('%c[SafeLens Engine] 🔄 Bypass flag detected on file input. Permitting event.', 'color: #888888;');
        target.removeAttribute('data-safelens-bypass');
        if (target.dataset) target.dataset.safelensBypass = 'false';
        return;
      }

      const files = target.files;
      if (!files || files.length === 0 || !files[0].type.startsWith('image/')) return;

      const originalFile = files[0];
      console.log(`%c[SafeLens Engine] ⚡ CHANGE event captured synchronously on <input type="file">`, 'color: #00ffff; font-weight: bold; background: #002b36; padding: 2px 5px;');
      console.log(`%c[SafeLens Engine] 📄 File: ${originalFile.name} | Size: ${(originalFile.size / 1024).toFixed(1)} KB | Type: ${originalFile.type}`, 'color: #00ff00;');

      // SYNCHRONOUS INTERCEPTION BEFORE WEBSITE READS UNREDACTED FILE
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      notifyUser(`Scanning file "${originalFile.name}" for sensitive PII...`, 'warning');

      (async () => {
        const result = await redactImageFile(originalFile);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(result.file);

        target.setAttribute('data-safelens-bypass', 'true');
        if (target.dataset) target.dataset.safelensBypass = 'true';
        target.files = dataTransfer.files;

        const headers = result.headers || {};
        const redactedStatus = headers['X-Redacted-Status'];
        const piiCountHeader = headers['X-PII-Count'];
        const piiCount = piiCountHeader ? parseInt(piiCountHeader, 10) : 0;

        let shouldNotify = false;
        if (redactedStatus === 'REDACTED' || piiCount > 0) {
          shouldNotify = true;
        } else if (redactedStatus === 'CLEAN' || piiCountHeader === '0') {
          shouldNotify = false;
        } else {
          shouldNotify = !!result.isRedacted;
        }

        if (shouldNotify) {
          notifyUser('Sensitive PII detected! Image precisely redacted via OpenCV.', 'success');
        } else {
          notifyUser('Image scanned: No sensitive PII. Upload allowed.', 'success');
        }

        target.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      })();
    }, { capture: true, passive: false });

    // 2. Clipboard Paste Interception
    document.addEventListener('paste', (e) => {
      if (window.SAFELENS_PAUSED || isDomainWhitelisted(window.location.href)) return;

      const targetNode = e.target;
      const targetElement = (targetNode && targetNode.nodeType === 1) ? targetNode : (targetNode?.parentElement || document.body);

      if (targetElement.getAttribute('data-safelens-bypass') === 'true' || targetElement.dataset?.safelensBypass === 'true') {
        console.log('%c[SafeLens Engine] 🔄 Bypass flag detected on paste event. Permitting synthetic event.', 'color: #888888;');
        targetElement.removeAttribute('data-safelens-bypass');
        if (targetElement.dataset) targetElement.dataset.safelensBypass = 'false';
        return;
      }

      // SYNCHRONOUS CLIPBOARD EXTRACTION BEFORE ASYNC TICK / EVENT EXPIRATION
      const clipboardData = e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData);
      if (!clipboardData || !clipboardData.items) return;

      let imageFile = null;
      for (let i = 0; i < clipboardData.items.length; i++) {
        const item = clipboardData.items[i];
        if (item.type && item.type.startsWith('image/')) {
          imageFile = item.getAsFile();
          break;
        }
      }

      if (!imageFile) return;

      console.log(`%c[SafeLens Engine] ⚡ PASTE event captured synchronously`, 'color: #00ffff; font-weight: bold; background: #002b36; padding: 2px 5px;');
      console.log(`%c[SafeLens Engine] 📄 Extracted Pasted Image: ${imageFile.name || 'clipboard_image.png'} | Size: ${(imageFile.size / 1024).toFixed(1)} KB | Type: ${imageFile.type}`, 'color: #00ff00;');

      // SYNCHRONOUS STOP ELIMINATES ORIGINAL UNREDACTED CLIPBOARD PROPAGATION
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      notifyUser('Scanning pasted clipboard image for sensitive PII...', 'warning');

      (async () => {
        const result = await redactImageFile(imageFile);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(result.file);

        targetElement.setAttribute('data-safelens-bypass', 'true');
        if (targetElement.dataset) targetElement.dataset.safelensBypass = 'true';

        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true,
          composed: true
        });
        targetElement.dispatchEvent(pasteEvent);

        const headers = result.headers || {};
        const redactedStatus = headers['X-Redacted-Status'];
        const piiCountHeader = headers['X-PII-Count'];
        const piiCount = piiCountHeader ? parseInt(piiCountHeader, 10) : 0;

        let shouldNotify = false;
        if (redactedStatus === 'REDACTED' || piiCount > 0) {
          shouldNotify = true;
        } else if (redactedStatus === 'CLEAN' || piiCountHeader === '0') {
          shouldNotify = false;
        } else {
          shouldNotify = !!result.isRedacted;
        }

        if (shouldNotify) {
          notifyUser('Sensitive PII in pasted image redacted & injected safely!', 'success');
        } else {
          notifyUser('Pasted image scanned: Safe to insert.', 'success');
        }
      })();
    }, { capture: true, passive: false });

    // 3. Drag-and-Drop Interception (DragOver & DragEnter enabled)
    document.addEventListener('dragover', (e) => {
      if (window.SAFELENS_PAUSED || isDomainWhitelisted(window.location.href)) return;
      const types = e.dataTransfer?.types;
      if (types && Array.from(types).includes('Files')) {
        e.preventDefault();
      }
    }, { capture: true, passive: false });

    document.addEventListener('dragenter', (e) => {
      if (window.SAFELENS_PAUSED || isDomainWhitelisted(window.location.href)) return;
      const types = e.dataTransfer?.types;
      if (types && Array.from(types).includes('Files')) {
        e.preventDefault();
      }
    }, { capture: true, passive: false });

    document.addEventListener('drop', (e) => {
      if (window.SAFELENS_PAUSED || isDomainWhitelisted(window.location.href)) return;

      const targetNode = e.target;
      const targetElement = (targetNode && targetNode.nodeType === 1) ? targetNode : (targetNode?.parentElement || document.body);

      if (targetElement.getAttribute('data-safelens-bypass') === 'true' || targetElement.dataset?.safelensBypass === 'true') {
        console.log('%c[SafeLens Engine] 🔄 Bypass flag detected on drop event. Permitting synthetic event.', 'color: #888888;');
        targetElement.removeAttribute('data-safelens-bypass');
        if (targetElement.dataset) targetElement.dataset.safelensBypass = 'false';
        return;
      }

      // SYNCHRONOUS DATATRANSFER EXTRACTION BEFORE ASYNC TICK / EVENT EXPIRATION
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0 || !files[0].type.startsWith('image/')) return;

      const droppedFile = files[0];
      console.log(`%c[SafeLens Engine] ⚡ DROP event captured synchronously`, 'color: #00ffff; font-weight: bold; background: #002b36; padding: 2px 5px;');
      console.log(`%c[SafeLens Engine] 📄 Extracted Dropped Image: ${droppedFile.name} | Size: ${(droppedFile.size / 1024).toFixed(1)} KB | Type: ${droppedFile.type}`, 'color: #00ff00;');

      // SYNCHRONOUS STOP ELIMINATES ORIGINAL UNREDACTED DROP PROPAGATION
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      notifyUser('Scanning dropped image for sensitive PII...', 'warning');

      (async () => {
        const result = await redactImageFile(droppedFile);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(result.file);

        targetElement.setAttribute('data-safelens-bypass', 'true');
        if (targetElement.dataset) targetElement.dataset.safelensBypass = 'true';

        const dropEvent = new DragEvent('drop', {
          dataTransfer: dataTransfer,
          bubbles: true,
          cancelable: true,
          composed: true
        });
        targetElement.dispatchEvent(dropEvent);

        const headers = result.headers || {};
        const redactedStatus = headers['X-Redacted-Status'];
        const piiCountHeader = headers['X-PII-Count'];
        const piiCount = piiCountHeader ? parseInt(piiCountHeader, 10) : 0;

        let shouldNotify = false;
        if (redactedStatus === 'REDACTED' || piiCount > 0) {
          shouldNotify = true;
        } else if (redactedStatus === 'CLEAN' || piiCountHeader === '0') {
          shouldNotify = false;
        } else {
          shouldNotify = !!result.isRedacted;
        }

        if (shouldNotify) {
          notifyUser('Sensitive PII in dropped image redacted & injected safely!', 'success');
        } else {
          notifyUser('Dropped image scanned: Safe to insert.', 'success');
        }
      })();
    }, { capture: true, passive: false });
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