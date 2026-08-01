import React, { useState, useEffect } from 'react';
import { Shield, Globe, ShieldAlert, Cpu, Terminal, KeyRound, ArrowUpRight, Zap, RefreshCw, PauseCircle, PlayCircle } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import AgenticBrain from '../timeline/AgenticBrain';
import PolicyUploader from '../policy/PolicyUploader';
import ActivePolicies from '../policy/ActivePolicies';
import StatusBadge from '../timeline/StatusBadge';
import PropTypes from 'prop-types';

const INITIAL_POLICIES = [
  { id: 'pol-1', title: 'GDPR Data Compliance guidelines', category: 'GDPR PII', chunks: 42, date: '07/20/2026', enabled: true },
  { id: 'pol-2', title: 'AWS Secret Token Intercepts', category: 'Financial Security', chunks: 28, date: '07/21/2026', enabled: true },
  { id: 'pol-3', title: 'OAuth Whitelist Exclusions', category: 'General Exclusion', chunks: 14, date: '07/23/2026', enabled: false }
];

const INITIAL_THREAT_LOGS = [
  { id: 'tlog-1', domain: 'api.openai.com/v1/chat', type: 'OpenAI API Key', action: 'Synthetic Decoy Deployed', status: 'success', time: '11:32:04' },
  { id: 'tlog-2', domain: 'slack.com/api/files.upload', type: 'Corporate SSH Private Key', action: 'Synthetic Decoy Deployed', status: 'success', time: '11:28:15' },
  { id: 'tlog-3', domain: 'github.com/api/v3', type: 'Admin OAuth Credentials', action: 'Interception Block Triggered', status: 'failed', time: '11:15:42' },
  { id: 'tlog-4', domain: 'internal.sandbox-dev.net', type: 'Database Query Payload', action: 'Whitelisted Bypass Code', status: 'warning', time: '11:02:11' },
  { id: 'tlog-5', domain: 'huggingface.co/api/models', type: 'Production Secret Token', action: 'Synthetic Decoy Deployed', status: 'success', time: '10:58:30' }
];

