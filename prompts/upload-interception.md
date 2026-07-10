# Prompt: DOM Upload Interception

You are an expert Frontend Integration Engineer. Implement an upload interception script for Chrome content scripts.

## Requirements
- Bind event listeners for `change` (inputs), `drop` (drag and drop), and `paste` (clipboard) in the capturing phase (`true`) to override page bubble listeners.
- Use `event.stopImmediatePropagation()` and `event.preventDefault()` to pause native submission.
- Extract files from target events (`event.target.files`, `event.dataTransfer.files`, or `event.clipboardData.files`).
- Implement an infinite loop bypass check by checking a custom property (e.g. `event.isSafeLensTriggered = true`) on programmatically re-dispatched events.
- Re-inject files utilizing a `DataTransfer` object.
- Provide observer hooks to easily link to an external scan approval pipeline.
- Include a binding registry memory purging routine (using `element.isConnected`) to prevent memory leaks in dynamic Single Page Applications.
- Cache the event interceptor callback functions at the module scope level rather than recreating closures inside mutation observer sweeps to prevent memory leaks on dynamic DOM nodes.
- Dispatch parallel statistics reports and await their completion using `Promise.all` before completing the file upload interception event.

