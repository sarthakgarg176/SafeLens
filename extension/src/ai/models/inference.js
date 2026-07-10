import { loadONNXModel } from './loader.js';
import { tokenizeText } from './tokenizer.js';

/**
 * Client-Side Model Inference Engine
 * 
 * Responsibility:
 * - Coordinates input tokenization and passes tensors to the loaded ONNX session.
 * - Parses outputs (logits) and computes softmax probabilities.
 * 
 * Input/Output Contract:
 * - Input: text (string), modelSession (Object)
 * - Output: Promise<Float32Array> (Logits or probability arrays)
 * 
 * Interacts with:
 * - extension/src/ai/models/loader.js
 * - extension/src/ai/models/tokenizer.js
 */

/**
 * Runs a prediction pass for a text segment.
 * 
 * @param {string} text - Scanned text segment
 * @param {Object} session - Active ONNX InferenceSession instance
 * @returns {Promise<Float32Array>} Softmax class probabilities
 */
export async function runInference(text, session) {
  try {
    if (!text) {
      throw new Error('Input text is required');
    }

    if (!session) {
      throw new Error('Active model session is required');
    }

    // 1. Tokenize text inputs
    const { inputIds, attentionMask } = await tokenizeText(text);

    console.log('[Inference] Loading inputs into ONNX tensor buffers...');

    // 2. Wrap inputs into ONNX Tensors (ort.Tensor)
    // const inputIdsTensor = new ort.Tensor('int64', BigInt64Array.from(inputIds.map(BigInt)), [1, inputIds.length]);
    // const attentionMaskTensor = new ort.Tensor('int64', BigInt64Array.from(attentionMask.map(BigInt)), [1, attentionMask.length]);
    const mockTensors = {
      input_ids: inputIds,
      attention_mask: attentionMask
    };

    // 3. Execute the forward pass
    const outputMap = await session.run(mockTensors);
    
    // 4. Compute Softmax probabilities on logits
    const logits = outputMap.logits.data;
    const probabilities = softmax(logits);

    console.log('[Inference] Inference pass resolved.');
    return probabilities;

  } catch (error) {
    console.error('[Inference] Forward inference pass failed:', error);
    throw error;
  }
}

/**
 * Softmax probability distribution converter.
 */
function softmax(logits) {
  const maxLogit = Math.max(...logits);
  const scores = logits.map((l) => Math.exp(l - maxLogit));
  const sumScores = scores.reduce((a, b) => a + b, 0);
  return new Float32Array(scores.map((s) => s / sumScores));
}
