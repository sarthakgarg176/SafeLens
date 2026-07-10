/**
 * Discrete Haar Wavelet Transform (DWT) Hashing Engine
 * 
 * Responsibility:
 * - Downscales original canvas buffers to a standard 16x16 size.
 * - Converts color blocks to grayscale.
 * - Applies a 2D Haar Discrete Wavelet Transform (DWT).
 * - Extracts the 8x8 Low-Low (LL) frequency approximation sub-band.
 * - Compiles a 64-bit binary fingerprint based on sub-band averages.
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
const DWT_SIZE = 16;

/**
 * Applies a 1D Haar Wavelet transform on a Float32Array.
 * 
 * @param {Float32Array} arr - Input array
 * @param {number} length - Current level length
 */
function haar1D(arr, length) {
  const temp = new Float32Array(length);
  const half = length / 2;

  for (let i = 0; i < half; i++) {
    const val1 = arr[2 * i];
    const val2 = arr[2 * i + 1];
    
    // Approximation (averages) in the first half, Details (diffs) in the second half
    temp[i] = (val1 + val2) / Math.sqrt(2);
    temp[half + i] = (val1 - val2) / Math.sqrt(2);
  }

  // Copy back
  for (let i = 0; i < length; i++) {
    arr[i] = temp[i];
  }
}

/**
 * Performs a 2D Haar Wavelet transform on a 16x16 matrix.
 * 
 * @param {Float32Array} matrix - 16x16 single-channel array
 */
function haar2D(matrix) {
  // 1. Transform each row horizontally
  for (let r = 0; r < DWT_SIZE; r++) {
    const row = new Float32Array(DWT_SIZE);
    for (let c = 0; c < DWT_SIZE; c++) {
      row[c] = matrix[r * DWT_SIZE + c];
    }
    haar1D(row, DWT_SIZE);
    for (let c = 0; c < DWT_SIZE; c++) {
      matrix[r * DWT_SIZE + c] = row[c];
    }
  }

  // 2. Transform each column vertically
  for (let c = 0; c < DWT_SIZE; c++) {
    const col = new Float32Array(DWT_SIZE);
    for (let r = 0; r < DWT_SIZE; r++) {
      col[r] = matrix[r * DWT_SIZE + c];
    }
    haar1D(col, DWT_SIZE);
    for (let r = 0; r < DWT_SIZE; r++) {
      matrix[r * DWT_SIZE + c] = col[r];
    }
  }
}

/**
 * Generates a 16-character hexadecimal wavelet hash (wHash) from a canvas.
 * Computes hash on the ORIGINAL image before any blur/redaction filters.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Source image canvas
 * @returns {Promise<string>} Hexadecimal wHash string
 */
export async function generateWHash(canvas) {
  try {
    if (!canvas) {
      throw new TypeError('Canvas parameter is required');
    }

    // 1. Scale image down to 16x16 offscreen buffer
    const tempCanvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(DWT_SIZE, DWT_SIZE)
      : document.createElement('canvas');
    tempCanvas.width = DWT_SIZE;
    tempCanvas.height = DWT_SIZE;

    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0, DWT_SIZE, DWT_SIZE);

    const imgData = ctx.getImageData(0, 0, DWT_SIZE, DWT_SIZE);
    const data = imgData.data;

    // 2. Convert pixels to 16x16 single-channel float grayscale array
    const matrix = new Float32Array(DWT_SIZE * DWT_SIZE);
    for (let i = 0; i < data.length; i += 4) {
      matrix[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // 3. Compute 2D Haar DWT
    haar2D(matrix);

    // 4. Extract top-left 8x8 Low-Low (LL) frequency approximation coefficients
    const llBand = Array.from({ length: HASH_SIZE }, () => new Float32Array(HASH_SIZE));
    let totalSum = 0;

    for (let r = 0; r < HASH_SIZE; r++) {
      for (let c = 0; c < HASH_SIZE; c++) {
        const val = matrix[r * DWT_SIZE + c];
        llBand[r][c] = val;
        totalSum += val;
      }
    }

    // 5. Calculate average coefficient value
    const avg = totalSum / (HASH_SIZE * HASH_SIZE);

    // 6. Build 64-bit binary bit string
    let binaryString = '';
    for (let r = 0; r < HASH_SIZE; r++) {
      for (let c = 0; c < HASH_SIZE; c++) {
        binaryString += llBand[r][c] >= avg ? '1' : '0';
      }
    }

    // 7. Convert 64-bit binary to 16-character hexadecimal format
    let hexString = '';
    for (let i = 0; i < 64; i += 4) {
      const nibble = binaryString.substring(i, i + 4);
      hexString += parseInt(nibble, 2).toString(16);
    }

    return hexString;

  } catch (error) {
    console.error('[WHash] Error generating wavelet hash:', error);
    throw error;
  }
}
