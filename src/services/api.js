// services/api.js
// Unified backend connector for SafeLens dashboard.
// Talks to the real FastAPI backend's Unified Incidents Engine (GET /api/incidents)
// and the Image OCR Pipeline (POST /api/process-image), with instant localStorage
// fallback so the UI never blocks on Render's cold-start.

const BASE_URL = 'https://safelens-zttx.onrender.com';
const INCIDENTS_ENDPOINT = `${BASE_URL}/api/incidents`;
const PROCESS_IMAGE_ENDPOINT = `${BASE_URL}/api/process-image`;
const LOCAL_STORAGE_KEY = 'ps_incidents';

// Known LLM API hosts used to classify an incident's vector as an "LLM Shield" catch.
// Extend this list as you wire up more providers.
const KNOWN_LLM_HOSTS = [
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com', // Gemini
  'api.groq.com',
];

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

function readLocalIncidents() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('[api] Failed to read ps_incidents from localStorage:', err);
    return [];
  }
}

function writeLocalIncidents(incidents) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(incidents));
  } catch (err) {
    console.warn('[api] Failed to write ps_incidents to localStorage:', err);
  }
}

/**
 * getIncidents
 * Fetches the unified incidents array from the real backend.
 * On failure (e.g. Render cold-start timeout, network error), instantly
 * falls back to whatever is cached in localStorage under `ps_incidents`,
 * so the UI still renders in <500ms instead of hanging.
 */
export async function getIncidents({ timeoutMs = 6000 } = {}) {
  const cached = readLocalIncidents();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(INCIDENTS_ENDPOINT, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`Incidents fetch failed: ${res.status}`);

    const incidents = await res.json();
    writeLocalIncidents(incidents); // refresh cache for next cold-start
    return { incidents, source: 'live' };
  } catch (err) {
    console.warn('[api] /api/incidents unreachable, using local cache:', err.message);
    return { incidents: cached, source: 'cache' };
  }
}

/**
 * getCachedIncidentsInstant
 * Synchronous read for the very first paint (e.g. to pre-populate state
 * before the async fetch resolves), so the dashboard never shows a blank
 * loading screen if we already have something locally.
 */
export function getCachedIncidentsInstant() {
  return readLocalIncidents();
}

/**
 * getCachedIncidents
 * Alias expected by components that read the cache directly (e.g. the
 * current LlmShield.jsx). Returns null when nothing is cached yet, so
 * callers can distinguish "no cache" from "cache is an empty array".
 */
export function getCachedIncidents() {
  const cached = readLocalIncidents();
  return cached && cached.length ? cached : null;
}

/**
 * fetchIncidents
 * Flat version of getIncidents() for components that just want the array
 * directly (not wrapped in { incidents, source }). Severity is normalized
 * here at the source, so every consumer can safely check
 * `incident.severity === 'high'` without knowing about backend variants
 * like "serious" or "critical".
 */
export async function fetchIncidents() {
  const { incidents } = await getIncidents();
  return incidents.map((i) => ({ ...i, severity: normalizeSeverity(i.severity) }));
}

/**
 * classifyIncident
 * Public version of the classification logic below, returning a plain
 * string so components can filter directly: 'llm' | 'decoy' | 'image'.
 */
export function classifyIncident(incident) {
  if (isImageIncident(incident)) return 'image';
  if (isLlmIncident(incident)) return 'llm';
  return 'decoy';
}

/**
 * statusToTone
 * Maps the backend's raw status strings to the tone prop StatusBadge
 * expects. Adjust the map below if StatusBadge.jsx uses different tone
 * names than danger/warning/success/info.
 */
const STATUS_TONE_MAP = {
  open: 'danger',
  escalated: 'danger',
  resolved: 'success',
  audit: 'info',
};

export function statusToTone(status) {
  const key = (status ?? '').toLowerCase().trim();
  return STATUS_TONE_MAP[key] ?? 'info';
}

/**
 * decoyActionLabel
 * Human-readable action label for the Decoy Swapper's "Flagged Sites" table.
 * If a decoy was actually generated for this incident, say so explicitly;
 * otherwise fall back to whatever status the backend reported.
 */
export function decoyActionLabel(incident) {
  if (incident?.metadata?.decoyPayload) return 'decoy served';
  return (incident?.status || 'pending').toLowerCase();
}

