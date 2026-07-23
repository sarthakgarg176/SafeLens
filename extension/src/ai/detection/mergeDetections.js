/**
 * Bounding Box and Detection Merging Engine
 * Aggressively tuned for high-resolution images to merge widely spaced text blocks (like Aadhaar).
 */

export function mergeAdjacentBoxes(boxes) {
  if (!Array.isArray(boxes) || boxes.length <= 1) return boxes;

  // Sort boxes left-to-right (by X coordinate)
  const sorted = [...boxes].sort((a, b) => a.x - b.x); 
  const merged = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    const currentYMax = current.y + current.height;
    const nextYMax = next.y + next.height;
    const verticalOverlap = Math.min(currentYMax, nextYMax) - Math.max(current.y, next.y);
    
    // 🚀 AGGRESSIVE FIX: Horizontal distance threshold increased to 150px
    // This ensures that even in very high-resolution images, the large gaps between Aadhaar blocks are ignored and they are merged into one solid box.
    const horizontalDistance = next.x - (current.x + current.width);

    if (verticalOverlap > 0 && horizontalDistance <= 150) { 
      const x0 = Math.min(current.x, next.x);
      const y0 = Math.min(current.y, next.y);
      const x1 = Math.max(current.x + current.width, next.x + next.width);
      const y1 = Math.max(currentYMax, nextYMax);

      current = {
        x: x0,
        y: y0,
        width: x1 - x0,
        height: y1 - y0,
        confidence: Math.max(current.confidence || 100, next.confidence || 100)
      };
    } else {
      merged.push(current);
      current = next;
    }
  }

  merged.push(current);
  return merged;
}

export function mergeOverlappingDetections(detections) {
  if (!Array.isArray(detections) || detections.length === 0) return [];
  
  // First, merge bboxes internally for EVERY detection immediately
  const prepared = detections.map(d => ({
      ...d,
      bboxes: mergeAdjacentBoxes(d.bboxes || [])
  }));

  // Sort and merge detections logic
  const sorted = prepared.sort((a, b) => (a.startIndex || 0) - (b.startIndex || 0));
  const merged = [];
  
  if (sorted.length === 0) return [];
  
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    
    // Overlap exists if next starts before current ends + 5 char buffer
    const currentEnd = current.endIndex || 0;
    const nextStart = next.startIndex || 0;

    if (nextStart <= currentEnd + 5) { 
      current = {
        ...current,
        endIndex: Math.max(currentEnd, next.endIndex || 0),
        bboxes: mergeAdjacentBoxes([...(current.bboxes || []), ...(next.bboxes || [])])
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  
  merged.push(current);
  return merged;
}