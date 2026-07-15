import { fileToCanvas, runScanPipeline } from './scanService.js';
import { applyRedactions } from './blurService.js';
import { applyAdversarialCloak, applyWatermark } from './aiService.js';
import { generatePHash } from '../ai/hashing/perceptualHash.js';
import { generateWHash } from '../ai/hashing/waveletHash.js';

/**
 * Privacy Shield Orchestration Service (Final Version)
 * 
 * Responsibility:
 * - Coordinates the complete, sequentially coupled client-side protection loop.
 * - Converts input image Files to canvas buffers.
 * - Computes perceptual (pHash) and wavelet (wHash) fingerprints from the ORIGINAL canvas
 *   before any edits or filters are drawn, preserving document identity.
 * - Runs the multi-modal scan detection pipeline.
 * - Evaluates risk levels and applies conditional alterations on cloned canvas states:
 *   1. Solid color redaction / pixelation / Gaussian blur masking.
 *   2. Structured adversarial AI cloaking (Sine/Cosine checkerboard wave).
 *   3. Invisible DCT frequency-domain watermarking (QIM on Y luminance).
 * - Converts the final canvas buffer back to a standard browser File object.
 * 
 * Input/Output Contract:
 * - Input: File (original upload), settings (Object)
 * - Output: Promise<{
 *     success: boolean,
 *     protectedFile: File,
 *     phash: string,
 *     whash: string,
 *     metadata: { name: string, size: number, type: string },
 *     detections: Object[],
 *     risk: 'low'|'medium'|'high'|'critical',
 *     error?: string
 *   }>
 * 
 * Interacts with:
 * - extension/src/services/scanService.js
 * - extension/src/services/blurService.js
 * - extension/src/ai/hashing/ (perceptualHash.js, waveletHash.js)
 * - extension/src/ai/cloaking/ (aiCloak.js)
 * - extension/src/ai/watermark/ (watermarkEngine.js)
 */

/**
 * Converts an HTMLCanvasElement back to a browser File object.
 * 
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Target canvas
 * @param {string} originalName - Original filename
 * @param {string} mimeType - Original MIME type
 * @returns {Promise<File>} The new protected File
 */
export function canvasToFile(canvas, originalName, mimeType) {
  return new Promise((resolve, reject) => {
    if (!canvas) {
      return reject(new TypeError('Canvas parameter is required'));
    }

    const securedName = originalName.replace(/(\.[\w\d]+)$/, '_protected$1');

    if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
      canvas.convertToBlob({ type: mimeType })
        .then((blob) => {
          if (!blob) {
            return reject(new Error('Failed to extract binary blob from offscreen canvas'));
          }
          const file = new File([blob], securedName, { 
            type: mimeType, 
            lastModified: Date.now() 
          });
          resolve(file);
        })
        .catch(reject);
    } else {
      if (typeof canvas.toBlob !== 'function') {
        return reject(new TypeError('Canvas does not support toBlob operations'));
      }
      canvas.toBlob((blob) => {
        if (!blob) {
          return reject(new Error('Failed to extract binary blob from canvas'));
        }
        const file = new File([blob], securedName, { 
          type: mimeType, 
          lastModified: Date.now() 
        });
        resolve(file);
      }, mimeType);
    }
  });
}

/**
 * Processes an input File through the entire protection pipeline based on user settings.
 * 
 * Pipeline flow:
 * File -> Canvas -> Hash (pHash/wHash) -> Scan (OCR/Detection) -> Decision 
 *      -> Redaction Masking -> AI Cloaking -> DCT Watermark -> File Output
 * 
 * @param {File} file - Original uploaded File
 * @param {Object} settings - User settings configuration
 * @returns {Promise<{
 *   success: boolean,
 *   protectedFile: File,
 *   phash: string,
 *   whash: string,
 *   metadata: { name: string, size: number, type: string },
 *   detections: Object[],
 *   risk: 'low'|'medium'|'high'|'critical'
 * }>} Protected file and scan metrics report
 */
export async function protectImagePipeline(file, settings = {}) {
  console.log(`[ProtectService] Initiating final protection pipeline for: ${file.name}`);
  const startTime = Date.now();

  try {
    // 1. Convert original File to Canvas buffer
    const canvas = await fileToCanvas(file);

    // 2. Generate content-identifying fingerprints from the ORIGINAL image
    // (Hashes are computed before protection filters so they identify the source content identity)
    const phash = await generatePHash(canvas);
    const whash = await generateWHash(canvas);

    console.log(`[ProtectService] Generated original fingerprints:`, { phash, whash });

    // 3. Run the Scan Pipeline to detect PII threats (uses settings for OCR/Threshold limits)
    const scanResult = await runScanPipeline(file, { preprocess: settings });
    if (!scanResult.success) {
      throw new Error(`Scanning phase failed: ${scanResult.error}`);
    }

    // 4. Evaluate Protection Decision: apply filters if risk matches threshold or if forced
    const shouldProtect = scanResult.riskLevel !== 'low' || settings.autoRedact;

    if (!shouldProtect) {
      console.log('[ProtectService] Document evaluated as low risk. Skipping edits.');
      return {
        success: true,
        originalFile: file,
        protectedFile: file, // Return original file unmodified
        phash,
        whash,
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type
        },
        detections: [],
        risk: scanResult.riskLevel,
        protectionSummary: {
          processingTime: Date.now() - startTime,
          redacted: false
        }
      };
    }

    console.log(`[ProtectService] Applying visual protections (Mode: ${settings.blurMode || 'redact'})...`);

    // 5. Apply Solid Black / Gaussian Blur / Block Pixelation redactions
    let modifiedCanvas = await applyRedactions(canvas, scanResult.detections, settings);

    // 6. Apply Adversarial AI Cloaking (if enabled)
    if (settings.aiCloakEnabled) {
      modifiedCanvas = await applyAdversarialCloak(modifiedCanvas, 5);
    }

    // 7. Apply Invisible DCT Watermarking (if enabled)
    if (settings.watermarkEnabled) {
      modifiedCanvas = await applyWatermark(modifiedCanvas, 'SafeLens_Protected_Asset');
    }

    // 8. Convert the final modified Canvas back into a File object
    const protectedFile = await canvasToFile(modifiedCanvas, file.name, file.type);

    console.log(`[ProtectService] Protection pipeline complete. Output file: ${protectedFile.name}`);

    return {
      success: true,
      originalFile: file,
      protectedFile,
      phash,
      whash,
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      detections: scanResult.detections,
      risk: scanResult.riskLevel,
      protectionSummary: {
        processingTime: Date.now() - startTime,
        redacted: true
      }
    };

  } catch (error) {
    console.error('[ProtectService] Critical pipeline crash:', error);
    return {
      success: false,
      originalFile: file,
      protectedFile: file, // Fallback to original file on failure
      phash: '',
      whash: '',
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      detections: [],
      risk: 'low',
      protectionSummary: {
        processingTime: Date.now() - startTime,
        redacted: false
      },
      error: error instanceof Error ? error.message : 'Unknown protection pipeline failure'
    };
  }
}
