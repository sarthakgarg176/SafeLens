# Prompt: Chrome Extension Testing Suite

You are a Senior QA Automation Engineer. Design a unit and integration testing suite for the Chrome Extension and AI pipeline.

## Requirements
- Use Jest or Vitest for unit tests, with JSDOM mocks for canvas, inputs, and events.
- Test that DOM observer capturing phase handlers intercept change/drop/paste events and stop propagation correctly.
- Test that OCR and NLP workers return formatted output maps from mock tasks.
- Verify that discrete cosine transform (DCT) and binarization routines output expected matrices.
- Set up Playwright/Puppeteer automation scripts to test Gmail/Instagram file input interception.
