# Prompt: DOM Upload Interception

You are an expert Frontend Integration Engineer. Implement an upload interception script for Chrome content scripts.

## Requirements
- Bind event listeners for `change` (inputs), `drop` (drag and drop), and `paste` (clipboard) in the capturing phase (`true`) to override page bubble listeners.
- Use `event.stopImmediatePropagation()` and `event.preventDefault()` to pause native submission.
- Extract files from target events (`event.target.files`, `event.dataTransfer.files`, or `event.clipboardData.files`).
- Implement an infinite loop bypass check by checking a custom property (e.g. `event.isSafeLensTriggered = true`) on programmatically re-dispatched events.
- Re-inject files utilizing a `DataTransfer` object.
- Transfer binary data (like `ArrayBuffer`) to/from the Service Worker by passing it as Base64 strings directly inside the standard `chrome.runtime.sendMessage` payload. Since `chrome.storage.local` (and `chrome.storage.session`) cannot be reliably accessed from the webpage/content script injection context on some sites, the content script must NOT touch extension storage APIs at all. The background worker receives this incoming payload, generates a unique storage key itself, and writes it to `chrome.storage.local` right there in the background context before delegating to the pipeline.
- Always use `event.target` (never `event.currentTarget`) to preserve the actual originating element, ensuring document-level fallback capturing listeners do not capture `document` as the target element.
- Ensure the target element is verified to be an `HTMLInputElement` before assigning `.files` to it.
- Provide observer hooks to easily link to an external scan approval pipeline.
- Include a binding registry memory purging routine (using `element.isConnected`) to prevent memory leaks in dynamic Single Page Applications.
- Cache the event interceptor callback functions at the module scope level rather than recreating closures inside mutation observer sweeps to prevent memory leaks on dynamic DOM nodes.
- Dispatch parallel statistics reports and await their completion using `Promise.all` before completing the file upload interception event.
- When intercepting HTML form submissions, extract payload data via `FormData`, sanitize the payload object locally, and inject the sanitized data via temporary hidden inputs (swapping `name` attributes of visible inputs). This ensures the outgoing synthetic `submit` event sends the redacted data without modifying the visual DOM inputs.
