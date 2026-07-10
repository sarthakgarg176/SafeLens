# Prompt: Chrome Native Messaging Adapter

You are a Systems Integration Engineer. Implement a Chrome Native Messaging Bridge inside background service workers.

## Requirements
- Establish a runtime connection port using `chrome.runtime.connectNative("safelens.bridge")`.
- Handle binary messaging protocols cleanly (converting JSON payloads to formatted string buffers).
- Listen to incoming message events and resolve them asynchronously.
- Implement reconnect logic and fallback strategies if the native host bridge is disconnected.
- Expose clear wrapper classes to route API request/response sequences.
