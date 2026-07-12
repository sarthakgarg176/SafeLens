let creating = null; // A global promise to avoid race conditions when creating the offscreen document

/**
 * Ensures that the offscreen document is created and active.
 */
export async function ensureOffscreenDocument() {
  if (typeof chrome === 'undefined' || !chrome.offscreen) {
    return;
  }

  const url = 'public/offscreen.html';

  // Check if one already exists using runtime.getContexts (Chrome 116+)
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL(url)]
    });
    if (contexts.length > 0) {
      return;
    }
  }

  // Avoid race conditions
  if (creating) {
    await creating;
    return;
  }

  creating = chrome.offscreen.createDocument({
    url,
    reasons: ['DOM_SCRAPING'],
    justification: 'OpenCV image preprocessing requires canvas DOM context'
  });

  try {
    await creating;
  } catch (error) {
    // If it already exists, only throw if it's a different error
    if (!error.message.includes('Only a single offscreen')) {
      throw error;
    }
  } finally {
    creating = null;
  }
}

/**
 * Sends a message payload to the offscreen document and awaits the response.
 * Includes a 15-second safety timeout and a retry mechanism (up to 3 times) to handle offscreen startup latency.
 * 
 * @param {string} type - Message type
 * @param {Object} payload - Message payload
 * @param {number} [timeoutMs=15000] - Safety timeout in milliseconds
 * @returns {Promise<Object>} Response payload from offscreen
 */
export async function sendToOffscreen(type, payload, timeoutMs = 15000) {
  await ensureOffscreenDocument();

  const attemptSend = (retriesLeft = 3) => {
    return new Promise((resolve, reject) => {
      let timeoutId = setTimeout(() => {
        reject(new Error(`Offscreen execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      console.log("========= BEFORE SENDMESSAGE =========");
      console.log(payload);
      console.log(payload.data?.constructor?.name);
      console.log(payload.data?.byteLength);
      console.log("======================================");

      chrome.runtime.sendMessage({
        target: 'offscreen',
        type,
        payload
      }, (response) => {
        clearTimeout(timeoutId);

        if (chrome.runtime.lastError) {
          const errMsg = chrome.runtime.lastError.message;
          // If the offscreen listener isn't ready yet, wait and retry
          if (errMsg.includes('Could not establish connection') && retriesLeft > 0) {
            console.warn(`[OffscreenManager] Connection failed (${errMsg}). Retrying in 100ms... (${retriesLeft} retries left)`);
            setTimeout(() => {
              attemptSend(retriesLeft - 1).then(resolve, reject);
            }, 100);
            return;
          }
          return reject(new Error(errMsg));
        }

        if (!response) {
          return reject(new Error('No response received from offscreen document'));
        }
        if (!response.success) {
          return reject(new Error(response.error || 'Offscreen processing failed'));
        }
        resolve(response.payload);
      });
    });
  };

  return attemptSend();
}
