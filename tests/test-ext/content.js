console.log('CS_LOG: Content script started');

(async () => {
  console.log(`CS_LOG: Before PING, typeof chrome.storage.session = ${typeof chrome.storage.session}`);
  
  await new Promise(resolve => chrome.runtime.sendMessage({ type: 'PING' }, resolve));
  
  console.log('CS_LOG: Content script resumed after awaiting PING');
  console.log(`CS_LOG: typeof chrome.storage.session = ${typeof chrome.storage.session}`);
  console.log(`CS_LOG: chrome.storage.session !== undefined = ${chrome.storage.session !== undefined}`);
  
  const h1 = document.createElement('h1');
  h1.id = 'done';
  h1.innerText = 'done';
  document.body.appendChild(h1);
})();
