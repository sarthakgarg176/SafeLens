/**
 * extensionBridge.js
 * Talks to the SafeLens extension's interceptor.js content script (which also
 * runs on this dashboard page since it's injected on <all_urls>) via
 * window.postMessage. No direct chrome.storage access from here — the page
 * can't reach that, only the content script can.
 */

let listeners = [];
let lastKnownStatus = null;
let detectionTimer = null;

/**
 * Subscribe to shield status updates.
 * @param {function({extensionPaused: boolean, pauseUntilTimestamp: number|null, whitelist: string[], detected: boolean}): void} callback
 * @returns {function(): void} unsubscribe function
 */
export function subscribeToShieldStatus(callback) {
  listeners.push(callback);
  if (lastKnownStatus) callback(lastKnownStatus); // replay last known state immediately

  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
}

function emit(status) {
  lastKnownStatus = status;
  listeners.forEach((cb) => {
    try { cb(status); } catch (err) { console.warn('[extensionBridge] listener error:', err); }
  });
}

// Listen for replies from interceptor.js
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const data = event.data || {};
  if (data.direction === 'from-content-script' && data.type === 'SAFELENS_STATUS_RESPONSE') {
    if (detectionTimer) {
      clearTimeout(detectionTimer);
      detectionTimer = null;
    }
    emit({ ...data.payload, detected: true });
  }
});

/**
 * Ask the extension for its current status. If nothing responds within
 * 1500ms, emits { detected: false } so the UI can show "Extension Not Found".
 */
export function requestShieldStatus() {
  if (detectionTimer) clearTimeout(detectionTimer);
  detectionTimer = setTimeout(() => {
    emit({ extensionPaused: false, pauseUntilTimestamp: null, whitelist: [], detected: false });
  }, 1500);

  window.postMessage({ direction: 'from-page-script', type: 'SAFELENS_STATUS_REQUEST' }, '*');
}

/**
 * Pause or resume the shield.
 * @param {boolean} paused
 * @param {number|null} pauseUntilTimestamp - epoch ms when it should auto-resume (only used if paused=true)
 */
export function setShieldPaused(paused, pauseUntilTimestamp = null) {
  window.postMessage({
    direction: 'from-page-script',
    type: 'SAFELENS_TOGGLE_STATE',
    payload: { extensionPaused: paused, pauseUntilTimestamp: paused ? pauseUntilTimestamp : null }
  }, '*');
}

/** Convenience helper: snooze for N minutes from now. */
export function snoozeShield(minutes) {
  setShieldPaused(true, Date.now() + minutes * 60 * 1000);
}

/** Add a domain to the trusted whitelist. */
export function addWhitelistDomain(domain) {
  window.postMessage({
    direction: 'from-page-script',
    type: 'SAFELENS_WHITELIST_ADD',
    payload: { domain }
  }, '*');
}
