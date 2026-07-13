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

      // 2. Offscreen already extracted everything. Do NOT re-extract!
      console.log(`[RecognizeImage] Received from Offscreen. Boxes: ${offscreenResult?.boundingBoxes?.length || 0}`);
      return offscreenResult;
    } 
    
    // ==========================================
    // PATH 2: OFFSCREEN DOCUMENT / CONTENT SCRIPT (Runs actual OCR)
    // ==========================================
    else {
      console.log('[RecognizeImage] Starting Tesseract OCR process...');
      const ocrResult = await runOCROnWorker(canvas);
      const data = ocrResult.data || ocrResult;

      // ---------------------------------------------------------
      // 🕵️‍♂️ DEEP DEBUG LOGS
      // ---------------------------------------------------------
      console.log('================ RAW TESSERACT DATA ================');
      console.log('[DEBUG] Keys present in Tesseract data:', Object.keys(data));
      console.log('[DEBUG] Text Length:', data.text ? data.text.length : 0);
      console.log('[DEBUG] Natively has words array?', !!data.words, 'Count:', data.words ? data.words.length : 0);
      console.log('[DEBUG] Natively has lines array?', !!data.lines, 'Count:', data.lines ? data.lines.length : 0);
      console.log('[DEBUG] Natively has blocks array?', !!data.blocks, 'Count:', data.blocks ? data.blocks.length : 0);
      console.log('====================================================');
      
      // ---------------------------------------------------------
      // 🛡️ THE ULTIMATE DEFENSIVE PARSING (Deep Traversal)
      // ---------------------------------------------------------
      let words = data.words || [];

      // Level 1 Fallback: Try getting words from lines
      if (words.length === 0 && data.lines && data.lines.length > 0) {
         console.log('[RecognizeImage] Native words empty. Extracting from lines...');
         data.lines.forEach(line => { if (line.words) words.push(...line.words); });
      }

      // Level 2 Fallback: Try getting words from blocks (THIS WILL FIX THE ISSUE)
      if (words.length === 0 && data.blocks && data.blocks.length > 0) {
         console.log('[RecognizeImage] Native words & lines empty. Extracting deeply from blocks...');
         data.blocks.forEach(block => {
             if (block.paragraphs) {
                 block.paragraphs.forEach(para => {
                     if (para.lines) {
                         para.lines.forEach(line => {
                             if (line.words) words.push(...line.words);
                         });
                     }
                 });
             }
         });
      }
      
      console.log(`[RecognizeImage] Final Extracted Words Count: ${words.length}`);

      console.log('[RecognizeImage] Extracting bounding boxes...');
      
      // HACK: Pass the extracted words array explicitly to extractBoundingBoxes if needed
      // By overwriting data.words, we ensure extractBoundingBoxes can find them
      data.words = words; 
      
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