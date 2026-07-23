/**
 * dashboardBridge.js
 * Content script injected only on the Dashboard URL to act as an auth bridge.
 */

console.log('[SafeLens Bridge] Content Script successfully injected into Dashboard page.');

window.addEventListener('message', (event) => {
  // Only accept messages from the window itself
  if (event.source !== window) return;

  const data = event.data || {};
  
  // Checking both object directly and destructuring safely
  if (data && data.type === 'SAFELENS_AUTH_INIT' && data.token) {
    console.log('[SafeLens Bridge] Target token matched! Forwarding to background router...', data.token);
    
    try {
      if (chrome.runtime && chrome.runtime.id) {
        // MATCHING THE ROUTER'S EXPECTED FORMAT: Wrap token inside a payload object
        chrome.runtime.sendMessage({ 
          type: 'AUTH_HANDSHAKE', 
          payload: { token: data.token } 
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[SafeLens Bridge] Runtime communication error:', chrome.runtime.lastError);
          } else {
            console.log('[SafeLens Bridge] Background router ACK received successfully:', response);
          }
        });
      } else {
        console.warn('[SafeLens Bridge] Extension runtime context invalidated.');
      }
    } catch (err) {
      console.error('[SafeLens Bridge] Fatal handshake transfer failure:', err);
    }
  }
});