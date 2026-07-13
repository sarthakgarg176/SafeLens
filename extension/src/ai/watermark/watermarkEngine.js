import { dct2D, idct2D } from './dct.js';

/**
 * Frequency-Domain DCT Invisible Watermarking Engine
 * 
 * Responsibility:
 * - Converts RGB canvas buffers to the YCbCr color space.
 * - Segments Y (Luminance) channel into 8x8 blocks.
 * - Applies 2D DCT on blocks and embeds watermark bit signatures using Quantization Index Modulation (QIM).
 * - Runs 2D IDCT to re-assemble spatial pixels without visible text overlays.
 * - Decodes hidden watermark bits from watermarked canvas inputs.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement or OffscreenCanvas, watermarkText (string)
 * - Output: Promise<HTMLCanvasElement|OffscreenCanvas> (Watermarked canvas)
 * 
 * Interacts with:
 * - extension/src/ai/watermark/dct.js
 * - extension/src/services/protectService.js
 */

const BLOCK_SIZE = 8;
const QUANTIZATION_STEP = 20; // Controls strength vs transparency trade-off

/**
 * Converts text string to a binary bit array.
 * 
 * @param {string} text - Source string
 * @returns {number[]} Array of 0s and 1s
 */
function textToBits(text) {
  const bits = [];
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    for (let bit = 7; bit >= 0; bit--) {
      bits.push((charCode >> bit) & 1);
    }
  }
  return bits;
}

/**
 * Decodes binary bit array back to a text string.
 * 
 * @param {number[]} bits - Array of bits
 * @returns {string} Restored string
 */
function bitsToText(bits) {
  let text = '';
  for (let i = 0; i < bits.length; i += 8) {
    let charCode = 0;
    for (let bit = 0; bit < 8; bit++) {
      if (i + bit < bits.length) {
        charCode = (charCode << 1) | bits[i + bit];
      }
    }
    if (charCode === 0) break; // Null terminator
    text += String.fromCharCode(charCode);
  }
  return text;
}

/**
 * Embeds an invisible watermark signature into Y-channel mid-frequency coefficients.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Target image canvas
 * @param {string} watermarkText - Watermark string identifier key
 * @returns {Promise<HTMLCanvasElement|OffscreenCanvas>} Watermarked output canvas
 */
