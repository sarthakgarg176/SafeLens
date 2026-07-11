# Prompt: Manifest V3 Configuration

You are a Senior Chrome Extension security architect. Write a production-ready `manifest.json` file for Manifest V3.

- Define minimal, secure permissions (e.g. `storage`, `activeTab`, `scripting`, `offscreen`).
- Declare background service worker (`background.service_worker`, set type to `"module"`).
- Declare content scripts targeting appropriate match patterns.
- Declare `default_popup` targeting the compiled popup UI.
- Structure `web_accessible_resources` cleanly to expose static assets safely without opening cross-origin leak vectors.
- Ensure compliance with Chrome Web Store review guidelines (avoid broad host permissions like `<all_urls>` unless fully justified).
- **Module Service Worker loading and architecture rules (critical):**
  - `importScripts()` is **forbidden** in `"type": "module"` service workers. Calling it throws `TypeError: importScripts is not defined` and causes registration failure (Status code: 3).
  - Dynamic `import()` (e.g. `await import('./module.js')`) is **forbidden** in Chrome MV3 service workers. Use static `import` statements only.
  - Non-ESM third-party libraries (UMD/CommonJS, e.g. OpenCV.js) that require DOM/Canvas API environments cannot be evaluated or dynamically loaded in the Service Worker.
  - Load and run these libraries entirely inside a dedicated **Offscreen Document** using a standard `<script src="opencv.js"></script>` tag, and proxy requests from the Service Worker via `chrome.runtime.sendMessage`.
  - Use Rollup `inlineDynamicImports: true` in the build config to prevent code-splitting from generating `await import()` calls in the compiled output.


