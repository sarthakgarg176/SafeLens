/**
 * Discrete Cosine Transform (DCT) Perceptual Hashing Engine
 * 
 * Responsibility:
 * - Downscales original canvas buffers to a standard 32x32 size.
 * - Converts color blocks to grayscale.
 * - Computes localized 2D DCT coefficients.
 * - Compiles a 64-bit binary fingerprint based on frequency averages.
 * - Formats output as a 16-character hexadecimal hash string.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement or OffscreenCanvas
 * - Output: Promise<string> (16-char Hexadecimal Hash)
 * 
 * Interacts with:
 * - extension/src/services/protectService.js
 */

const HASH_SIZE = 8;
const DCT_SIZE = 32;

/**
 * Generates a 16-character hexadecimal perceptual hash (pHash) from a canvas.
 * Computes hash on the ORIGINAL image before any blur/redaction filters.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Source image canvas
 * @returns {Promise<string>} Hexadecimal pHash string
 */
export async function generatePHash(canvas) {
  try {
    if (!canvas) {
      throw new TypeError('Canvas parameter is required');
    }

    // 1. Scale image down to 32x32 offscreen buffer
    const tempCanvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(DCT_SIZE, DCT_SIZE)
      : document.createElement('canvas');
    tempCanvas.width = DCT_SIZE;
    tempCanvas.height = DCT_SIZE;

    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0, DCT_SIZE, DCT_SIZE);

    const imgData = ctx.getImageData(0, 0, DCT_SIZE, DCT_SIZE);
    const data = imgData.data;

    // 2. Convert pixels to 32x32 single-channel float grayscale array
    const gray = new Float32Array(DCT_SIZE * DCT_SIZE);
    for (let i = 0; i < data.length; i += 4) {
      gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // 3. Compute top-left 8x8 DCT coefficients (Optimized calculation)
    const dct = Array.from({ length: HASH_SIZE }, () => new Float32Array(HASH_SIZE));
    
    for (let u = 0; u < HASH_SIZE; u++) {
      for (let v = 0; v < HASH_SIZE; v++) {
        let sum = 0;
        for (let x = 0; x < DCT_SIZE; x++) {
          for (let y = 0; y < DCT_SIZE; y++) {
            sum += gray[x * DCT_SIZE + y] *
              Math.cos(((2 * x + 1) * u * Math.PI) / (2 * DCT_SIZE)) *
              Math.cos(((2 * y + 1) * v * Math.PI) / (2 * DCT_SIZE));
          }
        }
        const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
        const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
        dct[u][v] = (2 / DCT_SIZE) * cu * cv * sum;
      }
    }

    // 4. Calculate average of the 8x8 coefficients (excluding [0][0] DC brightness factor)
    let totalSum = 0;
    for (let u = 0; u < HASH_SIZE; u++) {
      for (let v = 0; v < HASH_SIZE; v++) {
        if (u === 0 && v === 0) continue;
        totalSum += dct[u][v];
      }
    }
    const avg = totalSum / (HASH_SIZE * HASH_SIZE - 1);

    // 5. Build 64-bit binary bit string
    let binaryString = '';
    for (let u = 0; u < HASH_SIZE; u++) {
      for (let v = 0; v < HASH_SIZE; v++) {
        binaryString += dct[u][v] >= avg ? '1' : '0';
      }
    }

    // 6. Convert 64-bit binary to 16-character hexadecimal format
    let hexString = '';
    for (let i = 0; i < 64; i += 4) {
      const nibble = binaryString.substring(i, i + 4);
      hexString += parseInt(nibble, 2).toString(16);
    }

    return hexString;

  } catch (error) {
    console.error('[PHash] Error generating perceptual hash:', error);
    throw error;
  }
}
