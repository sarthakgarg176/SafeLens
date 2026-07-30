/**
 * SafeLens 2.0 API Client
 * Manages REST communication with local API service.
 * Supports fallback to mock/simulated vectors when the backend is unreachable.
 */

const BASE_URL = 'http://localhost:8000';
const INCIDENTS_CACHE_KEY = 'ps_incidents';

/**
 * Helper to check headers with session token authorization
 * @returns {Object} Request headers
 */
function getHeaders(isMultipart = false) {
  const token = localStorage.getItem('cloakai_session_token') || '';
  const headers = {};

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  headers['Accept'] = 'application/json';

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Upload an enterprise policy brief (.pdf, .html) to the backend uploader.
 * Fallbacks to simulated compliance rules if backend server is offline.
 *
 * @param {File} file - PDF or HTML file object
 * @returns {Promise<Object>} Ingestion response
 */
export async function uploadPolicyDocument(file) {
  const url = `${BASE_URL}/api/v1/policy/upload`;
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('[api.js] Backend unreachable. Simulating policy ingestion upload trace:', error);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const extension = file.name.split('.').pop().toLowerCase();
    return {
      status: 'success',
      filename: file.name,
      policy_id: `policy-${Date.now()}`,
      chunks: Math.floor(Math.random() * 30) + 15,
      category: extension === 'pdf' ? 'GDPR PII' : 'Compliance Spec',
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    };
  }
}

/**
 * Fetch all active vector policies indexed inside ChromaDB.
 * Fallbacks to standard pre-populated compliance matrices if backend is unreachable.
 *
 * @returns {Promise<Array>} List of policy objects
 */
export async function fetchActivePolicies() {
  const url = `${BASE_URL}/api/v1/policy/list`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Fetch policies HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('[api.js] Backend unreachable. Fallback to active compliance policies list:', error);

    return [
      {
        id: 'pol-1',
        title: 'GDPR Data Compliance guidelines',
        category: 'GDPR PII',
        chunks: 42,
        date: '07/20/2026',
        enabled: true
      },
      {
        id: 'pol-2',
        title: 'AWS Secret Token Intercepts',
        category: 'Financial Security',
        chunks: 28,
        date: '07/21/2026',
        enabled: true
      },
      {
        id: 'pol-3',
        title: 'OAuth Whitelist Exclusions',
        category: 'General Exclusion',
        chunks: 14,
        date: '07/23/2026',
        enabled: false
      }
    ];
  }
}

/**
 * Fetch active services node health (Ollama, ChromaDB, and Backend API).
 * Fallbacks to online statuses if backend is unreachable.
 *
 * @returns {Promise<Object>} Services health flags object
 */
export async function fetchSystemHealth() {
  const url = `${BASE_URL}/api/v1/health`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Fetch health HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('[api.js] Backend unreachable. Mocking online status profiles:', error);

    return {
      status: 'online',
      services: {
        ollama: { status: 'online', model: 'llama-3-privacy:8b' },
        chromadb: { status: 'online', active_rules: 8 },
        api: { status: 'online', version: 'v2.0' }
      }
    };
  }
}

/* ────────────────────────────────────────────────────────────────────────
   NEW: Unified Incidents Engine (LLM Shield + Decoy Swapper)
   Real endpoint per Sahil: GET /api/incidents
──────────────────────────────────────────────────────────────────────── */

const MOCK_INCIDENTS = [
  {
    id: 'SCAN-9021',
    date: 'Jul 30, 13:42:05',
    vector: 'api.openai.com/v1/chat',
    url: 'PII / Credentials',
    severity: 'high',
    status: 'Resolved',
    metadata: {
      originalPayload: '{\n  "prompt": "My key is sk-live-4f9a8c2e, debug this API call"\n}',
      decoyPayload: '{\n  "prompt": "My key is sk-fake-8e21x93z, debug this API call"\n}'
    }
  },
  {
    id: 'SCAN-9022',
    date: 'Jul 30, 13:39:51',
    vector: 'claude.ai',
    url: 'Password',
    severity: 'high',
    status: 'Resolved',
    metadata: {
      originalPayload: '{\n  "prompt": "here is my password hunter2024!"\n}',
      decoyPayload: '{\n  "prompt": "here is my password [REDACTED_DECOY]"\n}'
    }
  },
  {
    id: 'SCAN-9023',
    date: 'Jul 30, 13:31:07',
    vector: 'gemini.google.com',
    url: 'Credit Card',
    severity: 'medium',
    status: 'Audit',
    metadata: {}
  },
  {
    id: 'SCAN-9024',
    date: 'Jul 29, 19:12:30',
    vector: 'secure-paypal-login.ru',
    url: 'Payment Phishing',
    severity: 'high',
    status: 'Escalated',
    metadata: { decoyPayload: 'Luhn-compliant fake card injected' }
  },
  {
    id: 'SCAN-9025',
    date: 'Jul 29, 18:04:11',
    vector: 'aadhaar-kyc-verify.xyz',
    url: 'ID Phishing',
    severity: 'high',
    status: 'Resolved',
    metadata: { decoyPayload: 'Verhoeff-compliant fake Aadhaar injected' }
  },
  {
    id: 'SCAN-9026',
    date: 'Jul 29, 16:47:58',
    vector: 'bank-update-portal.top',
    url: 'Credential Phishing',
    severity: 'medium',
    status: 'Resolved',
    metadata: { decoyPayload: 'Luhn-compliant fake card injected' }
  }
];

