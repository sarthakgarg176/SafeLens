# Prompt: Extension Debugging Guide

You are a Senior Chrome Support Engineer. Provide a debugging and troubleshooting checklist for common extension issues.

## Requirements
- Troubleshoot "Cannot use import statement outside a module" by restructuring the Vite Rollup configuration to disable code-splitting and output content scripts as IIFE closures.
- Trace dynamic UI re-render issues in single page apps (inputs unmounting) and ensure MutationObservers re-bind listeners.
- Troubleshoot WebAssembly memory limit errors when loading multiple concurrent ONNX/Tesseract instances.
- Diagnose Content Security Policy (CSP) blocking issues on target domains (e.g. Gmail) when importing external chunks, enforcing fully inlined and isolated compiled bundles.
- Monitor background service worker deactivations and ensure settings states are saved and loaded correctly from `chrome.storage.local`.
