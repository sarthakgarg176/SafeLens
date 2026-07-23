# Prompt: OpenCV.js Preprocessing Integration

You are an AI Vision Engineer. Integrate OpenCV.js to preprocess document image files prior to OCR.

## Requirements
- Load OpenCV.js inside the Chrome Extension context using the correct Manifest V3 strategy.
- **Loading strategy**: OpenCV.js is a compiled Emscripten UMD file requiring DOM/Canvas contexts. Furthermore, because it uses `new Function` / `eval` internally, it violates standard Manifest V3 CSP constraints. To solve this, run the OpenCV image preprocessing pipeline inside a dedicated **Sandbox iframe** (declared in `manifest.json` under `"sandbox"`). The Offscreen Document serves as a bridge: the Service Worker sends the canvas to the Offscreen Document, which uses `postMessage` to forward it to the sandbox iframe where OpenCV runs securely.
- Convert input HTMLCanvasElement/ImageData to grayscale.
- Implement Gaussian Blur and Bilateral filtering to denoise documents without corrupting text edge boundaries.
- Detect document skew rotation angle using Canny Edge detection followed by Probabilistic Hough Line Transform.
- Rotate the image matrix to deskew/straighten horizontal text lines.
- Apply adaptive thresholding (Otsu binarization) to isolate dark text from light backgrounds.
- Resize canvas while maintaining aspect ratios to optimize character parsing speed.


