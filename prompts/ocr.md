# Prompt: Tesseract.js OCR Integration

You are a Vision Systems Engineer. Write the Tesseract.js OCR worker integration for text extraction.

## Requirements
- Create and cache a single Tesseract.js Worker thread inside the extension context to prevent dynamic memory allocation spikes.
- Conforms to Manifest V3 CSP constraints: load all assets locally using `chrome.runtime.getURL()` for workerPath, corePath, and langPath.
- Implement an asynchronous Promise-based lock queue (`workerLock`) to serialize concurrent `recognize()` requests on the single worker thread.
- Execute OCR recognition on preprocessed image canvases using the worker's `recognize()` API.
- Extract unstructured raw text, individual word items, bounding boxes, and confidence levels.
- Parse extracted words into horizontal lines and compile bounding boxes for exact pixel location coordinates.
- Ensure clean worker termination methods to release memory.
- Implement graceful error boundaries: on failure, resolve with an empty structured dataset containing the error field instead of crashing.

