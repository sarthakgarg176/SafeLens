import { redactImageRegions } from './aiService.js';

/**
 * Redaction Coordination Service
 */

export async function applyRedactions(canvas, detections, settings = {}) {
  const { blurMode = 'redact' } = settings;

  try {
    if (!canvas) {
      throw new TypeError('Canvas parameter is required');
    }

    if (!Array.isArray(detections) || detections.length === 0) {
      return canvas;
    }

    const regions = [];
    detections.forEach((detection) => {
      if (Array.isArray(detection.bboxes)) {
        detection.bboxes.forEach((bbox) => {
          // THE FIX: Strict validation to ensure we only push valid visual coordinates
          if (bbox && typeof bbox.x === 'number' && typeof bbox.width === 'number' && bbox.width > 0 && bbox.height > 0) {
            regions.push({
              x: bbox.x,
              y: bbox.y,
              width: bbox.width,
              height: bbox.height
            });
          }
        });
      }
    });

    if (regions.length === 0) {
      console.log('[BlurService] No bounding boxes found in detections. Skipping redaction.');
      return canvas;
    }

    console.log(`[BlurService] Requesting redaction of ${regions.length} bounding boxes in mode: ${blurMode}`);
    
    const redactedCanvas = await redactImageRegions(canvas, regions, blurMode);

    return redactedCanvas;

  } catch (error) {
    console.error('[BlurService] Redaction processing failed:', error);
    throw error;
  }
}