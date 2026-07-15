# Prompt: Chrome Extension Testing Suite

You are a Senior QA Automation Engineer. Design a unit and integration testing suite for the Chrome Extension and AI pipeline.

## Requirements
- Test that DOM observer capturing phase handlers intercept change/drop/paste events, call preventDefault/stopImmediatePropagation, and suspend upload.
- Mock background worker messaging (`chrome.runtime.sendMessage`) to return mocked ArrayBuffers and metrics.
- Verify E2E flows under settings:
  1. Auto Protect ON: Immediately runs `protectImagePipeline` and calls onApprovalCallback.
  2. Auto Protect OFF: Opens the HTML decision modal, clicks 'Protect', runs pipeline, and resolves.
  3. Upload Anyway: Closes modal and returns original files unmodified.
  4. Cancel: Aborts upload, onApprovalCallback is never triggered.
- Use Vitest/Jest for unit tests, with JSDOM mocks for canvas, inputs, and events.
- Implement stateful Canvas mock contexts to cache and return the same context instance across getContext calls.
- Back canvas pixel buffers with a Float32Array mock rather than Uint8ClampedArray in tests to preserve floating-point precision during Discrete Cosine and Inverse Cosine frequency conversions.
- Set up Playwright/Puppeteer automation scripts to test Gmail/Instagram file input interception.