export default function DashboardOverview({
  policies: propPolicies,
  threatLogs: propLogs,
  onTogglePolicy,
  onDeletePolicy,
  onUploadSuccess
}) {
  const [localPolicies, setLocalPolicies] = useState(INITIAL_POLICIES);
  const [localThreatLogs] = useState(INITIAL_THREAT_LOGS);
  
  // Extension Protection State Sync
  const [isExtensionPaused, setIsExtensionPaused] = useState(false);

  const policies = propPolicies || localPolicies;
  const threatLogs = propLogs || localThreatLogs;

  const decoyCount = threatLogs.filter((l) => l.status === 'success').length;

  // Listen to chrome.storage changes or localStorage for live state
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      chrome.storage.local.get(['extensionPaused'], (result) => {
        setIsExtensionPaused(!!result.extensionPaused);
      });

      const listener = (changes, area) => {
        if (area === 'local' && changes.extensionPaused !== undefined) {
          setIsExtensionPaused(!!changes.extensionPaused.newValue);
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, []);

  // Bridge trigger: Broadcasts state toggle to Extension Content Script
  const handleToggleExtensionProtection = (pauseState) => {
    setIsExtensionPaused(pauseState);
    
    // Broadcast via window.postMessage for content script bridge
    window.postMessage({
      direction: 'from-page-script',
      type: 'SAFELENS_TOGGLE_STATE',
      payload: { extensionPaused: pauseState }
    }, '*');

    // Fallback sync to local storage if accessible
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      chrome.storage.local.set({ extensionPaused: pauseState });
    }
  };

  const handleTogglePolicy = onTogglePolicy || ((id) => {
    setLocalPolicies((prev) =>
      prev.map((policy) =>
        policy.id === id ? { ...policy, enabled: !policy.enabled } : policy
      )
    );
  });

  const handleDeletePolicy = onDeletePolicy || ((id) => {
    setLocalPolicies((prev) => prev.filter((policy) => policy.id !== id));
  });

  const handleUploadSuccess = onUploadSuccess || ((newPolicy) => {
    setLocalPolicies((prev) => [newPolicy, ...prev]);
  });

  return (
    <div className="w-full min-h-screen bg-[#0a0d14] text-white p-4 md:p-8 flex flex-col gap-6 font-sans">
      
      {/* 0. EXTENSION SYNC STATUS BANNER */}
      <GlassCard className={`p-4 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 ${isExtensionPaused ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isExtensionPaused ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">SafeLens AI Protection Shield</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase ${isExtensionPaused ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                {isExtensionPaused ? 'PAUSED / SNOOZED' : 'ARMED & ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {isExtensionPaused ? 'Real-time interceptors are currently snoozed. Outbound LLM prompts are bypassing redaction.' : 'Live interception bridge synchronized with browser extension and FastAPI backend.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleToggleExtensionProtection(!isExtensionPaused)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all duration-200 active:scale-95 shrink-0 ${isExtensionPaused ? 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10'}`}
        >
          {isExtensionPaused ? (
            <>
              <PlayCircle className="w-4 h-4" />
              RESUME SHIELD
            </>
          ) : (
            <>
              <PauseCircle className="w-4 h-4 text-amber-400" />
              SNOOZE PROTECTION
            </>
          )}
        </button>
      </GlassCard>

      {/* 1. TOP KPI METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-cascade delay-1">
        <GlassCard hoverable status="success" glow className="p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">Protection Index</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--color-success)] tracking-tight">94/100</span>
            <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono mt-1">
              <ArrowUpRight className="w-3 h-3 text-[var(--color-success)]" /> +1.2% Risk Reduction
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20">
            <Shield className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard hoverable status="info" glow className="p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">Whitelisted Domains</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--color-info)] tracking-tight">28 Hosts</span>
            <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono mt-1">
              <Zap className="w-3 h-3 text-[var(--color-info)]" /> Global exceptions active
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-info)]/10 text-[var(--color-info)] border border-[var(--color-info)]/20">
            <Globe className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard hoverable status="warning" glow className="p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">Decoy Intercepts</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--color-warning)] tracking-tight">{decoyCount} Swaps</span>
            <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono mt-1">
              <ShieldAlert className="w-3 h-3 text-[var(--color-warning)] animate-bounce" /> Synthetic replacements
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard hoverable className="p-4 flex items-center justify-between border-white/10">
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">LangGraph Checks</span>
            <span className="text-2xl md:text-3xl font-black text-white tracking-tight">1,240 Req</span>
            <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono mt-1">
              <Cpu className="w-3 h-3 text-gray-400" /> Avg Latency: 32ms
            </span>
          </div>
          <div className="p-3 rounded-lg bg-white/5 text-white border border-white/10">
            <Cpu className="w-6 h-6" />
          </div>
        </GlassCard>
      </div>

      {/* 2. MIDDLE SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4 animate-cascade delay-2">
          <AgenticBrain />
        </div>
        <div className="flex flex-col gap-6 animate-cascade delay-3">
          <PolicyUploader onUploadSuccess={handleUploadSuccess} />
          <ActivePolicies
            policies={policies}
            onToggle={handleTogglePolicy}
            onDelete={handleDeletePolicy}
          />
        </div>
      </div>

      {/* 3. BOTTOM ROW: THREAT ACTIVITY FEED */}
      <div className="animate-cascade delay-4">
        <GlassCard className="p-5 border-white/10 w-full">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-[var(--color-danger)]" />
              <h3 className="font-bold text-sm tracking-wider font-mono text-white uppercase">
                Real-Time Privacy Interception Logs
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
              <RefreshCw className="w-3 h-3 animate-spin text-[var(--color-success)]" />
              <span>LIVE UPDATES STREAMED</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 text-[10px] md:text-xs font-mono uppercase select-none pb-2">
                  <th className="py-2.5 font-medium">Timestamp</th>
                  <th className="py-2.5 font-medium">Target Host / API</th>
                  <th className="py-2.5 font-medium">Data Classification</th>
                  <th className="py-2.5 font-medium">Action Resolution</th>
                  <th className="py-2.5 font-medium text-right">Integrity Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs md:text-sm text-gray-300">
                {threatLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/2 transition-colors duration-150">
                    <td className="py-3 text-[11px] text-gray-500">{log.time}</td>
                    <td className="py-3 font-semibold text-white flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span>{log.domain}</span>
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>{log.type}</span>
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-[11px] font-semibold ${log.status === 'success' ? 'text-[var(--color-success)]' : log.status === 'warning' ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'}`}>
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <StatusBadge status={log.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

    </div>
  );
}

DashboardOverview.propTypes = {
  policies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      chunks: PropTypes.number.isRequired,
      date: PropTypes.string.isRequired,
      enabled: PropTypes.bool.isRequired,
    })
  ),
  threatLogs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      domain: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      action: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired,
    })
  ),
  onTogglePolicy: PropTypes.func,
  onDeletePolicy: PropTypes.func,
  onUploadSuccess: PropTypes.func,
};