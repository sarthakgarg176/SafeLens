/**
 * canvas-redactor.js - SafeLens Canvas Drawing Utility
 * Handles precise bounding box masking, blur overlays, and watermark drawing.
 */

export function redactCanvas(canvas, boxes = [], options = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const {
    watermarkText = 'SAFELENS DECOY - PII PROTECTED',
    enableWatermark = true,
    padding = 4
  } = options;

  // 1. Draw Precise Bounding Boxes (if provided by Backend API)
  if (boxes && boxes.length > 0) {
    ctx.fillStyle = '#000000';
    boxes.forEach(box => {
      // Coordinates mapping: [x_min, y_min, x_max, y_max] or {x, y, w, h}
      let x = box.x ?? box.coords?.[0] ?? 0;
      let y = box.y ?? box.coords?.[1] ?? 0;
      let w = box.w ?? (box.coords ? box.coords[2] - box.coords[0] : 0);
      let h = box.h ?? (box.coords ? box.coords[3] - box.coords[1] : 0);

      // Apply padding offset
      const drawX = Math.max(0, x - padding);
      const drawY = Math.max(0, y - padding);
      const drawW = Math.min(canvas.width - drawX, w + (padding * 2));
      const drawH = Math.min(canvas.height - drawY, h + (padding * 2));

      ctx.fillRect(drawX, drawY, drawW, drawH);
    });
  }

  // 2. Apply Diagonal Watermark Overlay
  if (enableWatermark) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 0, 0, 0.45)';
    const fontSize = Math.max(20, Math.floor(canvas.width / 14));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText(watermarkText, 0, 0);
    ctx.restore();
  }

  return canvas;
}