export async function embedWatermark(canvas, watermarkText) {
  try {
    if (!canvas) {
      throw new TypeError('Canvas parameter is required');
    }

    if (!watermarkText) {
      return canvas;
    }

    console.log(`[WatermarkEngine] Embedding invisible DCT watermark: "${watermarkText}"`);

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Convert text to bit stream
    const bitStream = textToBits(watermarkText + '\0'); // Add null terminator
    let bitIndex = 0;

    // Pad width and height to multiples of 8
    const cols = Math.floor(width / BLOCK_SIZE) * BLOCK_SIZE;
    const rows = Math.floor(height / BLOCK_SIZE) * BLOCK_SIZE;

    // Loop through 8x8 blocks
    for (let by = 0; by < rows; by += BLOCK_SIZE) {
      for (let bx = 0; bx < cols; bx += BLOCK_SIZE) {
        
        // 1. Gather luminance Y for current 8x8 block, converting from RGB
        const blockY = Array.from({ length: BLOCK_SIZE }, () => new Array(BLOCK_SIZE).fill(0));
        const blockCb = Array.from({ length: BLOCK_SIZE }, () => new Array(BLOCK_SIZE).fill(0));
        const blockCr = Array.from({ length: BLOCK_SIZE }, () => new Array(BLOCK_SIZE).fill(0));

        for (let dy = 0; dy < BLOCK_SIZE; dy++) {
          for (let dx = 0; dx < BLOCK_SIZE; dx++) {
            const pxIndex = ((by + dy) * width + (bx + dx)) * 4;
            const r = data[pxIndex];
            const g = data[pxIndex + 1];
            const b = data[pxIndex + 2];

            // RGB to YCbCr formulas
            blockY[dy][dx] = 0.299 * r + 0.587 * g + 0.114 * b;
            blockCb[dy][dx] = 128 - 0.1687 * r - 0.3313 * g + 0.5 * b;
            blockCr[dy][dx] = 128 + 0.5 * r - 0.4187 * g - 0.0813 * b;
          }
        }

        // 2. Perform 2D DCT on Y block
        const dctBlock = dct2D(blockY);

        // 3. Embed bit in mid-frequency coefficient [4][4] (balancing robustness and invisibility)
        if (bitIndex < bitStream.length) {
          const bit = bitStream[bitIndex];
          const val = dctBlock[4][4];
          
          // Quantization Index Modulation (QIM)
          const quantized = Math.round(val / QUANTIZATION_STEP) * QUANTIZATION_STEP;
          dctBlock[4][4] = bit === 1 
            ? quantized + (QUANTIZATION_STEP / 4) 
            : quantized - (QUANTIZATION_STEP / 4);

          // Cycle or repeat bit stream
          bitIndex++;
        }

        // 4. Perform Inverse 2D DCT (IDCT)
        const idctBlock = idct2D(dctBlock);

        // 5. Re-assemble block back to RGB
        for (let dy = 0; dy < BLOCK_SIZE; dy++) {
          for (let dx = 0; dx < BLOCK_SIZE; dx++) {
            const pxIndex = ((by + dy) * width + (bx + dx)) * 4;
            
            const Y = idctBlock[dy][dx];
            const Cb = blockCb[dy][dx];
            const Cr = blockCr[dy][dx];

            // YCbCr to RGB formulas
            let r = Math.round(Y + 1.402 * (Cr - 128));
            let g = Math.round(Y - 0.3441 * (Cb - 128) - 0.7141 * (Cr - 128));
            let b = Math.round(Y + 1.772 * (Cb - 128));

            // Clamp channels to valid bounds
            data[pxIndex] = Math.max(0, Math.min(255, r));
            data[pxIndex + 1] = Math.max(0, Math.min(255, g));
            data[pxIndex + 2] = Math.max(0, Math.min(255, b));
          }
        }

      }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;

  } catch (error) {
    console.error('[WatermarkEngine] Failed to embed watermark:', error);
    throw error;
  }
}

/**
 * Extracts and decodes the hidden watermark string key from the canvas Y channel.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Watermarked image canvas
 * @returns {Promise<string>} Decoded watermark text
 */
export async function extractWatermark(canvas) {
  try {
    if (!canvas) {
      throw new TypeError('Canvas parameter is required');
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const bits = [];
    const cols = Math.floor(width / BLOCK_SIZE) * BLOCK_SIZE;
    const rows = Math.floor(height / BLOCK_SIZE) * BLOCK_SIZE;

    // Loop through blocks to extract bit values
    for (let by = 0; by < rows; by += BLOCK_SIZE) {
      for (let bx = 0; bx < cols; bx += BLOCK_SIZE) {
        
        const blockY = Array.from({ length: BLOCK_SIZE }, () => new Array(BLOCK_SIZE).fill(0));

        for (let dy = 0; dy < BLOCK_SIZE; dy++) {
          for (let dx = 0; dx < BLOCK_SIZE; dx++) {
            const pxIndex = ((by + dy) * width + (bx + dx)) * 4;
            const r = data[pxIndex];
            const g = data[pxIndex + 1];
            const b = data[pxIndex + 2];
            blockY[dy][dx] = 0.299 * r + 0.587 * g + 0.114 * b;
          }
        }

        const dctBlock = dct2D(blockY);
        const val = dctBlock[4][4];

        // QIM Demodulation
        const quantized = Math.round(val / QUANTIZATION_STEP) * QUANTIZATION_STEP;
        const diff = val - quantized;
        
        bits.push(diff >= 0 ? 1 : 0);
      }
    }

    const decodedText = bitsToText(bits);
    console.log(`[WatermarkEngine] Watermark extracted: "${decodedText}"`);
    return decodedText;

  } catch (error) {
    console.error('[WatermarkEngine] Failed to extract watermark:', error);
    throw error;
  }
}
