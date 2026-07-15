/**
 * Bounding Box and Detection Merging Engine
 * 
 * Responsibility:
 * - Consolidates overlapping and adjacent detection text records.
 * - Resolves duplication when a single text range triggers multiple pattern categories.
 * - Merges horizontally adjacent/overlapping bounding boxes belonging to the same PII block.
 * - Ensures output detections are clean, isolated, and optimal for rendering.
 * 
 * Input/Output Contract:
 * - Input: Object[] (Validated PII detections)
 * - Output: Object[] (Consolidated, unique detections with merged boxes)
 * 
 * Interacts with:
 * - extension/src/ai/detection/confidenceFusion.js
 */

/**
 * Merges adjacent bounding box coordinates located on the same horizontal line.
 * Combines bounding blocks separated by less than 15 horizontal pixels into a single box.
 * 
 * @param {Object[]} boxes - Raw coordinates: { x, y, width, height, confidence }
 * @returns {Object[]} Merged coordinates
 */
export function mergeAdjacentBoxes(boxes) {
  if (!Array.isArray(boxes) || boxes.length <= 1) {
    return boxes;
  }

  // Sort boxes left-to-right (by X coordinate)
  const sorted = [...boxes].sort((a, b) => a.x - b.x);
  const merged = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    // Check vertical overlap alignment (same horizontal text line)
    const currentYMax = current.y + current.height;
    const nextYMax = next.y + next.height;
    const verticalOverlap = Math.min(currentYMax, nextYMax) - Math.max(current.y, next.y);

    // Calculate horizontal spacing distance
    const horizontalDistance = next.x - (current.x + current.width);

    // Merge if aligned and horizontal space is under 15 pixels
    if (verticalOverlap > 0 && horizontalDistance <= 15) {
      const x0 = Math.min(current.x, next.x);
      const y0 = Math.min(current.y, next.y);
      const x1 = Math.max(current.x + current.width, next.x + next.width);
      const y1 = Math.max(currentYMax, nextYMax);

      current = {
        x: x0,
        y: y0,
        width: x1 - x0,
        height: y1 - y0,
        confidence: Math.max(current.confidence, next.confidence)
      };
    } else {
      merged.push(current);
      current = next;
    }
  }

  merged.push(current);
  return merged;
}

/**
 * Consolidates overlapping text ranges and removes duplicative detections.
 * If ranges overlap, selects the detection with higher structural rules verification status.
 * 
 * @param {Object[]} detections - Raw candidate detections
 * @returns {Object[]} Merged unique detections list
 */
export function mergeOverlappingDetections(detections) {
  if (!Array.isArray(detections) || detections.length <= 1) {
    return detections || [];
  }

  // Sort by starting character string index
  const sorted = [...detections].sort((a, b) => a.startIndex - b.startIndex);
  const merged = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    // Overlap exists if next starts before current ends
    if (next.startIndex <= current.endIndex) {
      // Pick detection with rule validation passing status, or higher base confidence
      const preferNext = (next.rulePassed && !current.rulePassed) || 
                         (next.rulePassed === current.rulePassed && next.regexConfidence > current.regexConfidence);

      if (preferNext) {
        current = {
          ...next,
          startIndex: current.startIndex,
          endIndex: Math.max(current.endIndex, next.endIndex),
          value: current.value + next.value.substring(Math.max(0, current.endIndex - next.startIndex)),
          bboxes: mergeAdjacentBoxes([...current.bboxes, ...next.bboxes])
        };
      } else {
        current = {
          ...current,
          endIndex: Math.max(current.endIndex, next.endIndex),
          value: current.value + next.value.substring(Math.max(0, current.endIndex - next.startIndex)),
          bboxes: mergeAdjacentBoxes([...current.bboxes, ...next.bboxes])
        };
      }
    } else {
      // No overlap. Push and move cursor
      current.bboxes = mergeAdjacentBoxes(current.bboxes);
      merged.push(current);
      current = next;
    }
  }

  current.bboxes = mergeAdjacentBoxes(current.bboxes);
  merged.push(current);

  // Remove exact value duplicates if any remain
  const seenValues = new Set();
  return merged.filter((det) => {
    const key = `${det.type}_${det.startIndex}_${det.value}`;
    if (seenValues.has(key)) {
      return false;
    }
    seenValues.add(key);
    return true;
  });
}
