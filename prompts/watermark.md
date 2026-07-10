# Prompt: Invisible Frequency-Domain Watermarking

You are an Information Hiding Specialist. Write an invisible digital watermarking engine for HTML canvases.

## Requirements
- Convert RGB canvas pixel data into the YCbCr color space.
- Segment the Luminance (Y) channel into 8x8 block matrices.
- Apply 2D Discrete Cosine Transforms (DCT) on each 8x8 block.
- Embed watermark bit signatures into mid-frequency coefficients of the DCT matrix.
- Apply 2D Inverse Discrete Cosine Transforms (IDCT) to convert frequency blocks back to spatial pixel values.
- Re-assemble channels and output the watermarked canvas.
- Implement corresponding watermark reading/extraction algorithms to decode signatures from watermarked images.
