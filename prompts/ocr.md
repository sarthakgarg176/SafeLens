# Prompt: Tesseract.js OCR Integration

You are a Vision Systems Engineer. Write the Tesseract.js OCR worker integration for text extraction.

## Requirements
- Create and cache a single Tesseract.js Worker thread inside the extension context to prevent dynamic memory allocation spikes.
- Execute OCR recognition on preprocessed image canvases.
- Extract unstructured raw text, individual word items, bounding boxes, and confidence levels.
- Parse extracted words into horizontal lines and compile bounding boxes for exact pixel location coordinates.
- Ensure clean worker termination methods to release memory.
