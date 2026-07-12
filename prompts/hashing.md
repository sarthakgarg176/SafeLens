# Prompt: Image Hashing (pHash and wHash)

You are an Image Fingerprinting Specialist. Implement perceptual and wavelet hashing algorithms to generate robust content identifiers from HTML canvases.

## Requirements
- Hashing must operate on the **original unmodified canvas** (before any redaction, blur, watermark, or cloaking changes are applied).
- **Perceptual Hash (pHash)**:
  - Downscale image canvas to $32 \times 32$ pixels and convert to grayscale.
  - Compute 2D Discrete Cosine Transform (DCT) on the $32 \times 32$ matrix (optimized by only calculating the top-left $8 \times 8$ coefficients).
  - Calculate the average of the $8 \times 8$ coefficients (excluding the DC term at `[0,0]`).
  - Construct a 64-bit binary string: set bit to `1` if coefficient $\geq$ average, else `0`.
  - Format the 64 bits as a 16-character hexadecimal string.
- **Wavelet Hash (wHash)**:
  - Downscale image canvas to $16 \times 16$ pixels and convert to grayscale.
  - Apply 2D Haar Discrete Wavelet Transform (DWT) by running 1D Haar decompositions horizontally on rows and vertically on columns.
  - Extract the top-left $8 \times 8$ Low-Low (LL) frequency approximation sub-band.
  - Calculate the average of the $8 \times 8$ approximation coefficients.
  - Construct a 64-bit binary string: set bit to `1` if coefficient $\geq$ average, else `0`.
  - Format the 64 bits as a 16-character hexadecimal string.
