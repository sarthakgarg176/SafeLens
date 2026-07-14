import { runOCROnWorker } from './tesseractWorker.js';
import { extractBoundingBoxes } from './extractBoundingBoxes.js';
import { executeOffscreenTask } from '../../background/offscreenManager.js';

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function recognizeImage(canvas) {
  try {
    // ==========================================
    // PATH 1: SERVICE WORKER (Delegates to Offscreen via Dedicated Channel)
    // ==========================================
    if (typeof document === 'undefined' && typeof chrome !== 'undefined' && chrome.offscreen) {
      if (!canvas.width || !canvas.height) {
        throw new Error(`[RecognizeImage] Canvas dimensions are invalid (W:${canvas.width}, H:${canvas.height}) before OCR.`);
      }

      // 🚀 THE FIX: Convert OffscreenCanvas to a PNG Blob, then to ArrayBuffer, then Base64
      // This creates an actual PNG file instead of passing raw RGBA pixel data
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      
      if (!blob || blob.size === 0) {
        throw new Error(`[RecognizeImage] Canvas conversion to Blob failed (size: 0) before OCR.`);
      }

      const arrayBuffer = await blob.arrayBuffer();
      const base64Data = arrayBufferToBase64(arrayBuffer);

      console.log(`[Pre-OCR Diagnostic] Sending image to OCR. Canvas W:${canvas.width}, H:${canvas.height}. Base64 sample: ${base64Data.substring(0, 50)}... Total Length: ${base64Data.length}`);

      // 1. Send to Offscreen using the new port-based bridge
      const offscreenResult = await executeOffscreenTask('RECOGNIZE_IMAGE', {
        width: canvas.width, 
        height: canvas.height, 
        base64Data
      });

      console.log(`[RecognizeImage] Received from Offscreen. Words count: ${offscreenResult?.words?.length || 0}`);
      
      if (!offscreenResult.text && (!offscreenResult.words || offscreenResult.words.length === 0)) {
        throw new Error('[RecognizeImage] OCR returned completely empty text and words array.');
      }

      return {
        text: offscreenResult.text || '',
        words: offscreenResult.words || [],
        boundingBoxes: offscreenResult.words || [], // Mapping words as boxes
        confidence: 0
      };
    }
    
    // ==========================================
    // PATH 2: OFFSCREEN DOCUMENT / CONTENT SCRIPT (Runs actual OCR)
    // ==========================================
    else {
      console.log('[RecognizeImage] Starting Tesseract OCR process...');
      const ocrResult = await runOCROnWorker(canvas);
      const data = ocrResult.data || ocrResult;
      
      let words = data.words || [];

      // Defensive Parsing (Deep Traversal for safety)
      if (words.length === 0 && data.blocks) {
         data.blocks.forEach(block => {
             block.paragraphs?.forEach(para => {
                 para.lines?.forEach(line => {
                     if (line.words) words.push(...line.words);
                 });
             });
         });
      }
      
      const boundingBoxes = extractBoundingBoxes({ ...data, words });
      
      return {
        text: data.text || '',
        confidence: data.confidence || 0,
        words: words,
        boundingBoxes: boundingBoxes,
        processingTime: ocrResult.processingTime || 0
      };
    }
  } catch (error) {
    console.error('[RecognizeImage] Pipeline failed:', error);
    return { text: '', confidence: 0, words: [], boundingBoxes: [], processingTime: 0 };
  }
}