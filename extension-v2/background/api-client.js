/**
 * api-client.js
 * Sends intercepted payloads to the Python backend for
 * Policy-RAG / Decoy Generation processing (USE_NEW_AGENT = true).
 */

export async function sendToBackend(baseUrl, endpoint, payload) {
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error('[api-client] Failed to reach backend:', err.message);
    return {
      status: 'error',
      message: err.message
    };
  }
}