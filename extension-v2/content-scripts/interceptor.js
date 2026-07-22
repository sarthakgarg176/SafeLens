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
          extractedText: '', // populated by OCR pipeline if available
          targetUrl: window.location.href
        }
      },
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
})();