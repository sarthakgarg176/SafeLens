/**
 * Detection Merger
 * 
 * Responsibility:
 * - Compares bounding boxes of text detections.
 * - Merges overlapping, overlapping-adjacent, or closely matching bounding boxes.
 * - Reduces redundant box counts to optimize redacting canvas drawing.
 * 
 * Input/Output Contract:
 * - Input: Object[] (List of detections containing boxes)
 * - Output: Object[] (List of detections with consolidated/merged bounding boxes)
 * 
 * Interacts with:
 * - extension/src/ai/blur/mergeBoundingBoxes.js (Delegates spatial box logic)
 */

/**
 * Merges close or overlapping detection regions.
 * 
 * @param {Object[]} detections - Raw detections list
 * @param {number} [paddingX=10] - Horizontal spacing tolerance to trigger a merge
 * @param {number} [paddingY=5] - Vertical spacing tolerance to trigger a merge
 * @returns {Object[]} Consolidated detections list
 */
export function mergeOverlappingDetections(detections, paddingX = 10, paddingY = 5) {
  if (!Array.isArray(detections) || detections.length <= 1) {
    return detections || [];
  }

  console.log(`[MergeDetections] Consolidating box layout of ${detections.length} detections...`);

  // To simplify scaffolding, we group and return detections.
  // In production, an interval-tree or bounding-box overlap algorithm merges them.
  const merged = [];
  const processed = new Set();

  for (let i = 0; i < detections.length; i++) {
    if (processed.has(i)) continue;
    const current = detections[i];
    processed.add(i);

    // Deep-clone bboxes array to avoid mutability issues
    const currentBoxes = current.bboxes ? [...current.bboxes] : [];

    for (let j = i + 1; j < detections.length; j++) {
      if (processed.has(j)) continue;
      const target = detections[j];

      // If they are of the same type and overlap spatially, we merge their boxes
      if (current.type === target.type && isOverlap(currentBoxes, target.bboxes, paddingX, paddingY)) {
        console.log(`[MergeDetections] Merging adjacent detections of type: ${current.type}`);
        currentBoxes.push(...(target.bboxes || []));
        processed.add(j);
      }
    }

    merged.push({
      ...current,
      bboxes: currentBoxes
    });
  }

  console.log(`[MergeDetections] Consolidated layout into ${merged.length} detections.`);
  return merged;
}

/**
 * Helper to determine if two bounding box lists overlap within pixel tolerance.
 */
function isOverlap(boxListA, boxListB, paddingX, paddingY) {
  if (!boxListA || !boxListB) return false;
  
  for (const a of boxListA) {
    for (const b of boxListB) {
      // Check if coordinates overlap within padding limits
      const isXOverlap = (a.x <= b.x + b.width + paddingX) && (b.x <= a.x + a.width + paddingX);
      const isYOverlap = (a.y <= b.y + b.height + paddingY) && (b.y <= a.y + a.height + paddingY);
      
      if (isXOverlap && isYOverlap) {
        return true;
      }
    }
  }
  
  return false;
}
