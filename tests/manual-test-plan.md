# SafeLens — Manual Testing & Verification Plan

This document outlines the step-by-step procedure for verifying the SafeLens Chrome Extension's capabilities that cannot be fully automated (such as user interface feedback, file uploading states, and browser lifecycle event triggers).

---

## Part 1: Installation & Configuration

### 1. Chrome Installation Test
*   **Procedure**:
    1. Open Google Chrome and navigate to `chrome://extensions/`.
    2. Toggle **Developer mode** in the top-right corner.
    3. Click **Load unpacked** and select the SafeLens compilation output folder `extension/dist/`.
*   **Expected Outcome**:
    - The SafeLens extension loads successfully without errors.
    - The extension icon appears in the toolbar.

### 2. Manifest V3 Validation
*   **Procedure**:
    1. Click on the extension card in `chrome://extensions/`.
    2. Inspect permissions, background workers, and content scripts.
*   **Expected Outcome**:
    - Extension manifest is identified as Version 3.
    - Background Service Worker lists as active and registers without warnings.

### 3. Extension Reload
*   **Procedure**:
    1. Open `chrome://extensions/`.
    2. Click the circular **Reload** icon on the SafeLens card.
*   **Expected Outcome**:
    - The background Service Worker re-initializes.
    - All content script injection contexts update without crashing active pages.

---

## Part 2: DOM Interception & Auto Protect States

### 4. Upload Interception Test
*   **Procedure**:
    1. Open any web form with a file input (e.g. Gmail, Dropbox, or a local HTML page containing `input[type="file"]`).
    2. Select or drop an image file (e.g. `document.png`).
*   **Expected Outcome**:
    - The file upload is paused.
    - The browser displays the SafeLens Decision Modal.

### 5. Auto Protect = ON
*   **Procedure**:
    1. Open the SafeLens action popup.
    2. Toggle **Auto Protect** to **ON**.
    3. Upload an image containing dummy credit card numbers.
*   **Expected Outcome**:
    - The file is intercepted and processed immediately.
    - The modal does NOT pop up.
    - The protected file (e.g. `document_protected.png`) is uploaded directly.

### 6. Auto Protect = OFF
*   **Procedure**:
    1. Toggle **Auto Protect** to **OFF** in popup settings.
    2. Upload an image.
*   **Expected Outcome**:
    - The upload pauses.
    - The Decision Modal pops up with buttons: **Protect Image**, **Upload Anyway**, and **Cancel**.

---

## Part 3: Redaction & AI Protection Filters

### 7. Black Redact Mode
*   **Procedure**:
    1. Set **Redaction Mode** to **Solid Black Block** (`redact`) in the popup settings.
    2. Upload an image with sensitive text. Click **Protect**.
*   **Expected Outcome**:
    - The uploaded file contains solid black blocks completely obscuring all sensitive text.

### 8. Blur Mode
*   **Procedure**:
    1. Set **Redaction Mode** to **Gaussian Blur** (`blur`).
    2. Upload the target image and click **Protect**.
*   **Expected Outcome**:
    - The uploaded file contains localized blurred blocks over sensitive coordinates.

### 9. Pixelate Mode
*   **Procedure**:
    1. Set **Redaction Mode** to **Pixelate** (`pixelate`).
    2. Upload the target image and click **Protect**.
*   **Expected Outcome**:
    - The uploaded file displays color-averaged mosaic blocks over sensitive coordinates.

### 10. AI Cloaking Enabled
*   **Procedure**:
    1. Toggle **Adversarial Cloaking** to **ON** in popup settings.
    2. Upload a face/document image.
*   **Expected Outcome**:
    - High-frequency wave perturbations are applied to the canvas.
    - The image looks visually normal, but shows high-frequency checkerboard deviations in a diff checker.

### 11. Watermark Enabled
*   **Procedure**:
    1. Toggle **Invisible Watermark** to **ON**.
    2. Upload an image.
*   **Expected Outcome**:
    - Watermark string is successfully embedded in the frequency domain.
    - Image loads without visible watermark text overlay.

---

## Part 4: Signatures & Fingerprinting

### 12. pHash Generation
*   **Procedure**:
    1. Enable logging and upload two images that are slightly resized/cropped versions of each other.
    2. Inspect storage logs.
*   **Expected Outcome**:
    - PHash is generated.
    - The distance between the hashes remains low, confirming perceptual robustness.

### 13. wHash Generation
*   **Procedure**:
    1. Upload two images with slight color/illumination changes.
    2. Inspect storage logs.
*   **Expected Outcome**:
    - Wavelet hash (DWT LL band approximation) is generated.
    - Hash values remain close, indicating color-change invariance.

---

## Part 5: Performance, Stress & Edge Cases

### 14. Memory Leak Checks
*   **Procedure**:
    1. Open Chrome Task Manager (`Shift + Esc`).
    2. Perform 50 consecutive image scans and redactions.
*   **Expected Outcome**:
    - Memory usage of the Background Service Worker stays stable and garbage collects correctly (confirming all WASM `cv.Mat` buffers are deleted).

### 15. Multiple Simultaneous Uploads
*   **Procedure**:
    1. Drag and drop 5 files simultaneously onto an upload zone.
*   **Expected Outcome**:
    - SafeLens serializes the requests and runs scans in parallel/sequence without freezing the browser page.

### 16. Large Image (>20MB)
*   **Procedure**:
    1. Attempt to upload a high-resolution PNG image larger than 20MB.
*   **Expected Outcome**:
    - SafeLens downscales the canvas sizes appropriately and completes scanning without triggering a "WASM Out of Memory" panic.

### 17. Corrupted Image
*   **Procedure**:
    1. Attempt to upload a file with an image extension but containing garbage text bytes.
*   **Expected Outcome**:
    - SafeLens fails gracefully, logs a warning, and allows the user to resume or skips the scan without locking the webpage.

### 18. Unsupported File Type
*   **Procedure**:
    1. Attempt to upload a `.txt` or `.zip` file.
*   **Expected Outcome**:
    - SafeLens ignores non-image file uploads immediately, passing them to the page without showing the decision popup.

### 19. OCR Failure Fallback
*   **Procedure**:
    1. Temporarily disrupt the local worker scripts (e.g. simulate offline network or empty worker configuration).
    2. Upload a document image.
*   **Expected Outcome**:
    - The pipeline skips the OCR step gracefully and returns the grayed original image rather than throwing uncaught errors.

---

## Part 6: Lifecycle Resilience

### 20. Service Worker Restart
*   **Procedure**:
    1. Open `chrome://extensions/` and click the `inspect views: service worker` link to open DevTools.
    2. Click the circular **Stop** button in DevTools (under the Application tab or chrome://inspect) to terminate the Service Worker background task.
    3. Perform a file upload on a webpage.
*   **Expected Outcome**:
    - Chrome wakes up the Service Worker automatically to handle the port message.
    - The upload pauses, and the scan pipeline completes successfully.
