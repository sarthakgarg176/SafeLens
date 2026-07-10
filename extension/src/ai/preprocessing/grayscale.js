/**
 * Grayscale Image Preprocessor
 * 
 * Responsibility:
 * - Converts color images (RGB/RGBA) into grayscale.
 * - Improves text contrast for OCR processing.
 * 
 * Input/Output Contract:
 * - Input: HTMLCanvasElement or ImageData
 * - Output: Promise<HTMLCanvasElement> (Grayscale rendered canvas)
 * 
 * Interacts with:
 * - extension/src/ai/preprocessing/preprocessImage.js (Invokes this as step 1)
 */

/**
 * Converts a colored canvas or image data object to grayscale.
 * 
 * @param {HTMLCanvasElement|ImageData} imageSource - The source canvas or image pixel data
 * @returns {Promise<HTMLCanvasElement>} A promise resolving to a new canvas containing grayscale pixels
 * @throws {TypeError} If the input is not a valid Canvas or ImageData
 */
export async function toGrayscale(imageSource) {
  try {
    if (!imageSource) {
      throw new TypeError('Image source is required');
    }

    // Determine canvas and context
    let canvas;
    let ctx;

    if (imageSource instanceof HTMLCanvasElement) {
      canvas = document.createElement('canvas');
      canvas.width = imageSource.width;
      canvas.height = imageSource.height;
      ctx = canvas.getContext('2d');
      ctx.drawImage(imageSource, 0, 0);
    } else if (imageSource instanceof ImageData) {
      canvas = document.createElement('canvas');
      canvas.width = imageSource.width;
      canvas.height = imageSource.height;
      ctx = canvas.getContext('2d');
      ctx.putImageData(imageSource, 0, 0);
    } else {
      throw new TypeError('Invalid input type. Must be HTMLCanvasElement or ImageData.');
    }

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Apply grayscale conversion (using luminosity coefficients)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Luminosity formula: 0.299R + 0.587G + 0.114B
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      data[i] = gray;     // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
      // Alpha channel (data[i+3]) remains unmodified
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;

  } catch (error) {
    console.error('[Grayscale] Error converting image:', error);
    throw error;
  }
}
