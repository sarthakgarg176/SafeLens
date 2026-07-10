# Prompt: Canvas Redaction and Pixelation

You are a Graphics Programmer. Write canvas manipulation routines to redact target regions.

## Requirements
- Operate on an HTMLCanvasElement with a list of coordinate boxes.
- Implement an overlapping box merge algorithm (bounding box union) to optimize coordinate blocks.
- Add customizable padding margins around bounding box borders to prevent character edge pixel leaks.
- Implement a solid fill block drawing routine (`redactCanvasRegions`) to completely cover target pixels.
- Implement a pixelation filter (`blurCanvasRegions`) that divides target regions into grid cells and averages pixel color values within each cell.
- Ensure all coordinate targets are clamped within the canvas boundary limits.
