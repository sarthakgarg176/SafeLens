import { fileToCanvas, runScanPipeline } from './scanService.js';
import { applyRedactions } from './blurService.js';
import { applyAdversarialCloak, applyWatermark } from './aiService.js';
import { generatePHash } from '../ai/hashing/perceptualHash.js';
import { generateWHash } from '../ai/hashing/waveletHash.js';

export function canvasToFile(canvas, originalName, mimeType) {
  return new Promise((resolve, reject) => {
    if (!canvas) {
      return reject(new TypeError('Canvas parameter is required'));
    }

    const securedName = originalName.replace(/(\.[\w\d]+)$/, '_protected$1');

    if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
      canvas.convertToBlob({ type: mimeType })
        .then((blob) => {
          if (!blob) return reject(new Error('Failed to extract binary blob from offscreen canvas'));
          resolve(new File([blob], securedName, { type: mimeType, lastModified: Date.now() }));
        }).catch(reject);
    } else {
      if (typeof canvas.toBlob !== 'function') {
        return reject(new TypeError('Canvas does not support toBlob operations'));
      }
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Failed to extract binary blob from canvas'));
        resolve(new File([blob], securedName, { type: mimeType, lastModified: Date.now() }));
      }, mimeType);
    }
  });
}

export async function protectImagePipeline(file, settings = {}) {
  console.log(`[ProtectService] Initiating final protection pipeline for: ${file.name}`);
  const startTime = Date.now();

  try {
    const canvas = await fileToCanvas(file);
    const phash = await generatePHash(canvas);
    const whash = await generateWHash(canvas);

    console.log(`[ProtectService] Generated original fingerprints:`, { phash, whash });

    const scanResult = await runScanPipeline(file, { preprocess: settings });
    if (!scanResult.success) {
      throw new Error(`Scanning phase failed: ${scanResult.error}`);
    }

    const shouldProtect = scanResult.riskLevel !== 'low' || settings.autoRedact;

    if (!shouldProtect) {
      console.log('[ProtectService] Document evaluated as low risk. Skipping edits.');
      return {
        success: true,
        originalFile: file,
        protectedFile: file,
        phash,
        whash,
        metadata: { name: file.name, size: file.size, type: file.type },
        detections: [],
        risk: scanResult.riskLevel,
        protectionSummary: { processingTime: Date.now() - startTime, redacted: false }
      };
    }

    console.log(`[ProtectService] Applying visual protections (Mode: ${settings.blurMode || 'redact'})...`);

    // Redaction engine will now receive proper coordinates
    let modifiedCanvas = await applyRedactions(canvas, scanResult.detections, settings);

    if (settings.aiCloakEnabled) {
      modifiedCanvas = await adversarialCloak(modifiedCanvas, 5);
    }

    if (settings.watermarkEnabled) {
      modifiedCanvas = await applyWatermark(modifiedCanvas, 'SafeLens_Protected_Asset');
    }

    const protectedFile = await canvasToFile(modifiedCanvas, file.name, file.type);

    console.log(`[ProtectService] Protection pipeline complete. Output file: ${protectedFile.name}`);

    return {
      success: true,
      originalFile: file,
      protectedFile,
      phash,
      whash,
      metadata: { name: file.name, size: file.size, type: file.type },
      detections: scanResult.detections,
      risk: scanResult.riskLevel,
      protectionSummary: { processingTime: Date.now() - startTime, redacted: true }
    };

  } catch (error) {
    console.error('[ProtectService] Critical pipeline crash:', error);
    return {
      success: false,
      originalFile: file,
      protectedFile: file, 
      phash: '',
      whash: '',
      metadata: { name: file.name, size: file.size, type: file.type },
      detections: [],
      risk: 'low',
      protectionSummary: { processingTime: Date.now() - startTime, redacted: false },
      error: error instanceof Error ? error.message : 'Unknown protection pipeline failure'
    };
  }
}