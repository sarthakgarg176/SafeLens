/**
 * Bounding Box Padding Adjuster
 * 
 * Responsibility:
 * - Expands bounding box boundaries to ensure complete coverage of text borders.
 * - Prevents character edge pixel leakage (which could allow human readability after redaction).
 * 
 * Input/Output Contract:
 * - Input: box ({ x, y, width, height }), paddingOptions ({ x: number, y: number })
 * - Output: Bounding Box (Expanded box clamped to image constraints)
 * 
 * Interacts with:
 * - extension/src/ai/blur/redactCanvas.js
 */

/**
 * Expands bounding box dimensions with custom padding margins.
 * Clamps coordinates within canvas boundary limits.
 * 
 * @param {Object} box - Standard bounding box: { x, y, width, height }
 * @param {number} [paddingX=6] - Horizontal padding margin to apply
 * @param {number} [paddingY=4] - Vertical padding margin to apply
 * @param {number} [canvasWidth=99999] - Maximum canvas width constraint
 * @param {number} [canvasHeight=99999] - Maximum canvas height constraint
 * @returns {Object} Expanded and clamped box
 */
export function addBoxPadding(box, paddingX = 6, paddingY = 4, canvasWidth = 99999, canvasHeight = 99999) {
  if (!box) {
    throw new TypeError('Box object is required');
  }

  // Expand coordinates
  const x = Math.max(0, box.x - paddingX);
  const y = Math.max(0, box.y - paddingY);
  
  // Calculate new width and height within limits
  const right = Math.min(canvasWidth, box.x + box.width + paddingX);
  const bottom = Math.min(canvasHeight, box.y + box.height + paddingY);
  
  const width = right - x;
  const height = bottom - y;

  return { x, y, width, height };
}
