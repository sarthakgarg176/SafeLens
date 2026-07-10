/**
 * SecurityContext.jsx
 *
 * Centralised application state for Privacy Shield AI.
 * Persists incidents, takedowns, and webhooks to localStorage so that
 * state survives hard page reloads.  Pages consume the `useSecurity()`
 * hook – no prop drilling required.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

/* ─── Default seed data ─────────────────────────────────────────────────────── */

const DEFAULT_INCIDENTS = [
  {
    id: 'INC-2094',
    vector: 'GitHub Public Repository',
    url: 'https://github.com/anon-user/exposed-repo',
    date: 'Jul 10, 2026',
    severity: 'high',
    status: 'Investigating',
  },
  {
    id: 'INC-2089',
    vector: 'Pastebin Dump',
    url: 'https://pastebin.com/raw/d8s3k2x9',
    date: 'Jul 09, 2026',
    severity: 'high',
    status: 'Escalated',
  },
  {
    id: 'INC-2041',
    vector: 'Dark Web Leak Forum',
    url: 'http://leakhub77uip.onion/index.html',
    date: 'Jul 07, 2026',
    severity: 'high',
    status: 'Investigating',
  },
  {
    id: 'INC-1988',
    vector: 'S3 Bucket Misconfig',
    url: 'https://corporate-logs-prod.s3.amazonaws.com',
    date: 'Jul 05, 2026',
    severity: 'medium',
    status: 'Mitigated',
  },
  {
    id: 'INC-1952',
    vector: 'Trello Board Public Access',
    url: 'https://trello.com/b/88a2dx9c/marketing',
    date: 'Jul 02, 2026',
    severity: 'low',
    status: 'Mitigated',
  },
];

const DEFAULT_TAKEDOWNS = [
  {
    id: 'TD-901',
    target: 'clone-privacyshield.net',
    type: 'Registrar Domain Suspension',
    counter: 3,
    status: 'Pending Registrar Action',
    lastUpdate: 'Jul 10, 15:45',
  },
  {
    id: 'TD-882',
    target: 'gist.githubusercontent.com/attacker-repo',
    type: 'DMCA Takedown Notice',
    counter: 1,
    status: 'Notice Dispatched',
    lastUpdate: 'Jul 09, 12:20',
  },
  {
    id: 'TD-871',
    target: 'domain-squatters-cyber.co',
    type: 'Registrar Domain Suspension',
    counter: 2,
    status: 'Mitigated / Removed',
    lastUpdate: 'Jul 08, 09:30',
  },
  {
    id: 'TD-840',
    target: 'https://pastebin.com/raw/leaked-data',
    type: 'URL Redaction Demand',
    counter: 4,
    status: 'Mitigated / Removed',
    lastUpdate: 'Jul 05, 11:15',
  },
  {
    id: 'TD-812',
    target: 'https://telegram.me/leakhub_channel',
    type: 'Google Search De-indexing Request',
    counter: 1,
    status: 'De-indexing Approved',
    lastUpdate: 'Jul 03, 17:40',
  },
];

const DEFAULT_WEBHOOKS = [
  {
    id: 'wh_1',
    label: 'Slack #security-alerts',
    url: 'https://hooks.slack.com/services/T00/B00/xxxx',
    active: true,
  },
  {
    id: 'wh_2',
    label: 'PagerDuty Incident Bridge',
    url: 'https://events.pagerduty.com/v2/enqueue',
    active: false,
  },
];

/* ─── localStorage helpers ──────────────────────────────────────────────────── */

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded – silently ignore */
  }
}

/* ─── Context definition ────────────────────────────────────────────────────── */

const SecurityContext = createContext(null);

/* ─── Derived metric computation ────────────────────────────────────────────── */

/**
 * Counts incidents that are NOT yet mitigated to compute the "active vector"
 * count displayed on the Risk Analysis page.
 */
function computeActiveVectorCount(incidents) {
  return incidents.filter((i) => i.status !== 'Mitigated').length;
}

/* ─── Provider ──────────────────────────────────────────────────────────────── */

export function SecurityProvider({ children }) {
  /* ── Core shared state ─────────────────────────────────────────────────── */
  const [incidents, setIncidents] = useState(() =>
    load('ps_incidents', DEFAULT_INCIDENTS)
  );

  const [takedowns, setTakedowns] = useState(() =>
    load('ps_takedowns', DEFAULT_TAKEDOWNS)
  );

  const [webhooks, setWebhooks] = useState(() =>
    load('ps_webhooks', DEFAULT_WEBHOOKS)
  );

  /* ── localStorage sync (write-through on every change) ─────────────────── */
  useEffect(() => { save('ps_incidents', incidents); }, [incidents]);
  useEffect(() => { save('ps_takedowns', takedowns); }, [takedowns]);
  useEffect(() => { save('ps_webhooks',  webhooks);  }, [webhooks]);

  /* ── Derived metric: active vector count ────────────────────────────────── */
  const activeVectorCount = useMemo(
    () => computeActiveVectorCount(incidents),
    [incidents]
  );

  /* ── Action: update a specific incident's status ────────────────────────── */
  const updateIncidentStatus = useCallback((id, newStatus) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus } : inc))
    );
  }, []);

  /* ── Action: route a takedown target to the legal queue ─────────────────── */
  const triggerLegalTakedown = useCallback((id) => {
    setTakedowns((prev) =>
      prev.map((td) =>
        td.id === id
          ? {
              ...td,
              status: 'Escalated to Legal',
              counter: td.counter + 1,
              lastUpdate: 'Just now',
            }
          : td
      )
    );
  }, []);

  /* ── Action: toggle a webhook active / paused ───────────────────────────── */
  const toggleWebhookStatus = useCallback((id) => {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
    );
  }, []);

  /* ── Action: add a new webhook endpoint ─────────────────────────────────── */
  const addWebhook = useCallback((label, url) => {
    if (!label.trim() || !url.trim()) return;
    setWebhooks((prev) => [
      ...prev,
      { id: `wh_${Date.now()}`, label: label.trim(), url: url.trim(), active: true },
    ]);
  }, []);

  /* ── Action: remove a webhook endpoint ──────────────────────────────────── */
  const removeWebhook = useCallback((id) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  }, []);

  /* ── Context value ───────────────────────────────────────────────────────── */
  const value = useMemo(
    () => ({
      /* State */
      incidents,
      takedowns,
      webhooks,
      /* Derived */
      activeVectorCount,
      /* Actions */
      updateIncidentStatus,
      triggerLegalTakedown,
      toggleWebhookStatus,
      addWebhook,
      removeWebhook,
    }),
    [
      incidents,
      takedowns,
      webhooks,
      activeVectorCount,
      updateIncidentStatus,
      triggerLegalTakedown,
      toggleWebhookStatus,
      addWebhook,
      removeWebhook,
    ]
  );

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

/* ─── Consumer hook ─────────────────────────────────────────────────────────── */

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) {
    throw new Error('useSecurity() must be used inside <SecurityProvider>.');
  }
  return ctx;
}
