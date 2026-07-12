# SafeLens — Extension API Reference

This document catalogs every public function exported across the SafeLens extension module directories.

---

## 1. Background Orchestration Layer (`src/background/`)

### `messageRouter.js`

#### `routeMessage(message, sender)`
*   **Description**: Central dispatcher that validates and routes runtime Chrome messages to their corresponding action handlers.
*   **Inputs**:
    - `message` (Object): Custom message containing `type` and optional `payload`.
    - `sender` (chrome.runtime.MessageSender): Chrome runtime metadata.
*   **Return Type**: `Promise<SafeLensResponse>`
*   **Exceptions**: Throws `TypeError` or returns an error response object if the message schema is invalid.

---

## 2. Services Layer (`src/services/`)

### `protectService.js`

#### `protectImagePipeline(file, settings)`
*   **Description**: Orchestrates the sequential local privacy protection steps (hashing, scanning, redaction, cloaking, watermarking) on a source image file.
*   **Inputs**:
    - `file` (File | Blob): Input image.
    - `settings` (Object): Configured settings map.
*   **Return Type**: `Promise<{ success: boolean, protectedFile: File, phash: string, whash: string, detections: Object[], risk: string, error?: string }>`
*   **Exceptions**: Returns `success: false` and logs an error description on execution failure.

### `scanService.js`

#### `fileToCanvas(file)`
*   **Description**: Environment-safe utility to convert browser File objects to canvas objects.
*   **Inputs**:
    - `file` (File): Browser file input reference.
*   **Return Type**: `Promise<HTMLCanvasElement | OffscreenCanvas>`
*   **Exceptions**: Throws `TypeError` if file is missing.

#### `runScanPipeline(file, settings)`
*   **Description**: Processes an image file to extract text via OCR, scan patterns via regular expressions, and grade risk thresholds.
*   **Inputs**:
    - `file` (File): Target image.
    - `settings` (Object): Configuration rules.
*   **Return Type**: `Promise<{ success: boolean, riskLevel: string, score: number, piiCount: number, detections: Object[] }>`
*   **Exceptions**: Returns an empty scan report payload if processing fails.

### `storageService.js`

#### `getSettings()`
*   **Description**: Loads configuration parameters from Chrome's local storage.
*   **Return Type**: `Promise<Object>`

#### `saveSettings(settings)`
*   **Description**: Stores configuration updates in storage.
*   **Inputs**:
    - `settings` (Object): Settings map to save.
*   **Return Type**: `Promise<void>`

---

## 3. Communication Layer (`src/communication/`)

### `bridgeClient.js`

#### `syncSettingsWithServer(settings)`
*   **Description**: Sends client settings to the backend FastAPI profile.
*   **Inputs**:
    - `settings` (Object): Configuration state.
*   **Return Type**: `Promise<void>`

#### `reportScanResult(scanReport)`
*   **Description**: Transmits scan reports and incident logs to the FastAPI dashboard endpoint.
*   **Inputs**:
    - `scanReport` (Object): Log payload.
*   **Return Type**: `Promise<void>`

---

## 4. AI & Processing Layer (`src/ai/`)

### `preprocessing/preprocessImage.js`

#### `preprocessImage(canvas, options)`
*   **Description**: Sequences OpenCV.js operations (resizing, grayscaling, denoising, deskewing, and adaptive binarization) on an image.
*   **Inputs**:
    - `canvas` (HTMLCanvasElement | OffscreenCanvas): Source canvas.
    - `options` (Object): Preprocessing options.
*   **Return Type**: `Promise<HTMLCanvasElement | OffscreenCanvas>`

### `ocr/recognizeImage.js`

#### `recognizeImage(canvas)`
*   **Description**: Invokes local Tesseract.js workers to perform OCR character recognition.
*   **Inputs**:
    - `canvas` (HTMLCanvasElement | OffscreenCanvas): Preprocessed canvas.
*   **Return Type**: `Promise<{ text: string, confidence: number, words: Object[], lines: Object[], boundingBoxes: Object[], processingTime: number, error?: string }>`

### `detection/regexDetector.js`

#### `scanText(text, wordBoxes)`
*   **Description**: Scans OCR text output for sensitive patterns and aligns match bounds to word coordinate boxes.
*   **Inputs**:
    - `text` (string): Text string to scan.
    - `wordBoxes` (Object[]): Bounding boxes for individual words.
*   **Return Type**: `Object[]` (Collection of matched PII items)

### `detection/ruleEngine.js`

#### `validateDetections(detections)`
*   **Description**: Evaluates candidate matches against structural validation rules (Luhn, Verhoeff, formatting).
*   **Inputs**:
    - `detections` (Object[]): Candidate matches.
*   **Return Type**: `Object[]` (Detections containing `rulePassed` status flags)

### `blur/redactCanvas.js`

#### `redactCanvasRegions(canvas, regions, mode, options)`
*   **Description**: Clones the source canvas and applies visual redaction masks (solid block, blur, or pixelation) over target coordinate regions.
*   **Inputs**:
    - `canvas` (HTMLCanvasElement | OffscreenCanvas): Source image canvas.
    - `regions` (Object[]): Coordinate boxes to obscure.
    - `mode` (string): 'redact' | 'blur' | 'pixelate'.
    - `options` (Object): Custom style/radius options.
*   **Return Type**: `Promise<HTMLCanvasElement | OffscreenCanvas>`

### `watermark/watermarkEngine.js`

#### `embedWatermark(canvas, watermarkText)`
*   **Description**: Embeds an invisible text signature into the frequency domain (DCT block luminance coefficients).
*   **Inputs**:
    - `canvas` (HTMLCanvasElement | OffscreenCanvas): Source image.
    - `watermarkText` (string): String signature to embed.
*   **Return Type**: `Promise<HTMLCanvasElement | OffscreenCanvas>`

#### `extractWatermark(canvas)`
*   **Description**: Extracts and decodes the hidden watermark string key from the canvas Y channel.
*   **Inputs**:
    - `canvas` (HTMLCanvasElement | OffscreenCanvas): Watermarked image.
*   **Return Type**: `Promise<string>` (Decoded signature)

---

## 5. Content Script Layer (`src/content/`)

### `uploadInterceptor.js`

#### `interceptUpload(files, metadata, targetElement, onApprovalCallback)`
*   **Description**: Primary upload interception entry point. Suspends upload, runs the protection pipeline, prompts the user (if Auto Protect is off), and resumes or aborts.
*   **Inputs**:
    - `files` (File[]): Intercepted File objects.
    - `metadata` (Object[]): File metadata array.
    - `targetElement` (HTMLElement): Source DOM target element.
    - `onApprovalCallback` (function): Callback to resume upload with approved files.
*   **Return Type**: `Promise<Object[]>`
