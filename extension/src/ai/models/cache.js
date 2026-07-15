/**
 * Model Binary Cache Manager
 * 
 * Responsibility:
 * - Stores downloaded ONNX model binaries inside Chrome's CacheStorage or IndexedDB.
 * - Checks cache hits to prevent redundant model bandwidth transfers.
 * - Handles cache invalidation and versioning constraints.
 * 
 * Input/Output Contract:
 * - Input: modelKey (string), binaryBlob (ArrayBuffer)
 * - Output: Promise<boolean> (Save confirmation) / Promise<ArrayBuffer|null> (Load response)
 * 
 * Interacts with:
 * - extension/src/ai/models/loader.js
 */

const CACHE_NAME = 'safelens-model-cache-v1';

/**
 * Checks cache for a saved model array buffer.
 * 
 * @param {string} modelUrl - The remote model graph file path
 * @returns {Promise<ArrayBuffer|null>} Buffered binary data or null on miss
 */
export async function getCachedModel(modelUrl) {
  try {
    if (typeof caches === 'undefined') {
      return null; // Cache API not supported in this environment
    }

    console.log(`[ModelCache] Checking CacheStorage for key: ${modelUrl}`);
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(modelUrl);

    if (cachedResponse) {
      console.log('[ModelCache] Cache Hit! Loading model binary from disk...');
      return await cachedResponse.arrayBuffer();
    }

    console.log('[ModelCache] Cache Miss.');
    return null;

  } catch (error) {
    console.warn('[ModelCache] Failed to load model from CacheStorage:', error);
    return null;
  }
}

/**
 * Caches a newly downloaded model binary.
 * 
 * @param {string} modelUrl - The key location of the model
 * @param {ArrayBuffer} arrayBuffer - The model binary buffer data
 * @returns {Promise<boolean>} Resolves true on success
 */
export async function cacheModel(modelUrl, arrayBuffer) {
  try {
    if (typeof caches === 'undefined') {
      return false;
    }

    console.log(`[ModelCache] Saving model binary to CacheStorage: ${modelUrl}`);
    const cache = await caches.open(CACHE_NAME);
    
    // Put standard Response object containing binary
    await cache.put(
      modelUrl,
      new Response(arrayBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': arrayBuffer.byteLength.toString()
        }
      })
    );

    return true;

  } catch (error) {
    console.error('[ModelCache] Error caching model binary:', error);
    return false;
  }
}