/** Known LLM / AI-provider host fragments used to split the unified feed. */
const LLM_HOST_HINTS = ['openai', 'claude', 'anthropic', 'gemini', 'huggingface', 'github.com/api', 'slack.com/api'];

/**
 * Classify a unified incident as an LLM Shield event or a Decoy Swapper event.
 * @param {Object} incident
 * @returns {'llm'|'decoy'}
 */
export function classifyIncident(incident) {
  const vector = (incident.vector || '').toLowerCase();
  return LLM_HOST_HINTS.some((hint) => vector.includes(hint)) ? 'llm' : 'decoy';
}

/**
 * Map backend status ('Escalated'|'Resolved'|'Audit') to a StatusBadge tone.
 * @param {string} status
 * @returns {'success'|'warning'|'failed'}
 */
export function statusToTone(status) {
  if (status === 'Escalated') return 'failed';
  if (status === 'Resolved') return 'success';
  return 'warning'; // Audit / unknown
}

/**
 * Derive a human-readable decoy action label from an incident's category text.
 * @param {Object} incident
 * @returns {string}
 */
export function decoyActionLabel(incident) {
  const cat = (incident.url || '').toLowerCase();
  if (cat.includes('aadhaar') || cat.includes('id ')) return 'Aadhaar Decoy Injected';
  if (cat.includes('card') || cat.includes('payment') || cat.includes('credit')) return 'Card Decoy Injected';
  return 'Synthetic Decoy Injected';
}

/**
 * Synchronously read the last cached incidents list from localStorage.
 * Use this for instant first paint before the network call resolves.
 * @returns {Array|null}
 */
export function getCachedIncidents() {
  try {
    const raw = localStorage.getItem(INCIDENTS_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Fetch the unified incidents feed (LLM interceptions + decoy swaps).
 * Caches successful responses to localStorage (`ps_incidents`) for instant
 * loads next time, and falls back to that cache (or demo data) if the
 * backend is unreachable / cold-starting.
 *
 * @returns {Promise<Array>} List of incident objects
 */
export async function fetchIncidents() {
  const url = `${BASE_URL}/api/incidents`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Fetch incidents HTTP error: ${response.status}`);
    }

    const data = await response.json();

    try {
      localStorage.setItem(INCIDENTS_CACHE_KEY, JSON.stringify(data));
    } catch {
      // localStorage full/unavailable — non-fatal
    }

    return data;
  } catch (error) {
    console.warn('[api.js] Backend unreachable/cold-starting. Falling back to cached or demo incidents:', error);

    const cached = getCachedIncidents();
    return cached || MOCK_INCIDENTS;
  }
}

/**
 * Fetch the real assets list (uploaded/processed files) to power Image
 * Redaction's stats with genuine backend data.
 * Confirmed working endpoint: GET /api/assets
 *
 * @returns {Promise<Object>} { imagesScanned, piiElementsFound, recentAssets: [] }
 */
export async function fetchAssetsSummary() {
  const url = `${BASE_URL}/api/assets`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Fetch assets HTTP error: ${response.status}`);
    }

    const { data } = await response.json();
    const assets = Array.isArray(data) ? data : [];

    return {
      imagesScanned: assets.length,
      piiElementsFound: assets.filter((a) => a.status === 'Redacted').length,
      recentAssets: assets.slice(-5).reverse()
    };
  } catch (error) {
    console.warn('[api.js] Backend unreachable. Falling back to demo asset summary:', error);
    return {
      imagesScanned: 212,
      piiElementsFound: 58,
      recentAssets: []
    };
  }
}

/* ────────────────────────────────────────────────────────────────────────
   NEW: Image Redaction / OCR pipeline
   Real endpoint per Sahil: POST /api/process-image
   Reads X-PII-Count / X-Redacted-Status response headers + boundingBoxes body
──────────────────────────────────────────────────────────────────────── */

const DEMO_IMAGE_RESULT = {
  status: 'REDACTED',
  piiCount: 3,
  boundingBoxes: [
    { x: 20, y: 30, w: 90, h: 16 },
    { x: 20, y: 60, w: 130, h: 16 },
    { x: 160, y: 30, w: 70, h: 16 }
  ],
  latencyMs: 398,
  dimensions: '1080x720'
};

/**
 * Upload an image for OCR + redaction.
 * Falls back to demo bounding boxes if backend is unreachable.
 *
 * @param {File} file - Image file object
 * @returns {Promise<Object>} { status, piiCount, boundingBoxes, latencyMs, dimensions }
 */
export async function processImage(file) {
  const url = `${BASE_URL}/api/process-image`;
  const formData = new FormData();
  formData.append('file', file);
  const startedAt = performance.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(true),
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Process image HTTP error: ${response.status}`);
    }

    const piiCountHeader = response.headers.get('X-PII-Count');
    const redactedStatusHeader = response.headers.get('X-Redacted-Status');
    const body = await response.json().catch(() => ({}));

    return {
      status: redactedStatusHeader || body.status || 'REDACTED',
      piiCount: piiCountHeader !== null ? Number(piiCountHeader) : (body.piiCount ?? 0),
      boundingBoxes: body.boundingBoxes || [],
      latencyMs: Math.round(performance.now() - startedAt),
      dimensions: body.dimensions || '—'
    };
  } catch (error) {
    console.warn('[api.js] Backend unreachable. Falling back to demo image redaction result:', error);
    return DEMO_IMAGE_RESULT;
  }
}