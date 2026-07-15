/**
 * MiniLM Semantic Classifier Client
 * Communicates with the offscreen document to classify OCR text.
 */

export async function classifyText(text) {
  if (!text || text.trim().length === 0) {
    return { topic: 'Unknown', confidence: 0 };
  }

  return new Promise((resolve, reject) => {
    // Send text to offscreen document for inference
    chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'CLASSIFY_TEXT',
      payload: { text: text.substring(0, 512) } // Reduced slightly to optimize single-thread CPU execution
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Classifier] Extension runtime error:', chrome.runtime.lastError.message);
        return resolve({ topic: 'Unknown', confidence: 0 }); // Return fallback instead of crashing pipeline
      }
      if (!response || !response.success || !response.result) {
        console.warn('[Classifier] Remote classification failed, using fallback.');
        return resolve({ topic: 'Unknown', confidence: 0 });
      }
      
      try {
        // Safe check for handling both array structures and direct prediction targets
        const predictions = Array.isArray(response.result) ? response.result : [response.result];
        if (predictions.length > 0 && predictions[0]) {
          const topResult = predictions[0];
          resolve({
            topic: topResult.label || 'Unknown',
            confidence: topResult.score || 0
          });
        } else {
          resolve({ topic: 'Unknown', confidence: 0 });
        }
      } catch (err) {
        console.error('[Classifier] Parsing result crashed:', err);
        resolve({ topic: 'Unknown', confidence: 0 });
      }
    });
  });
}