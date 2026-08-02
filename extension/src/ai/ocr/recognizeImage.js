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
    if (typeof document === 'undefined' && typeof chrome !== 'undefined' && chrome.offscreen) {
      if (!canvas.width || !canvas.height) {
        throw new Error(`[RecognizeImage] Canvas dimensions are invalid (W:${canvas.width}, H:${canvas.height}) before OCR.`);
      }

      const blob = await canvas.convertToBlob({ type: 'image/png' });
      if (!blob || blob.size === 0) {
        throw new Error(`[RecognizeImage] Canvas conversion to Blob failed (size: 0) before OCR.`);
      }

      const arrayBuffer = await blob.arrayBuffer();
      const base64Data = arrayBufferToBase64(arrayBuffer);

      console.log(`[Pre-OCR Diagnostic] Sending image to OCR. Canvas W:${canvas.width}, H:${canvas.height}. Base64 sample: ${base64Data.substring(0, 50)}...`);

      const offscreenResult = await executeOffscreenTask('RECOGNIZE_IMAGE', {
        width: canvas.width, 
        height: canvas.height, 
        base64Data
      });

      console.log(`[RecognizeImage] Received from Offscreen. Words count: ${offscreenResult?.words?.length || 0}`);
      
      if (!offscreenResult.text && (!offscreenResult.words || offscreenResult.words.length === 0)) {
        console.warn('[RecognizeImage] OCR returned empty - using fallback full canvas bounding box');
        return {
          text: '',
          words: [],
          boundingBoxes: [{
            x: 0, y: 0, width: canvas.width, height: canvas.height, confidence: 50
          }],
          confidence: 0
        };
      }
      return {
        text: offscreenResult.text || '',
        words: offscreenResult.words || [],
        boundingBoxes: offscreenResult.boundingBoxes || offscreenResult.words || [],
        confidence: 0
      };
    } 
    else {
      console.log('[RecognizeImage] Starting Tesseract OCR process...');
      const ocrResult = await runOCROnWorker(canvas);
      const data = ocrResult.data || ocrResult;

      console.log('================ RAW TESSERACT DATA ================');
      console.log('[DEBUG] Keys present in Tesseract data:', Object.keys(data));
      console.log('[DEBUG] Natively has words array?', !!data.words, 'Count:', data.words ? data.words.length : 0);
      console.log('====================================================');
      
      let words = data.words || [];

      if (words.length === 0 && data.lines && data.lines.length > 0) {
         console.log('[RecognizeImage] Native words empty. Extracting from lines...');
         data.lines.forEach(line => { if (line.words) words.push(...line.words); });
      }

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
      
      data.words = words; 
      const boundingBoxes = extractBoundingBoxes(data);
      
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