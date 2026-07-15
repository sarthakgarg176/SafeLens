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
import apiClient from '../services/apiClient.js';

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
  const [incidents, setIncidents] = useState(() => load('ps_incidents', DEFAULT_INCIDENTS));
  const [takedowns, setTakedowns] = useState(() => load('ps_takedowns', DEFAULT_TAKEDOWNS));
  const [webhooks, setWebhooks] = useState(() => load('ps_webhooks', DEFAULT_WEBHOOKS));

  /* ── Telemetry Polling & Sync (Phase 3) ────────────────────────────────── */
  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    const fetchRealData = async () => {
      // Pause polling if the dashboard tab is not currently visible/active
      if (document.visibilityState !== 'visible') {
        return;
      }

      try {
        // Fetch incidents
        const incidentsResponse = await apiClient.getIncidents();
        if (mounted && incidentsResponse?.success && Array.isArray(incidentsResponse.data)) {
          // Map backend schema to dashboard schema
          const mappedIncidents = incidentsResponse.data.map((backInc) => {
            let severity = 'medium';
            if (backInc.severity) {
              const sevLower = backInc.severity.toLowerCase();
              if (sevLower === 'serious' || sevLower === 'critical' || sevLower === 'high') {
                severity = 'high';
              } else if (sevLower === 'normal' || sevLower === 'medium') {
                severity = 'medium';
              } else {
                severity = 'low';
              }
            }

            let status = 'Investigating';
            if (backInc.status) {
              const statLower = backInc.status.toLowerCase();
              if (statLower === 'mitigated' || statLower === 'completed') {
                status = 'Mitigated';
              } else if (statLower === 'escalated' || statLower === 'escalated to legal') {
                status = 'Escalated';
              }
            }

            let date = 'Just now';
            if (backInc.timestamp) {
              try {
                const d = new Date(backInc.timestamp);
                date = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ', ' + d.getFullYear();
              } catch (e) {
                date = backInc.timestamp;
              }
            }

            return {
              id: backInc.incident_id ? `INC-${backInc.incident_id}` : `INC-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
              vector: backInc.filename || 'Unknown Document',
              url: backInc.website || 'unknown',
              date: date,
              severity: severity,
              status: status
            };
          });

          setIncidents((prev) => {
            // State comparison to avoid redundant re-renders
            if (JSON.stringify(prev) === JSON.stringify(mappedIncidents)) {
              return prev;
            }
            return mappedIncidents;
          });
        }
        
        // Fetch takedowns (if the API supports it)
        const takedownsResponse = await apiClient.getTakedowns();
        if (mounted && takedownsResponse?.success && Array.isArray(takedownsResponse.data)) {
          setTakedowns((prev) => {
            // State comparison to avoid redundant re-renders
            if (JSON.stringify(prev) === JSON.stringify(takedownsResponse.data)) {
              return prev;
            }
            return takedownsResponse.data;
          });
        }
      } catch (error) {
        console.warn('[SecurityContext] Telemetry fetch failed:', error);
      }
    };

    // Initial load
    fetchRealData();

    // 15-second short-polling interval
    intervalId = setInterval(fetchRealData, 15000);

    // Pause/Resume polling based on tab visibility state
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRealData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleScanCompletedMessage = (event) => {
      if (event.data && event.data.type === 'SAFELENS_SCAN_COMPLETED') {
        console.log('[SecurityContext] Instant scan sync signal received. Refreshing telemetry data...');
        fetchRealData();
        setTimeout(fetchRealData, 1500);
        setTimeout(fetchRealData, 3000);
      }
    };
    window.addEventListener('message', handleScanCompletedMessage);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('message', handleScanCompletedMessage);
    };
  }, []);

  /* ── localStorage sync (write-through on every change) ─────────────────── */
  useEffect(() => { save('ps_incidents', incidents); }, [incidents]);
  useEffect(() => { save('ps_takedowns', takedowns); }, [takedowns]);
  useEffect(() => { save('ps_webhooks',  webhooks);  }, [webhooks]);

  /* ── Derived metric: active vector count ────────────────────────────────── */
  const activeVectorCount = useMemo(
    () => computeActiveVectorCount(incidents),
    [incidents]
  );

  /* ── Toast Notifications System ─────────────────────────────────────────── */
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  /* ── Action: update a specific incident's status ────────────────────────── */
  const updateIncidentStatus = useCallback(async (id, newStatus) => {
    let previousIncidents = [];
    setIncidents((prev) => {
      previousIncidents = prev; // Capture current state for rollback
      return prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus } : inc));
    });

    try {
      showToast(`Updating incident status...`, 'success');
      await apiClient.patchIncidentStatus(id, newStatus);
      
      // Trigger background sync to align state with backend
      const incidentsResponse = await apiClient.getIncidents();
      if (incidentsResponse?.success && Array.isArray(incidentsResponse.data)) {
        setIncidents(incidentsResponse.data);
      }
      showToast(`Incident status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('[SecurityContext] Update incident status failed, rolling back:', error);
      setIncidents(previousIncidents); // Revert state on failure
      showToast(`Failed to update incident: ${error.message}`, 'error');
    }
  }, [showToast]);

  /* ── Action: route a takedown target to the legal queue ─────────────────── */
  const triggerLegalTakedown = useCallback(async (id) => {
    let previousTakedowns = [];
    setTakedowns((prev) => {
      previousTakedowns = prev; // Capture current state for rollback
      return prev.map((td) =>
        td.id === id
          ? {
              ...td,
              status: 'Escalated to Legal',
              counter: td.counter + 1,
              lastUpdate: 'Just now',
            }
          : td
      );
    });

    try {
      showToast('Escalating takedown target to legal queue...', 'success');
      await apiClient.escalateTakedown(id);

      // Trigger background sync to align state with backend
      const takedownsResponse = await apiClient.getTakedowns();
      if (takedownsResponse?.success && Array.isArray(takedownsResponse.data)) {
        setTakedowns(takedownsResponse.data);
      }
      showToast('Takedown successfully escalated to legal', 'success');
    } catch (error) {
      console.error('[SecurityContext] Escalate takedown failed, rolling back:', error);
      setTakedowns(previousTakedowns); // Revert state on failure
      showToast(`Failed to escalate takedown: ${error.message}`, 'error');
    }
  }, [showToast]);

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
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4.5 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-md transition-all duration-300 animate-slide-in ${
          toast.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-950/80 border-rose-500/30 text-rose-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-pulse'}`}></div>
          <span className="text-xs font-semibold font-mono tracking-wide">{toast.message}</span>
        </div>
      )}
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
