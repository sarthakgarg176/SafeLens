# Prompt: Invisible Frequency-Domain Watermarking

You are an Information Hiding Specialist. Write an invisible digital watermarking engine for HTML canvases.

## Requirements
- Convert RGB canvas pixel data into the YCbCr color space ($Y = 0.299R + 0.587G + 0.114B$).
- Segment the Luminance (Y) channel into 8x8 block matrices.
- Apply 2D Discrete Cosine Transforms (DCT) on each 8x8 block.
- Convert text string to bit array (with `\0` null-terminator) and embed bit signatures into mid-frequency coefficients (`dctBlock[4][4]`) using Quantization Index Modulation (QIM) with step size 20.
- Apply 2D Inverse Discrete Cosine Transforms (IDCT) to convert frequency blocks back to spatial pixel values.
- Re-assemble color channels and output the watermarked canvas, clamping RGB values to $[0, 255]$.
- Implement corresponding watermark reading/extraction algorithms to decode signatures from Y-channel QIM differences.

