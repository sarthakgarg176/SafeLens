/**
 * SafeLens Chrome Extension Canvas Redaction Utility
 *
 * Implements localized obscuring effects (native filter blur and styled boundary overlays)
 * on a canvas layer using OffscreenCanvas and ImageBitmap.
 */

/**
 * Asynchronously applies visual redaction to an image source at specific bounding boxes.
 *
 * @param {string} imageSrc The base64 data URL or URL of the image asset.
 * @param {Array} boundingBoxes An array of coordinate blocks: { x, y, width, height }.
 * @returns {Promise<string>} A promise resolving to the redacted image as a base64 data URL.
 */
export async function applyCanvasRedaction(imageSrc, boundingBoxes) {
  if (!imageSrc) {
    throw new Error("Missing image source asset.");
  }
  if (!boundingBoxes || !Array.isArray(boundingBoxes) || boundingBoxes.length === 0) {
    return imageSrc;
  }

  // 1. Load image asset as a Blob and create ImageBitmap
  const response = await fetch(imageSrc);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  // 2. Setup OffscreenCanvas representing the image dimensions
  const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  const ctx = canvas.getContext('2d');
  
  // Draw the original image onto the canvas
  ctx.drawImage(imageBitmap, 0, 0);

  // 3. Iterate through bounding coordinates and apply local blur & borders
  boundingBoxes.forEach(box => {
    const { x, y, width, height } = box;

    // Apply native context filter blur within a clipped zone
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();

    ctx.filter = 'blur(12px)';
    ctx.drawImage(imageBitmap, 0, 0);
    ctx.restore();

    // Apply stylized visual overlay mask and border matching product branding
    ctx.fillStyle = 'rgba(15, 17, 26, 0.45)';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, width, height);
  });

  // 4. Convert OffscreenCanvas contents back to base64 data URL
  const outputBlob = await canvas.convertToBlob({ type: 'image/png' });
  const arrayBuffer = await outputBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  const base64 = btoa(binary);
  return `data:image/png;base64,${base64}`;
}
