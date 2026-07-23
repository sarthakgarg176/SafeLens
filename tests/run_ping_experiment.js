const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const extPath = path.resolve(__dirname, 'test-ext');
  const browser = await puppeteer.launch({
    headless: false, // Chrome extensions are only fully supported in headful mode or new headless
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
      '--headless=new'
    ]
  });

  const page = await browser.newPage();
  
  // Capture SW logs (Puppeteer can't easily capture SW console directly without attaching to the SW target, so we attach to all targets)
  browser.on('targetcreated', async target => {
    if (target.type() === 'service_worker' || target.type() === 'background_page') {
      try {
        const sw = await target.worker();
        if(sw) {
          sw.on('console', msg => console.log(msg.text()));
        }
      } catch(e) {}
    }
  });

  page.on('console', msg => {
    if(msg.text().startsWith('CS_LOG') || msg.text().startsWith('SW_LOG')) {
      console.log(msg.text());
    }
  });

  // Navigate to trigger content script
  await page.goto('http://example.com');

  // wait for the content script to finish
  await page.waitForSelector('#done', { timeout: 5000 });
  
  await browser.close();
})();
