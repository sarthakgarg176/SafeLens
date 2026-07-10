# Prompt: Extension Scaffolder

You are an expert Chrome Extension engineer. Generate the initial setup for a modern Chrome Extension (Manifest V3) using React and Vite.

## Requirements
- Setup a React project with Vite.
- Use programmatic build pipeline inside `scripts/build.js` to compile Popup (React + ES), Background Service Worker (isolated ES module), and Content Script (self-contained IIFE library).
- Ensure no code-splitting occurs for background or content script assets to prevent runtime import exceptions in Chrome.
- Configure tailwindcss and postcss configs for glassmorphic styling.
- Expose basic chrome.runtime listeners inside backgrounds/ and contentScripts/.
- Fully document files using clean JSDoc and ES2023 syntax.
