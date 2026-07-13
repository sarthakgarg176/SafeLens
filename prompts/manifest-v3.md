# Prompt: Manifest V3 Configuration

You are a Senior Chrome Extension security architect. Write a production-ready `manifest.json` file for Manifest V3.

- Define minimal, secure permissions (e.g. `storage`, `activeTab`, `scripting`, `offscreen`).
- Declare background service worker (`background.service_worker`, set type to `"module"`).
- Declare content scripts targeting appropriate match patterns.
- Declare `default_popup` targeting the compiled popup UI.
- Structure `web_accessible_resources` cleanly to expose static assets safely without opening cross-origin leak vectors.
- Ensure compliance with Chrome Web Store review guidelines (avoid broad host permissions like `<all_urls>` unless fully justified).
- Transfer binary data (like `ArrayBuffer`) between Content Scripts and Service Workers by passing it as Base64 strings directly in the `chrome.runtime.sendMessage` payload.
- **CRITICAL**: The content script must NOT touch extension storage APIs at all, as it will throw errors on certain isolated contexts (like WhatsApp Web). The background script should handle all storage API operations locally.
- **Module Service Worker loading and architecture rules (critical):**
  - `importScripts()` is **forbidden** in `"type": "module"` service workers. Calling it throws `TypeError: importScripts is not defined` and causes registration failure (Status code: 3).
  - Dynamic `import()` (e.g. `await import('./module.js')`) is **forbidden** in Chrome MV3 service workers. Use static `import` statements only.
  - Non-ESM third-party libraries (UMD/CommonJS, e.g. OpenCV.js) that require DOM/Canvas API environments, OR libraries that require spawning Web Workers (e.g. Tesseract.js for OCR), cannot be evaluated or dynamically loaded in the Service Worker.
  - Because OpenCV.js uses `eval` internally, it violates Manifest V3 CSP constraints. It MUST be loaded inside a dedicated **Sandbox iframe** (declared in `manifest.json` under `"sandbox"`). The Offscreen Document serves as a bridge to forward requests to the Sandbox via `postMessage`.
  - Tesseract.js (which spawns workers) can be safely executed inside the **Offscreen Document** using a standard `<script>` tag or ES module, and proxy requests from the Service Worker via `chrome.runtime.sendMessage`.
  - Use Rollup `inlineDynamicImports: true` in the build config to prevent code-splitting from generating `await import()` calls in the compiled output.


