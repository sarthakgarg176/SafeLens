console.log('SW_LOG: Service Worker started');

if (chrome.storage.session && chrome.storage.session.setAccessLevel) {
  chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });
  console.log('SW_LOG: chrome.storage.session.setAccessLevel() executed');
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PING') {
    console.log('SW_LOG: PING message received');
    console.log('SW_LOG: Sending PING response');
    sendResponse({ ok: true });
  }
  return true;
});
