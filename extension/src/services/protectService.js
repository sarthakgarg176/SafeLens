import { fileToCanvas, runScanPipeline } from './scanService.js';
import { applyRedactions } from './blurService.js';
import { applyAdversarialCloak, applyWatermark } from './aiService.js';

/**
 * Privacy Shield Orchestration Service
 * 
 * Responsibility:
 * - Directs the complete security processing loop for file uploads.
 * - Converts files to canvas, runs OCR/scan detection, and evaluates protection decisions.
 * - Progressively applies:
 *   1. Solid/Blur Redactions
 *   2. Adversarial Cloaking (Adversarial noise)
 *   3. Invisible Ownership Watermarking
 * - Converts the final canvas buffer back to a standard browser File object.
 * 
 * Interacts with:
 * - extension/src/services/scanService.js
 * - extension/src/services/blurService.js
 * - extension/src/services/aiService.js
 */

/**
 * Converts an HTMLCanvasElement back to a browser File object.
 * 
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {string} originalName - Original filename
 * @param {string} mimeType - Original MIME type
 * @returns {Promise<File>} The new protected File
 */
export function canvasToFile(canvas, originalName, mimeType) {
  return new Promise((resolve, reject) => {
    if (!canvas) {
      return reject(new TypeError('Canvas parameter is required'));
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        return reject(new Error('Failed to extract binary blob from canvas'));
      }
      
      // Append a secure tag to the filename
      const securedName = originalName.replace(/(\.[\w\d]+)$/, '_protected$1');
      const file = new File([blob], securedName, { 
        type: mimeType, 
        lastModified: Date.now() 
      });
      
      resolve(file);
    }, mimeType);
  });
}

/**
 * Processes an input File through the entire protection pipeline based on user settings.
 * 
 * Pipeline flow:
 * OpenCV/Preprocess -> OCR -> Detection -> Confidence Fusion -> Risk Analysis 
 *    -> Decision -> Redaction Masking -> AI Cloaking -> DCT Watermark -> File Output
 * 
 * @param {File} file - Original uploaded File
 * @param {Object} settings - User settings configuration
 * @returns {Promise<{
 *   success: boolean,
 *   protectedFile: File,
 *   scanResult: Object
 * }>} Protected file and scan metrics report
 */
export async function protectImagePipeline(file, settings = {}) {
  console.log(`[ProtectService] Starting protection pipeline for: ${file.name}`);

  try {
    // 1. Convert File to Canvas (needed for redaction and modifications)
    const canvas = await fileToCanvas(file);

    // 2. Run the Scan Pipeline to detect threats
    const scanResult = await runScanPipeline(file, { preprocess: settings });
    if (!scanResult.success) {
      throw new Error(`Scanning phase failed: ${scanResult.error}`);
    }

    // 3. Make Decision: Apply protection if risk is detected or if forced in settings
    const shouldProtect = scanResult.riskLevel !== 'low' || settings.autoRedact;
    
    if (!shouldProtect) {
      console.log('[ProtectService] Risk is LOW. Skipping protection adjustments.');
      return {
        success: true,
        protectedFile: file, // Return original file unmodified
        scanResult
      };
    }

    console.log('[ProtectService] Threat detected. Applying protective alterations...');

    // 4. Apply solid color redaction or pixelation blurs
    let modifiedCanvas = await applyRedactions(canvas, scanResult.detections, settings);

    // 5. Apply Adversarial AI Cloaking if enabled
    if (settings.aiCloakEnabled) {
      modifiedCanvas = await applyAdversarialCloak(modifiedCanvas, 5);
    }

    // 6. Apply Invisible Watermarking if enabled
    if (settings.watermarkEnabled) {
      modifiedCanvas = await applyWatermark(modifiedCanvas, 'SafeLens_Protected_Asset');
    }

    // 7. Convert the final modified Canvas back into a File object
    const protectedFile = await canvasToFile(modifiedCanvas, file.name, file.type);

    console.log(`[ProtectService] Protection pipeline complete. Output file: ${protectedFile.name}`);

    return {
      success: true,
      protectedFile,
      scanResult
    };

  } catch (error) {
    console.error('[ProtectService] Protection pipeline failed:', error);
    return {
      success: false,
      protectedFile: file, // Fallback to original file on failure
      scanResult: null,
      error: error instanceof Error ? error.message : 'Unknown protection pipeline failure'
    };
  }
}
