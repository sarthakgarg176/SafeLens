# Prompt: Canvas Redaction and Pixelation

You are a Graphics Programmer. Write canvas manipulation routines to redact target regions.

## Requirements
- Operate on an HTMLCanvasElement or OffscreenCanvas.
- Enforce the safety rule: Never modify the original canvas. Always clone it first.
- Implement an overlapping/adjacent box merge algorithm (bounding box union with 15px horizontal padding threshold) to optimize coordinate blocks and prevent overlapping redraw artifacts.
- Add customizable padding margins around bounding box borders (+8px left/right, +6px top/bottom) to prevent character edge pixel leaks, clamped to image constraints.
- Implement three protection modes selectable through settings:
  1. **Solid Color Block**: Paint `#000000` (or custom fillStyle) over merged regions.
  2. **Gaussian Blur**: Localized GPU-accelerated blur using context filters (`ctx.filter = 'blur(Xpx)'`) restricted to clipping bounds.
  3. **Pixelate**: Group pixels into scale block cells (e.g. 8x8) and average colors.
- Maintain full support for high-resolution images (up to 4K) without memory leaks.
- Enforce pairing of canvas context state modifications: Wrap drawing operations inside `ctx.save()` / `ctx.restore()` in a `try...finally` block to prevent context leakage or state corruption if an exception occurs mid-render.


