/**
 * Coordinate Box Consolidation
 * 
 * Responsibility:
 * - Operates strictly at the coordinate boundary level.
 * - Resolves intersecting boxes into a single bounding wrapper box.
 * - Prevents multiple visual redraw overlap anomalies on the target canvas.
 * 
 * Input/Output Contract:
 * - Input: Object[] (List of raw box coordinates: { x, y, width, height })
 * - Output: Object[] (Consolidated list of non-overlapping wrapper box coordinates)
 * 
 * Interacts with:
 * - extension/src/ai/detection/mergeDetections.js (Underlying logic resolver)
 * - extension/src/ai/blur/redactCanvas.js (Provides coordinates for drawing)
 */

/**
 * Merges overlapping boxes into a list of consolidated bounding boxes.
 * 
 * @param {Object[]} boxes - Raw bounding boxes: { x, y, width, height }
 * @returns {Object[]} Consolidated bounding boxes
 */
export function mergeBoxes(boxes) {
  if (!Array.isArray(boxes) || boxes.length <= 1) {
    return boxes || [];
  }

  console.log(`[MergeBoundingBoxes] Consolidating ${boxes.length} bounding boxes...`);

  // Basic union algorithm implementation
  const merged = [];
  const sorted = [...boxes].sort((a, b) => a.x - b.x); // Sort by x coordinate

  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    // Check overlap condition
    const isXOverlap = next.x <= current.x + current.width;
    const isYOverlap = (next.y <= current.y + current.height) && (current.y <= next.y + next.height);

    if (isXOverlap && isYOverlap) {
      // Merge next box into current
      const xMax = Math.max(current.x + current.width, next.x + next.width);
      const yMin = Math.min(current.y, next.y);
      const yMax = Math.max(current.y + current.height, next.y + next.height);

      current.x = current.x; // Remains unchanged as we sorted by x
      current.width = xMax - current.x;
      current.y = yMin;
      current.height = yMax - yMin;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  
  merged.push(current);
  console.log(`[MergeBoundingBoxes] Consolidated into ${merged.length} final bounding boxes.`);
  return merged;
}
