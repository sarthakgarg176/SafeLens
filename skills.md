# SafeLens Developer Skills Manual (AI + Extension Module)

This reference manual documents the APIs, architectural concepts, design patterns, and engineering standards for the SafeLens Chrome Extension and Client-Side AI components.

---

## 1. Chrome Extension Architecture (Manifest V3)

### Service Workers
- **Ephemerality**: Background service workers in MV3 are short-lived. They spin up to handle events (alarms, messages) and terminate when idle.
- **State Storage**: You must store persistent states in `chrome.storage.local` rather than in global memory variables.
- **Asynchronous Message Routing**:
  ```javascript
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleAsync(message).then(sendResponse);
    return true; // Keep the message port open asynchronously
  });
  ```

### Content Scripts
- **DOM Context Isolation**: Content scripts execute in a separate JS sandbox ("isolated world") but share the webpage's DOM.
- **Execution Constraints**: Content scripts cannot directly access variables or scripts running in the main world. Communications must go through DOM events or `window.postMessage`.
- **CSS Injection Safety**: All visual extension layers injected into target pages must wrap styling within specific shadow DOM roots or high-priority namespaces to prevent the host site's CSS from corrupting the layout.

### MutationObserver & DOM Interception
- **Observer Loop Prevention**: When modifying nodes inside a MutationObserver, ensure adjustments are filtered out or tagged to prevent recursive infinite execution.
- **Garbage Collection (GC)**: Remove event listeners and disconnect observers on unmounted DOM nodes to prevent browser memory leaks.

---

## 2. Browser Media and File APIs

### File Interception & Injection
- **Event Blocking**: Stop standard page uploads by listening to `change` (input), `drop` (drag & drop), and `paste` (clipboard) events in the **capturing phase** (`true`), running `event.stopImmediatePropagation()` and `event.preventDefault()`.
- **Cloned Events**: Re-inject modified files using `DataTransfer` items:
  ```javascript
  const dt = new DataTransfer();
  dt.items.add(newFile);
  inputElement.files = dt.files;
  ```
- **Custom Clipboard Events**: Re-trigger clipboard paste actions using `new ClipboardEvent('paste', { clipboardData: dt })` with a custom bypass flag.

### Canvas Manipulation
- **Context 2D**: Manipulate pixel layers using `ctx.getImageData()` and `ctx.putImageData()`.
- **Image Smoothing**: Toggle `ctx.imageSmoothingEnabled = true` to preserve readability when resizing.

---

## 3. Client-Side Image Processing & OCR

### OpenCV.js Vision Pipeline
- **Bilateral Filtering**: Denoises textual documents while keeping sharp edge boundaries for characters:
  ```javascript
  cv.bilateralFilter(src, dst, 9, 75, 75, cv.BORDER_DEFAULT);
  ```
- **Hough Line Transform**: Detects horizontal text skew. Straightens documents by rotating coordinates:
  ```javascript
  cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 50, 50, 10);
  ```

### Tesseract.js (OCR)
- **Worker Cache**: Re-use workers across document scans to avoid the high memory cost of spinning up WebAssembly modules repeatedly.
- **Format Processing**: Extract bounding boxes (`words[i].bbox`) for exact coordinate alignment during redaction.

---

## 4. NLP & Semantic Classification

### ONNX Runtime Web (ORT)
- **WASM Loading**: ONNX model runtimes execute in the browser using WebAssembly. Force multi-threading support by passing specific numThreads flags to the session options:
  ```javascript
  const options = { executionProviders: ['wasm'], numThreads: 4 };
  const session = await ort.InferenceSession.create(modelPath, options);
  ```
- **Luhn Algorithm Check**: Validates credit card number patterns to filter out arbitrary digits:
  ```javascript
  // Double every second digit from right to left, sum all, must be divisible by 10
  ```

### Confidence Fusion Logic
- **Weighted Bayes formula**: Combines Regex confidence and NLP topic classifications. If a text string matches a SSN regex pattern and the NLP model classifies the document as "Government Form", the final PII probability is boosted towards 99.9%.

---

## 5. Visual Protection and Security

### Adversarial AI Cloaking (FGSM)
- **Concept**: Adds low-amplitude, high-frequency mathematical noise to images. While humans see the image normally, facial recognition CNNs fail to recognize or map faces.
- **Pixel Perturbation**: Shifts color channels of pixels by a tiny fraction (within `[-5, 5]` color values) based on targeted class gradients.

### Invisible DCT Watermarking
- **Luminance Y-Channel**: Convert RGB pixels to YCbCr. Apply DCT on 8x8 blocks of the Y-channel.
- **Middle Frequency Insertion**: Embed watermark bits into middle-frequency coefficients (like $c(3,4)$ or $c(4,3)$) to ensure robustness against image compression and cropping, then run the Inverse DCT (IDCT).

---

## 6. Performance & Debugging Checklist

### Browser Performance Rules
- **Web Workers**: Always run OCR (`ocr.worker.js`) and ONNX classification (`ai.worker.js`) inside dedicated background worker threads to keep the browser UI responsive (60fps).
- **DOM Leaks**: Clean up Map registries of elements that are unmounted. Use `element.isConnected === false` checks.
- **Double Paint Avoidance**: Consolidate overlapping bounding boxes into unified coordinate blocks using union geometry algorithms before drawing redaction rectangles.

### Debugging Checklist
1. **Uncaught SyntaxError: Cannot use import statement outside a module**:
   - *Cause*: Content script was compiled in ESM mode.
   - *Fix*: Compile content scripts in IIFE format without code-splitting.
2. **TypeError: Cannot read property 'files' of null**:
   - *Cause*: Input DOM element was destroyed by a React/SPA virtual DOM update.
   - *Fix*: Verify DOM observer hooks re-attach listeners dynamically on mutation events.
3. **WASM memory limit exceeded**:
   - *Cause*: Too many concurrent ONNX sessions or Tesseract workers loaded.
   - *Fix*: Cache a single instance of each worker; terminate idle workers.
