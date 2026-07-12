/**
 * Discrete Cosine Transform (DCT) Math Engine
 * 
 * Responsibility:
 * - Performs 2D Discrete Cosine Transforms (DCT) on 8x8 image blocks.
 * - Extracts and converts pixels into the spatial frequency domain to enable invisible watermarking.
 * - Performs Inverse 2D Discrete Cosine Transforms (IDCT) to write frequencies back to pixels.
 * 
 * Input/Output Contract:
 * - Input: number[][] (8x8 pixel luminance block matrix)
 * - Output: number[][] (8x8 frequency coefficient matrix)
 * 
 * Interacts with:
 * - extension/src/ai/watermark/watermarkEngine.js (Supplies mathematical transforms)
 */

/**
 * Performs a 2D DCT on an 8x8 block.
 * 
 * @param {number[][]} block - 8x8 numerical input matrix
 * @returns {number[][]} 8x8 DCT coefficients matrix
 */
export function dct2D(block) {
  const N = 8;
  const dct = Array.from({ length: N }, () => new Array(N).fill(0));

  for (let u = 0; u < N; u++) {
    for (let v = 0; v < N; v++) {
      let sum = 0;
      for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
          sum += block[x][y] *
            Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
            Math.cos(((2 * y + 1) * v * Math.PI) / 16);
        }
      }
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      dct[u][v] = 0.25 * cu * cv * sum;
    }
  }
  return dct;
}

/**
 * Performs a 2D Inverse DCT (IDCT) on an 8x8 block.
 * 
 * @param {number[][]} dctBlock - 8x8 DCT coefficients matrix
 * @returns {number[][]} 8x8 numerical pixel values matrix
 */
export function idct2D(dctBlock) {
  const N = 8;
  const idct = Array.from({ length: N }, () => new Array(N).fill(0));

  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      let sum = 0;
      for (let u = 0; u < N; u++) {
        for (let v = 0; v < N; v++) {
          const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
          const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
          sum += cu * cv * dctBlock[u][v] *
            Math.cos(((2 * x + 1) * u * Math.PI) / 16) *
            Math.cos(((2 * y + 1) * v * Math.PI) / 16);
        }
      }
      idct[x][y] = 0.25 * sum;
    }
  }
  return idct;
}
