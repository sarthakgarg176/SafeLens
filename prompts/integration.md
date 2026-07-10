# Prompt: End-to-End Protection Pipeline Integration

You are a Chrome Extension Integration Engineer. Connect the upload interception layer, local background workers, and AI services into a cohesive, secure lifecycle.

## Requirements
- **Capture and Suspend**: Content script Observers must capture upload triggers (`change`, `drop`, `paste`), prevent default behavior, and suspend event propagation.
- **Settings Evaluation**: Query local storage to evaluate `settings.protectionEnabled` and `settings.autoProtect`.
- **E2E Action Routing**:
  - If Protection is OFF: Instantly resume the original file upload.
  - If Auto Protect is ON: Call the `protectImagePipeline` immediately on the file, then call `onApprovalCallback` with the protected output file.
  - If Auto Protect is OFF: Render the premium `decisionPopup` modal.
    - **Protect**: Run `protectImagePipeline`, log results to stats, and upload the secured file.
    - **Upload Anyway**: Skip protection and upload the original file.
    - **Cancel**: Close the modal and discard the upload event.
- **Worker Message Passing**: Since File objects are not serializable across IPC, convert File targets to ArrayBuffers, send them to the Service Worker via `chrome.runtime.sendMessage`, run the CPU-intensive OpenCV and Tesseract modules, and return the modified ArrayBuffer along with pHash/wHash strings and detections metadata.
- **Statistics Logging**: Save each protected or passed file transaction in local storage (`LOG_SCAN`) to update active dashboard charts.