/**
 * readImageDimensions
 * Fallback used when the backend response doesn't include a `dimensions`
 * field — reads the actual uploaded file's natural width/height in-browser.
 */
function readImageDimensions(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(`${img.naturalWidth}x${img.naturalHeight}`);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('N/A');
    };
    img.src = url;
  });
}

/**
 * processImage
 * Uploads an image to the Image Redaction & OCR pipeline.
 * Reads X-PII-Count / X-Redacted-Status response headers as specified,
 * in addition to the JSON body (status, piiCount, boundingBoxes).
 */
export async function processImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const startedAt = performance.now();
  const res = await fetch(PROCESS_IMAGE_ENDPOINT, {
    method: 'POST',
    body: formData,
  });
  const latencyMs = Math.round(performance.now() - startedAt);

  if (!res.ok) throw new Error(`process-image failed: ${res.status}`);

  const piiCountHeader = res.headers.get('X-PII-Count');
  const redactedStatusHeader = res.headers.get('X-Redacted-Status');
  const body = await res.json(); // { status, piiCount, boundingBoxes }

  const result = {
    status: redactedStatusHeader ?? body.status,
    piiCount: piiCountHeader != null ? Number(piiCountHeader) : body.piiCount,
    boundingBoxes: body.boundingBoxes ?? [],
    latencyMs,
    dimensions: body.dimensions ?? (await readImageDimensions(file)),
  };

  // Optimistically fold this into the local incidents cache too, so a
  // refresh immediately reflects the new scan even before /api/incidents
  // has been re-fetched from the server.
  const cached = readLocalIncidents();
  writeLocalIncidents([
    {
      id: `SCAN-${Date.now()}`,
      date: new Date().toLocaleString('en-US', {
        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
      }),
      vector: file.name,
      url: 'Image PII',
      severity: result.piiCount > 0 ? 'high' : 'safe',
      status: result.status === 'REDACTED' ? 'Resolved' : 'Audit',
      metadata: {
        status: result.status,
        piiCount: result.piiCount,
        boundingBoxes: result.boundingBoxes,
      },
    },
    ...cached,
  ]);

  return result;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------
// Real-world incidents don't reliably carry an LLM-provider-looking vector
// (e.g. vector can be "Government ID" or a plain upload URL). The reliable
// signal is the *payload content* itself: LLM Shield catches always carry a
// prompt-shaped originalPayload/decoyPayload. Hostname matching is kept only
// as a secondary fallback signal.

function isImageIncident(incident) {
  return Boolean(incident?.metadata?.boundingBoxes);
}

function hasPromptSignal(incident) {
  const original = incident?.metadata?.originalPayload ?? '';
  const decoy = incident?.metadata?.decoyPayload ?? '';
  return original.includes('"prompt"') || decoy.includes('"prompt"');
}

function matchesKnownLlmHost(incident) {
  const vector = incident?.vector ?? '';
  return KNOWN_LLM_HOSTS.some((host) => vector.includes(host));
}

function isLlmIncident(incident) {
  if (isImageIncident(incident)) return false;
  return hasPromptSignal(incident) || matchesKnownLlmHost(incident);
}

function isDecoyIncident(incident) {
  return !isImageIncident(incident) && !isLlmIncident(incident);
}

// Backend severity strings aren't fully standardized yet ("serious" shows up
// alongside "high"/"medium"/"safe"). Normalize everything down to a 3-value
// scale so KPI counts (e.g. "High Severity") stay accurate regardless of
// which exact word the backend sends.
const SEVERITY_MAP = {
  high: 'high',
  serious: 'high',
  critical: 'high',
  medium: 'medium',
  moderate: 'medium',
  safe: 'safe',
  low: 'safe',
  resolved: 'safe',
};

export function normalizeSeverity(rawSeverity) {
  const key = (rawSeverity ?? '').toLowerCase().trim();
  return SEVERITY_MAP[key] ?? 'medium';
}

/**
 * getSeverityCounts
 * Handy for an overview/home dashboard that shows "High/Medium/Safe" tiles
 * across ALL incidents (LLM + Decoy + Image combined).
 */
