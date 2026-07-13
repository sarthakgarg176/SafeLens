import { runOCROnWorker } from './tesseractWorker.js';
import { extractWords } from './extractWords.js';
import { extractLines } from './extractLines.js';
import { extractBoundingBoxes } from './extractBoundingBoxes.js';
import { sendToOffscreen } from '../../background/offscreenManager.js';

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
    // PATH 1: SERVICE WORKER (Delegates to Offscreen)
    // ==========================================
    if (typeof document === 'undefined' && typeof chrome !== 'undefined' && chrome.offscreen) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const base64Data = arrayBufferToBase64(imgData.data.buffer);
      
      if (!base64Data || base64Data.length < 100) throw new Error('OCR source data missing');

      // 1. Send to Offscreen
      const offscreenResult = await sendToOffscreen('RECOGNIZE_IMAGE', {
        width: canvas.width, height: canvas.height, base64Data
      });

      // 2. THE FIX: Offscreen already extracted everything. Do NOT re-extract!
      console.log(`[RecognizeImage] Received from Offscreen. Boxes: ${offscreenResult?.boundingBoxes?.length || 0}`);
      return offscreenResult;
    } 
    
    // ==========================================
    // PATH 2: OFFSCREEN DOCUMENT / CONTENT SCRIPT (Runs actual OCR)
    // ==========================================
    else {
      const ocrResult = await runOCROnWorker(canvas);
      const data = ocrResult.data || ocrResult;

      // Defensive Parsing
      let words = data.words || [];
      if (words.length === 0 && data.lines) {
         data.lines.forEach(line => { if (line.words) words.push(...line.words); });
      }

      const boundingBoxes = extractBoundingBoxes(data);
      console.log(`[RecognizeImage] OCR Local Success. Words: ${words.length}. Boxes: ${boundingBoxes.length}`);

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