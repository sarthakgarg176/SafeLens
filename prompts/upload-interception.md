# Prompt: DOM Upload Interception

You are an expert Frontend Integration Engineer. Implement an upload interception script for Chrome content scripts.

## Requirements
- Bind event listeners for `change` (inputs), `drop` (drag and drop), and `paste` (clipboard) in the capturing phase (`true`) to override page bubble listeners.
- Use `event.stopImmediatePropagation()` and `event.preventDefault()` to pause native submission.
- Extract files from target events (`event.target.files`, `event.dataTransfer.files`, or `event.clipboardData.files`).
- Implement an infinite loop bypass check by checking a custom property (e.g. `event.isSafeLensTriggered = true`) on programmatically re-dispatched events.
- Re-inject files utilizing a `DataTransfer` object.
- Transfer binary data (like `ArrayBuffer`) to/from the Service Worker using `chrome.storage.session` as an in-memory transport medium under temporary unique keys to prevent JSON serialization corruption in `chrome.runtime.sendMessage` on Chrome Stable. Since `chrome.storage.session` is not exposed to content scripts until the Service Worker sets the access level, and the Service Worker is ephemeral (lazy-loaded), there is a race condition. Resolve this race condition by forcefully waking the Service Worker via `chrome.runtime.sendMessage` (e.g., a "PING" message) and awaiting its response *before* attempting to access `chrome.storage.session`. This guarantees the Service Worker's top-level `setAccessLevel` execution has completed. Under no circumstances use `chrome.storage.local` for image data, as persisting sensitive images to disk violates privacy requirements.
- Always use `event.target` (never `event.currentTarget`) to preserve the actual originating element, ensuring document-level fallback capturing listeners do not capture `document` as the target element.
- Ensure the target element is verified to be an `HTMLInputElement` before assigning `.files` to it.
- Provide observer hooks to easily link to an external scan approval pipeline.
- Include a binding registry memory purging routine (using `element.isConnected`) to prevent memory leaks in dynamic Single Page Applications.
- Cache the event interceptor callback functions at the module scope level rather than recreating closures inside mutation observer sweeps to prevent memory leaks on dynamic DOM nodes.
- Dispatch parallel statistics reports and await their completion using `Promise.all` before completing the file upload interception event.

