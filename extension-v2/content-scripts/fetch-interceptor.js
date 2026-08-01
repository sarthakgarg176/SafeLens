/**
 * fetch-interceptor.js - SafeLens Dual Main World Injector (Fetch + XHR)
 * Intercepts outbound prompt payloads for Gemini, ChatGPT, and Claude.
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
        
        let bodyString = '';
        if (typeof init.body === 'string') {
          bodyString = init.body;
        } else if (init.body instanceof URLSearchParams) {
          bodyString = init.body.toString();
        }

        const url = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : '');
        const isGemini = bodyString.includes('f.req=');
        const isChatGPT = url.includes('/backend-api/conversation');
        const isClaude = url.includes('/completion') || url.includes('/chat_conversations');

        if (isGemini || isChatGPT || isClaude) {
          return new Promise((resolve) => {
            const reqEvent = new CustomEvent('SAFELENS_FETCH_REQ', { 
              detail: { 
                body: bodyString, 
                url: url,
                isGemini,
                isChatGPT,
                isClaude
              } 
            });
            
            let handled = false;
            const handler = function(e) {
              handled = true;
              window.removeEventListener('SAFELENS_FETCH_RES', handler);
              
              const newBody = e.detail.body;
              if (init.body instanceof URLSearchParams) {
                init.body = new URLSearchParams(newBody);
              } else {
                init.body = newBody;
              }
              resolve(originalFetch.apply(window, [resource, init]));
            };
            
            window.addEventListener('SAFELENS_FETCH_RES', handler);
            window.dispatchEvent(reqEvent);
            
            // Safety timeout (2 seconds)
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
  // 2. XHR (XMLHttpRequest) INTERCEPTOR
  // ==========================================
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url) {
    this._method = method;
    this._url = url;
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

        const url = this._url || '';
        const isGemini = bodyString.includes('f.req=');
        const isChatGPT = url.includes('/backend-api/conversation');
        const isClaude = url.includes('/completion') || url.includes('/chat_conversations');

        if (isGemini || isChatGPT || isClaude) {
          const self = this;
          const reqEvent = new CustomEvent('SAFELENS_FETCH_REQ', { 
            detail: { 
              body: bodyString, 
              url: url,
              isGemini,
              isChatGPT,
              isClaude
            } 
          });
          
          let handled = false;
          const handler = function(e) {
            handled = true;
            window.removeEventListener('SAFELENS_FETCH_RES', handler);
            
            const newBody = e.detail.body;
            let finalBody = newBody;
            if (body instanceof URLSearchParams) {
              finalBody = new URLSearchParams(newBody);
            }
            originalSend.call(self, finalBody);
          };
          
          window.addEventListener('SAFELENS_FETCH_RES', handler);
          window.dispatchEvent(reqEvent);
          
          setTimeout(() => {
            if (!handled) {
              window.removeEventListener('SAFELENS_FETCH_RES', handler);
              originalSend.call(self, body);
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