import { executeOffscreenTask } from '../../background/offscreenManager.js';

export async function classifyText(text) {
  if (!text || text.trim().length === 0) {
    return { topic: 'HighRisk_Fallback', confidence: 0.99 };
  }

  try {
    const response = await executeOffscreenTask('CLASSIFY_TEXT', { text: text.substring(0, 512) });
    if (response && response.topic) {
      return {
        topic: response.topic,
        confidence: response.confidence || 0.95
      };
    }
  } catch (err) {
    console.error('[Classifier] Sync messaging crashed:', err);
  }
  
  return { topic: 'HighRisk_Fallback', confidence: 0.99 };
}