export function getSeverityCounts(incidents) {
  return incidents.reduce(
    (acc, i) => {
      const level = normalizeSeverity(i.severity);
      acc[level] += 1;
      return acc;
    },
    { high: 0, medium: 0, safe: 0 }
  );
}

// ---------------------------------------------------------------------------
// Derived summaries — one per dashboard component, all sourced from the
// single unified /api/incidents payload.
// ---------------------------------------------------------------------------

/**
 * fetchLlmShieldSummary
 * Feeds LlmShield.jsx — derives KPIs + intercept log rows from incidents
 * whose vector matches a known LLM API host.
 */
export async function fetchLlmShieldSummary() {
  const { incidents } = await getIncidents();
  const llmIncidents = incidents.filter(isLlmIncident);

  const promptsScanned = llmIncidents.length;
  const keysNeutralized = llmIncidents.filter((i) => i?.metadata?.decoyPayload).length;
  // NOTE: backend doesn't currently expose per-request latency on incidents.
  // Swap this for a real field (e.g. incident.metadata.latencyMs) once available.
  const avgLatencyMs = 0;

  const logs = llmIncidents.map((i) => ({
    id: i.id,
    time: i.date,
    provider: (i.vector || '').split('/')[0] || i.vector,
    category: i.url, // "url" field carries the AI match category per backend spec
    status: i.status,
    severity: normalizeSeverity(i.severity),
  }));

  return { promptsScanned, keysNeutralized, avgLatencyMs, logs };
}

/**
 * fetchDecoySwapperSummary
 * Feeds DecoySwapper.jsx — derives KPIs + flagged sites table from incidents
 * that are neither LLM traffic nor image scans (i.e. spoofed domains).
 */
export async function fetchDecoySwapperSummary() {
  const { incidents } = await getIncidents();
  const decoyIncidents = incidents.filter(isDecoyIncident);

  const domainsMonitored = new Set(decoyIncidents.map((i) => i.vector)).size;
  const decoysInjected = decoyIncidents.filter((i) => i?.metadata?.decoyPayload).length;
  const successRate = decoyIncidents.length
    ? Math.round((decoysInjected / decoyIncidents.length) * 100)
    : 0;

  const sites = decoyIncidents.map((i) => ({
    id: i.id,
    host: i.vector,
    category: i.url,
    action: i?.metadata?.decoyPayload ? 'decoy served' : i.status.toLowerCase(),
    severity: normalizeSeverity(i.severity),
  }));

  return { domainsMonitored, decoysInjected, successRate, sites };
}

/**
 * fetchAssetsSummary
 * Feeds the current ImageRedaction.jsx KPI row (imagesScanned,
 * piiElementsFound) — derived from image-type incidents in the unified feed.
 */
export async function fetchAssetsSummary() {
  const { incidents } = await getIncidents();
  const imageIncidents = incidents.filter(isImageIncident);

  const imagesScanned = imageIncidents.length;
  const piiElementsFound = imageIncidents.reduce(
    (sum, i) => sum + (i.metadata?.piiCount ?? 0),
    0
  );

  return { imagesScanned, piiElementsFound };
}

/**
 * fetchImageRedactionSummary
 * Feeds ImageRedaction.jsx — derives KPIs, bounding boxes for the most recent
 * scan, and a "backend response" panel from image-type incidents.
 */
export async function fetchImageRedactionSummary() {
  const { incidents } = await getIncidents();
  const imageIncidents = incidents.filter(isImageIncident);

  const imagesScanned = imageIncidents.length;
  const piiElementsFound = imageIncidents.reduce(
    (sum, i) => sum + (i.metadata?.piiCount ?? 0),
    0
  );
  // Same caveat as LLM Shield: latency isn't in the incidents schema yet.
  const avgLatencyMs = 0;

  const latest = imageIncidents[0]; // backend returns most recent first
  const boxes = latest?.metadata?.boundingBoxes ?? [];

  const headers = {
    status: latest?.metadata?.status ?? 'N/A',
    piiCount: latest?.metadata?.piiCount ?? 0,
    latencyMs: avgLatencyMs,
    dimensions: latest?.metadata?.dimensions ?? 'N/A',
  };

  return { imagesScanned, piiElementsFound, avgLatencyMs, boxes, headers };
}
