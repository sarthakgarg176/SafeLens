import { redactImageRegions } from './aiService.js';

/**
 * Redaction Coordination Service
 * Updated to bypass ALL geometric limits (small/large, width/height, area) for CRITICAL PII.
 */

export async function applyRedactions(canvas, detections, settings = {}) {
  const { blurMode = 'redact' } = settings;
  
  // SMART GEOMETRY LIMITS (For general text/noise filtering)
  const MIN_BOX_AREA = 800;      
  const MAX_BOX_AREA = 30000;    
  const MAX_BOX_HEIGHT = 80;     

  try {
    if (!canvas) {
      throw new TypeError('Canvas parameter is required');
    }

    if (!Array.isArray(detections) || detections.length === 0) {
      return canvas;
    }

    const regions = [];
    detections.forEach((detection) => {
      // Treat Aadhaar, PAN, and QR Codes equally for ALL size limit bypasses
      const isCritical = ['AADHAAR', 'PAN', 'QR_CODE'].includes(detection.type) || detection.severity === 'critical';

      if (Array.isArray(detection.bboxes)) {
        detection.bboxes.forEach((bbox) => {
          const area = bbox.width * bbox.height;
          
          if (
            bbox && 
            typeof bbox.x === 'number' && 
            typeof bbox.width === 'number' && 
            // 🚀 THE ULTIMATE FIX: Critical items bypass ALL constraints, including hardcoded width/height
            (isCritical || bbox.width > 20) && 
            (isCritical || bbox.height > 10) && 
            (isCritical || bbox.height <= MAX_BOX_HEIGHT) && 
            (isCritical || area >= MIN_BOX_AREA) && 
            (isCritical || area <= MAX_BOX_AREA)             
          ) {
            regions.push({
              x: bbox.x,
              y: bbox.y,
              width: bbox.width,
              height: bbox.height
            });
          } else {
            console.log(`[BlurService] Ignored invalid/oversized/tiny box: ${bbox.width}x${bbox.height} (Type: ${detection.type})`);
          }
        });
      }
    });

    if (regions.length === 0) {
      console.log('[BlurService] No valid bounding boxes found. Skipping redaction.');
      return canvas;
    }

    console.log(`[BlurService] Requesting redaction of ${regions.length} geometric-verified boxes in mode: ${blurMode}`);
    
    const redactedCanvas = await redactImageRegions(canvas, regions, blurMode);

    return redactedCanvas;

  } catch (error) {
    console.error('[BlurService] Redaction processing failed:', error);
    throw error;
  }
}