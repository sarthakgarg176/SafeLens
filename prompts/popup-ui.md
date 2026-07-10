# Prompt: Chrome Extension Popup React UI

You are an expert Frontend Developer and UI/UX Designer. Create/refine the Popup UI for the Chrome Extension.

## Requirements
- Use React and Tailwind CSS.
- Establish a premium dark-slate glassmorphic theme containing neon purple/blue/cyan highlights.
- Structure views into clean, isolated React files: `Popup.jsx` (main nav/home status), `Settings.jsx` (toggles for protection, redaction styles, thresholds), `ScanSummary.jsx` (incident details), and `RiskCard.jsx` (risk warning summaries).
- Fetch and persist configuration settings inside `chrome.storage.local`.
- Subscribe to real-time storage changes using `chrome.storage.onChanged` to synchronise UI elements dynamically across popup sessions.
- Embed smooth hover transitions, glow drop-shadows, and active-status pulse loaders.
