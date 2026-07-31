/**
 * api-client.js
 * Sends intercepted payloads to the Python backend for
 * Policy-RAG / Decoy Generation processing (USE_NEW_AGENT = true).
 */

export async function sendToBackend(baseUrl, endpoint, payload) {
  const effectiveBaseUrl = (baseUrl && typeof baseUrl === 'string' && baseUrl.trim())
    ? baseUrl.trim()
    : 'http://127.0.0.1:8000';

  const cleanBase = effectiveBaseUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${cleanBase}${cleanEndpoint}`;

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Backend error (${response.status}): ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.error('[api-client] Failed to reach backend:', err.message);
    
    // Detailed error feedback for extension developers
    let friendlyMessage = err.message;
    if (err.name === 'TypeError' && (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed'))) {
      friendlyMessage = `Cannot connect to server at ${fullUrl}. Check if FastAPI server is running.`;
    }

    return {
      status: 'error',
      message: friendlyMessage
    };
  }
}