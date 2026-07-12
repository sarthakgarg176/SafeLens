import { redactImageRegions } from './aiService.js';

/**
 * Redaction Coordination Service
 * 
 * Responsibility:
 * - Extracts bounding box coordinates from PII detection objects.
 * - Coordinates the execution of canvas blurring or solid color painting.
 * - Returns the redacted/protected canvas.
 * 
 * Interacts with:
 * - extension/src/services/aiService.js (Invokes the redaction API)
 */

/**
 * Applies visual redaction masks on canvas pixels corresponding to detections.
 * 
 * @param {HTMLCanvasElement} canvas - Target image canvas
 * @param {Object[]} detections - List of validated PII detections with bboxes
 * @param {Object} [settings] - Visual settings preferences
 * @param {'redact'|'blur'} [settings.blurMode='redact'] - Masking style selection
 * @returns {Promise<HTMLCanvasElement>} Redacted canvas
 */
export async function applyRedactions(canvas, detections, settings = {}) {
  const { blurMode = 'redact' } = settings;

  try {
    if (!canvas) {
      throw new TypeError('Canvas parameter is required');
    }

    if (!Array.isArray(detections) || detections.length === 0) {
      return canvas; // No detections to redact
    }

    // Extract all bounding boxes from detections list
    const regions = [];
    detections.forEach((detection) => {
      if (Array.isArray(detection.bboxes)) {
        // Collect each box segment
        detection.bboxes.forEach((bbox) => {
          regions.push({
            x: bbox.x,
            y: bbox.y,
            width: bbox.width,
            height: bbox.height
          });
        });
      }
    });

    if (regions.length === 0) {
      console.log('[BlurService] No bounding boxes found in detections. Skipping redaction.');
      return canvas;
    }

    console.log(`[BlurService] Requesting redaction of ${regions.length} bounding boxes in mode: ${blurMode}`);
    
    // Call the AI gateway to apply masks
    const redactedCanvas = await redactImageRegions(canvas, regions, blurMode);

    return redactedCanvas;

  } catch (error) {
    console.error('[BlurService] Redaction processing failed:', error);
    throw error;
  }
}
