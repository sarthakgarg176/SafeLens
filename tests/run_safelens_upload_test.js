const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const extPath = path.resolve(__dirname, '../extension/dist');
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
      '--headless=new'
    ]
  });

  const page = await browser.newPage();
  
  browser.on('targetcreated', async target => {
    if (target.url().includes('offscreen.html')) {
      try {
        const offscreenPage = await target.page();
        if (offscreenPage) {
          offscreenPage.on('console', msg => console.log('[Offscreen]', msg.text()));
        }
      } catch (e) {}
    }
  });

  page.on('console', msg => {
    const txt = msg.text();
    if(txt.includes('[UploadInterceptor]') || txt.includes('[Test]')) {
      console.log(txt);
    }
  });

  await page.goto('http://example.com');
  
  // Wait a bit for settings/startup to settle and SW to possibly sleep
  await new Promise(r => setTimeout(r, 2000));

  // Inject input and trigger upload
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'upload_test';
    document.body.appendChild(input);
    
    // add an event listener to report upload resumed
    input.addEventListener('change', (e) => {
        // Since SafeLens intercepts and re-dispatches, we listen for the re-dispatched event
        if (e.isSafeLensTriggered) {
             console.log('[Test] upload resumed successfully');
        }
    });
  });
  
  const inputUploadHandle = await page.$('#upload_test');
  
  // Create a dummy image
  const dummyImagePath = path.join(__dirname, 'dummy.png');
  // 1x1 png base64
  const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  fs.writeFileSync(dummyImagePath, Buffer.from(b64, 'base64'));

  console.log('[Test] Initiating file upload...');
  await inputUploadHandle.uploadFile(dummyImagePath);
  
  // Wait for the decision popup to appear
  await page.waitForSelector('#sl-btn-protect', { timeout: 5000 });
  await page.click('#sl-btn-protect');
  
  // wait for pipeline
  await new Promise(r => setTimeout(r, 20000));

  const swTarget = browser.targets().find(t => t.type() === 'service_worker' || t.type() === 'background_page');
  let logs = [];
  if (swTarget) {
    const swWorker = await swTarget.worker();
    logs = await swWorker.evaluate(() => {
      return new Promise(resolve => {
        chrome.storage.local.get('test_logs', (res) => resolve(res.test_logs || []));
      });
    });
  }

  const offscreenTarget = browser.targets().find(t => t.url().includes('offscreen.html'));
  if (offscreenTarget) {
    const offscreenPage = await offscreenTarget.page();
    if (offscreenPage) {
      console.log('\n--- Offscreen Document Logs ---');
      offscreenPage.on('console', msg => console.log('[Offscreen]', msg.text()));
      await new Promise(r => setTimeout(r, 1000)); // allow time for missed logs to drain if possible? No, we missed them.
    }
  }

  console.log('\n--- Service Worker Logs ---');
  for (const log of logs) {
    console.log(log);
  }
  console.log('---------------------------\n');

  await browser.close();
  
  if (fs.existsSync(dummyImagePath)) {
      fs.unlinkSync(dummyImagePath);
  }
})();
