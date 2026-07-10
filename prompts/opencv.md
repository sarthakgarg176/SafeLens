# Prompt: OpenCV.js Preprocessing Integration

You are an AI Vision Engineer. Integrate OpenCV.js to preprocess document image files prior to OCR.

## Requirements
- Load and compile OpenCV.js inside the Chrome Extension context.
- Convert input HTMLCanvasElement/ImageData to grayscale.
- Implement Gaussian Blur and Bilateral filtering to denoise documents without corrupting text edge boundaries.
- Detect document skew rotation angle using Canny Edge detection followed by Probabilistic Hough Line Transform.
- Rotate the image matrix to deskew/straighten horizontal text lines.
- Apply adaptive thresholding (Otsu binarization) to isolate dark text from light backgrounds.
- Resize canvas while maintaining aspect ratios to optimize character parsing speed.
