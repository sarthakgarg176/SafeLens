/**
 * fetch-interceptor.js - SafeLens Dual Main World Injector (Fetch + XHR)
 * Converts Objects to Strings before checking for payloads.
 */
(function() {
  'use strict';
  
  // ==========================================
  // 1. FETCH API INTERCEPTOR
  // ==========================================
  const originalFetch = window.fetch;
  window.fetch = async function(resource, init) {
    try {
      if (init && init.method === 'POST' && init.body) {
        
        // Convert body to string safely (Fixes the URLSearchParams object issue)
        let bodyString = '';
        if (typeof init.body === 'string') {
          bodyString = init.body;
        } else if (init.body instanceof URLSearchParams) {
          bodyString = init.body.toString();
        }

        // Catch the Gemini Payload
        if (bodyString && bodyString.includes('f.req=')) {
          return new Promise((resolve) => {
            const reqEvent = new CustomEvent('SAFELENS_FETCH_REQ', { detail: { body: bodyString } });
            
            let handled = false;
            const handler = function(e) {
              handled = true;
              window.removeEventListener('SAFELENS_FETCH_RES', handler);
              init.body = e.detail.body; // Set modified string back to body
              resolve(originalFetch.apply(window, [resource, init]));
            };
            
            window.addEventListener('SAFELENS_FETCH_RES', handler);
            window.dispatchEvent(reqEvent);
            
            // Safety timeout
            setTimeout(() => {
              if (!handled) {
                window.removeEventListener('SAFELENS_FETCH_RES', handler);
                resolve(originalFetch.apply(window, [resource, init]));
              }
            }, 2000);
          });
        }
      }
    } catch (err) {
      console.error("SafeLens Fetch Intercept Error:", err);
    }
    return originalFetch.apply(this, arguments);
  };

  // ==========================================
  // 2. XHR (XMLHttpRequest) INTERCEPTOR (Backup for Google Services)
  // ==========================================
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url) {
    this._method = method;
    return originalOpen.apply(this, arguments);
  };
  
  XMLHttpRequest.prototype.send = function(body) {
    try {
      if (this._method === 'POST' && body) {
        let bodyString = '';
        if (typeof body === 'string') {
          bodyString = body;
        } else if (body instanceof URLSearchParams) {
          bodyString = body.toString();
        }

        if (bodyString && bodyString.includes('f.req=')) {
          const self = this;
          const reqEvent = new CustomEvent('SAFELENS_FETCH_REQ', { detail: { body: bodyString } });
          
          let handled = false;
          const handler = function(e) {
            handled = true;
            window.removeEventListener('SAFELENS_FETCH_RES', handler);
            originalSend.call(self, e.detail.body); // Send modified body
          };
          
          window.addEventListener('SAFELENS_FETCH_RES', handler);
          window.dispatchEvent(reqEvent);
          
          setTimeout(() => {
            if (!handled) {
              window.removeEventListener('SAFELENS_FETCH_RES', handler);
              originalSend.call(self, body); // Fallback to original
            }
          }, 2000);
          
          return; // Stop the default execution, wait for event
        }
      }
    } catch (err) {
      console.error("SafeLens XHR Intercept Error:", err);
    }
    return originalSend.apply(this, arguments);
  };
})();