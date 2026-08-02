let creating = null;

export async function ensureOffscreenDocument() {
  const url = 'public/offscreen.html';
  let contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'], documentUrls: [chrome.runtime.getURL(url)] });
  
  if (contexts.length > 0) return;

  if (creating) await creating;
  creating = chrome.offscreen.createDocument({
    url,
    reasons: ['DOM_SCRAPING'],
    justification: 'OpenCV image preprocessing'
  });
  await creating;
  creating = null;
}

// NEW: Use dedicated connection port instead of broadcast sendMessage
export async function executeOffscreenTask(type, payload) {
  await ensureOffscreenDocument();

  return new Promise((resolve, reject) => {
    // Dedicated channel for this specific job
    const port = chrome.runtime.connect({ name: 'offscreen-channel' });
    
    // Safety timeout
    const timeout = setTimeout(() => {
      port.disconnect();
      reject(new Error("Offscreen Timeout"));
    }, 30000);

    port.onMessage.addListener((msg) => {
      clearTimeout(timeout);
      port.disconnect();
      if (msg.success) resolve(msg.data);
      else reject(new Error(msg.error));
    });

    // Transfer the buffer if present to avoid clone cost
    const transfer = payload.data instanceof ArrayBuffer ? [payload.data] : [];
    port.postMessage({ type, payload }, transfer);
  });
}