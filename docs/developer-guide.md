# SafeLens — Extension Developer & Onboarding Guide

Welcome to the SafeLens Extension Developer Guide. This document provides an architectural orientation for adding features, extending protection filters, compiling code, and debugging.

---

## 1. Project Folder Structure

```
extension/
├── public/                 # Static assets copied directly to dist/
│   ├── icons/              # Extension icons
│   ├── opencv.js           # Pre-compiled OpenCV.js library (classic script)
│   ├── popup.html          # React popup entry point HTML
│   ├── tesseract/          # Local Tesseract worker, core, and eng data
│   └── manifest.json       # Manifest V3 extension configuration
├── scripts/                # Node build and automation helper scripts
│   ├── build.js            # Vite build pipeline orchestrator
│   └── generate-placeholders.js
├── src/                    # Extension source code
│   ├── background/         # Service worker files
│   │   ├── serviceWorker.js # Entry worker (loads OpenCV, dynamic imports)
│   │   └── messageRouter.js # Core message handler registry
│   ├── content/            # Webpage script injection layer
│   │   ├── contentScript.js # Entry script loading observers
│   │   ├── domObserver.js   # Captures upload changes, dropzones, paste events
│   │   ├── uploadInterceptor.js # Pipeline controller (Auto Protect toggles)
│   │   └── decisionPopup.js # Choices HTML prompt modal UI
│   ├── services/           # Business logic layer
│   │   ├── protectService.js # Sequence orchestrator (Hashing -> Scan -> Redact)
│   │   ├── scanService.js   # Coordinates OCR, regex rules, and risk
│   │   └── storageService.js # Local storage options state
│   ├── config/             # Configuration defaults
│   │   └── defaults.js      # Consolidated DEFAULT_SETTINGS schema
│   ├── communication/      # Sync client
│   │   └── bridgeClient.js  # FastAPI logging interface
│   └── ai/                 # Core preprocessing, scanning, and redaction logic
│       ├── preprocessing/   # OpenCV resize, grayscale, denoise, deskew
│       ├── ocr/             # Tesseract run recognizes
│       ├── detection/       # Regex detector, Luhn/Verhoeff rules, fused, risk
│       ├── blur/            # Padding, box merging, solid/blur/pixelate canvas
│       ├── cloaking/        # Face cloaking noise perturbations
│       ├── watermark/       # DCT/IDCT invisible text signatures
│       └── hashing/         # PHash and wHash generators
├── tests/                  # Headless unit testing modules
│   ├── setup.js            # Mock browser, Canvas, and OpenCV configurations
│   ├── preprocessing.test.js
│   ├── ocr.test.js
│   └── ...                 # Test suites for all 12 modules
└── vitest.config.js        # Vitest environment setup configurations
```

---

## 2. Build & Compilation Process

SafeLens uses Vite to compile assets. Because of Manifest V3 regulations, dynamic code evaluation (`eval`) is disallowed, and the extension code must be self-contained:

*   **Popup (React UI)**: Compiled into an ES module bundles directory `dist/assets/`.
*   **Content Script**: Must be built as a self-contained IIFE library (`dist/content/contentScript.js`) with zero imports to avoid code-splitting loading errors during webpage injection.
*   **Service Worker**: Compiled in ES Module format targeting `esnext`. Dynamic chunks are output under `dist/background/`.
*   **Command**: Run `npm run build` from the `extension/` directory.

---

## 3. Testing Suite

The project includes an in-memory testing framework utilizing **Vitest**:
*   **Headless Mocking (`tests/setup.js`)**:
    - Mock canvas elements use `Float32Array` buffers to prevent 8-bit integer rounding errors during frequency transformations.
    - Caches `MockCanvasRenderingContext2D` context bindings so that subsequent `getContext('2d')` queries retrieve the same buffer.
*   **Run command**: `npm run test`

---

## 4. Debugging & Common Pitfalls

### A. OpenCV.js ESM Hoisting Race Condition
In module service workers, static imports (`import { ... } from './x.js'`) are evaluated before top-level expressions. If an imported file tries to use OpenCV before `importScripts('/opencv.js')` runs, the worker crashes.
*   **Solution**: Always import logic modules dynamically inside the Service Worker:
    ```javascript
    importScripts('/opencv.js');
    const { routeMessage } = await import('./messageRouter.js');
    ```

### B. Service Worker Canvas Reference Exception
Traditional `document.createElement('canvas')` and `FileReader` are not defined in Service Worker global scopes.
*   **Solution**: `scanService.js` performs environment-safe branching:
    ```javascript
    if (typeof document === 'undefined') {
      const canvas = new OffscreenCanvas(w, h);
    }
    ```

### C. Redaction Clipping & Saturation
Embedding frequency-domain watermarks into solid white (`255`) or solid black (`0`) images results in clipping, causing the watermark to be lost during integer clamping.
*   **Solution**: Ensure mock canvas objects are initialized to a neutral gray background (e.g. `128`) during automated testing.

---

## 5. How to Extend the Protection Pipeline

To add a new visual modification step (e.g., a custom watermark style or image masking filter):
1. Create your processing module in `src/ai/yourModule/`.
2. Ensure it accepts a canvas object and configuration settings, returning a modified `HTMLCanvasElement` or `OffscreenCanvas`.
3. Never mutate the input canvas directly; always clone it first using `cloneCanvas(canvas)`.
4. Import and integrate the step inside the orchestrator file `src/services/protectService.js`.
5. Write corresponding unit tests in `tests/yourModule.test.js` and register it in the manual checklist.
