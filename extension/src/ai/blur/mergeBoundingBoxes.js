/**
 * Coordinate Box Consolidation Engine
 * 
 * Responsibility:
 * - Operates strictly at the coordinate boundary level.
 * - Resolves intersecting and adjacent boxes into a single bounding wrapper box.
 * - Preserves associated detection details (type/value) and removes duplicate indices.
 * - Prevents multiple visual redraw overlap anomalies on the target canvas.
 * 
 * Input/Output Contract:
 * - Input: Object[] (List of raw box coordinates: { x, y, width, height, detection })
 * - Output: Object[] (Consolidated boxes: { x, y, width, height, detections: [] })
 * 
 * Interacts with:
 * - extension/src/ai/blur/redactCanvas.js (Provides coordinates for drawing)
 */

/**
 * Merges overlapping and adjacent boxes into a list of consolidated bounding boxes.
 * Groups detection source objects together inside the merged wrapper boxes.
 * 
 * @param {Object[]} boxes - Raw bounding boxes: { x, y, width, height, detection }
 * @returns {Object[]} Consolidated non-overlapping boxes
 */
export function mergeBoxes(boxes) {
  if (!Array.isArray(boxes) || boxes.length === 0) {
    return [];
  }

  if (boxes.length === 1) {
    const single = boxes[0];
    return [{
      x: single.x,
      y: single.y,
      width: single.width,
      height: single.height,
      detections: single.detection ? [single.detection] : []
    }];
  }

  console.log(`[MergeBoundingBoxes] Consolidating ${boxes.length} bounding boxes...`);

  // 1. Sort by X coordinate to prepare for linear sweep
  const sorted = [...boxes].sort((a, b) => a.x - b.x);
  const merged = [];

  let current = {
    x: sorted[0].x,
    y: sorted[0].y,
    width: sorted[0].width,
    height: sorted[0].height,
    detections: sorted[0].detection ? [sorted[0].detection] : []
  };

  // 2. Linear sweep union algorithm
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    const currentXMax = current.x + current.width;
    const currentYMax = current.y + current.height;
    const nextXMax = next.x + next.width;
    const nextYMax = next.y + next.height;

    // Check overlap boundaries (with 15px horizontal gap padding allowed for adjacent text letters)
    const isXOverlap = next.x <= currentXMax + 15;
    const isYOverlap = Math.min(currentYMax, nextYMax) - Math.max(current.y, next.y) > 0;

    if (isXOverlap && isYOverlap) {
      const xMin = Math.min(current.x, next.x);
      const xMax = Math.max(currentXMax, nextXMax);
      const yMin = Math.min(current.y, next.y);
      const yMax = Math.max(currentYMax, nextYMax);

      current.x = xMin;
      current.width = xMax - xMin;
      current.y = yMin;
      current.height = yMax - yMin;

      // Group unique detection models
      if (next.detection) {
        const duplicate = current.detections.some(
          (d) => d.type === next.detection.type && d.value === next.detection.value
        );
        if (!duplicate) {
          current.detections.push(next.detection);
        }
      }
    } else {
      merged.push(current);
      current = {
        x: next.x,
        y: next.y,
        width: next.width,
        height: next.height,
        detections: next.detection ? [next.detection] : []
      };
    }
  }

  merged.push(current);
  console.log(`[MergeBoundingBoxes] Consolidated into ${merged.length} final bounding rectangles.`);
  return merged;
}
