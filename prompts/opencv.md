# Prompt: OpenCV.js Preprocessing Integration

You are an AI Vision Engineer. Integrate OpenCV.js to preprocess document image files prior to OCR.

## Requirements
- Load OpenCV.js inside the Chrome Extension context using the correct Manifest V3 strategy.
- **Loading strategy**: OpenCV.js is a compiled Emscripten UMD file requiring DOM/Canvas contexts. Since the background Service Worker is a module worker that lacks DOM APIs and forbids `importScripts` or `eval()`, run the OpenCV image preprocessing pipeline inside a dedicated **Offscreen Document**. Load it using a standard `<script src="opencv.js"></script>` tag, and proxy requests using `chrome.runtime.sendMessage` / `chrome.runtime.onMessage`.
- Convert input HTMLCanvasElement/ImageData to grayscale.
- Implement Gaussian Blur and Bilateral filtering to denoise documents without corrupting text edge boundaries.
- Detect document skew rotation angle using Canny Edge detection followed by Probabilistic Hough Line Transform.
- Rotate the image matrix to deskew/straighten horizontal text lines.
- Apply adaptive thresholding (Otsu binarization) to isolate dark text from light backgrounds.
- Resize canvas while maintaining aspect ratios to optimize character parsing speed.


