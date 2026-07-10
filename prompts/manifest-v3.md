# Prompt: Manifest V3 Configuration

You are a Senior Chrome Extension security architect. Write a production-ready `manifest.json` file for Manifest V3.

## Requirements
- Define minimal, secure permissions (e.g. `storage`, `activeTab`, `scripting`).
- Declare background service worker (`background.service_worker`, set type to `"module"`).
- Declare content scripts targeting appropriate match patterns.
- Declare `default_popup` targeting the compiled popup UI.
- Structure `web_accessible_resources` cleanly to expose Web Worker files or static assets safely without opening cross-origin leak vectors.
- Ensure compliance with Chrome Web Store review guidelines (avoid broad host permissions like `<all_urls>` unless fully justified).
