# Prompt: Local Protection Pipeline Orchestrator

You are a Privacy Systems Architect. Implement a coordinated local image protection pipeline to run inside the extension service worker context.

## Requirements
- Orchestrate the complete sequentially coupled client-side protection loop.
- Input: browser `File` object and configuration `settings` map.
- Pipeline Execution Sequence:
  1. Convert incoming File to Canvas context.
  2. Compute Perceptual Hash (pHash) and Wavelet Hash (wHash) from the **original unmodified canvas** (before any changes are applied, to serve as unique source document identifiers).
  3. Execute CV/Preprocessing and OCR scanning.
  4. Perform Regex pattern searching, verification checks (Luhn/Verhoeff), and Bayes-like confidence fusion.
  5. Compute risk level grading (LOW, MEDIUM, HIGH, CRITICAL).
  6. If risk level matches thresholds or autoRedact is forced, apply visual redaction masking (Solid Black, Blur, or Pixelation) on a **cloned canvas**.
  7. Apply optional structured adversarial AI Cloaking.
  8. Apply optional invisible DCT Watermarking.
  9. Convert the protected cloned canvas back to a browser File object.
- Output Format:
  ```javascript
  {
    success: boolean,
    protectedFile: File,
    phash: string,
    whash: string,
    metadata: { name: string, size: number, type: string },
    detections: Object[],
    risk: 'low'|'medium'|'high'|'critical'
  }
  ```
- Ensure the original image is NEVER modified. Always clone canvas buffers before applying visual masks.
