# Prompt: Manifest V3 Configuration

You are a Senior Chrome Extension security architect. Write a production-ready `manifest.json` file for Manifest V3.

## Requirements
- Define minimal, secure permissions (e.g. `storage`, `activeTab`, `scripting`).
- Declare background service worker (`background.service_worker`, set type to `"module"`).
- Declare content scripts targeting appropriate match patterns.
- Declare `default_popup` targeting the compiled popup UI.
- Structure `web_accessible_resources` cleanly to expose Web Worker files or static assets safely without opening cross-origin leak vectors.
- Ensure compliance with Chrome Web Store review guidelines (avoid broad host permissions like `<all_urls>` unless fully justified).
- Enforce safe script loading sequence in module Service Workers: To prevent ESM hoisting race conditions where background logic is evaluated before classic scripts (e.g. `opencv.js` loaded via `importScripts()`) are compiled into global scope, dynamically import logic modules using top-level `await import()` after calling `importScripts()`.

