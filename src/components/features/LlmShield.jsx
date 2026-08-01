import React, { useState, useEffect } from 'react';
import { Bot, KeyRound, Gauge, ScanEye } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import StatusBadge from '../timeline/StatusBadge';
import { fetchIncidents, getCachedIncidents, classifyIncident, statusToTone } from '../../services/api';

/**
 * LlmShield
 * Shows what the AI Prompt Inspector caught in outbound LLM traffic and how it was neutralized.
 * Pulls from the unified /api/incidents feed, filtered to LLM-provider vectors.
 */
export default function LlmShield() {
  const [incidents, setIncidents] = useState(() => getCachedIncidents() || []);
  const [loaded, setLoaded] = useState(() => Boolean(getCachedIncidents()));

  useEffect(() => {
    let isMounted = true;
    fetchIncidents().then((data) => {
      if (isMounted) {
        setIncidents(data);
        setLoaded(true);
      }
    });
    return () => { isMounted = false; };
  }, []);

  if (!loaded) {
    return (
      <div className="w-full min-h-screen bg-[#0a0d14] text-white p-4 md:p-8 flex items-center justify-center font-sans">
        <span className="text-xs text-gray-500 font-mono uppercase tracking-widest">Loading LLM Shield telemetry…</span>
      </div>
    );
  }

  const llmIncidents = incidents.filter((i) => classifyIncident(i) === 'llm');
  const highSeverityCount = llmIncidents.filter((i) => ['high', 'serious', 'critical'].includes((i.severity || '').toLowerCase())).length;
  const decoysInjectedCount = llmIncidents.filter((i) => i.metadata?.decoyPayload).length;
  const diffExample = llmIncidents.find((i) => i.metadata?.originalPayload && i.metadata?.decoyPayload);

  return (
    <div className="w-full min-h-screen bg-[#0a0d14] text-white p-4 md:p-8 flex flex-col gap-6 font-sans">

      {/* Header */}
      <div className="flex items-center gap-3 animate-cascade delay-1">
        <div className="p-3 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-wider uppercase">LLM Shield</h2>
          <p className="text-xs text-gray-500 font-mono">
            Catches API keys, passwords &amp; PII in AI prompts and swaps them with decoys before they leave the browser.
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-cascade delay-2">
        <GlassCard hoverable status="info" glow className="p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">Total Intercepts</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--color-info)] tracking-tight">{llmIncidents.length}</span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-info)]/10 text-[var(--color-info)] border border-[var(--color-info)]/20">
            <ScanEye className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard hoverable status="warning" glow className="p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">High Severity</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--color-warning)] tracking-tight">{highSeverityCount}</span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20">
            <KeyRound className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard hoverable className="p-4 flex items-center justify-between border-white/10">
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">Decoys Injected</span>
            <span className="text-2xl md:text-3xl font-black text-white tracking-tight">{decoysInjectedCount}</span>
          </div>
          <div className="p-3 rounded-lg bg-white/5 text-white border border-white/10">
            <Gauge className="w-6 h-6" />
          </div>
        </GlassCard>
      </div>

      {/* Intercept Log Table */}
      <div className="animate-cascade delay-3">
        <GlassCard className="p-5 border-white/10 w-full">
          <h3 className="font-bold text-sm tracking-wider font-mono text-white uppercase border-b border-white/5 pb-4 mb-4">
            Recent Intercepts
          </h3>
          <div className="w-full overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 text-[10px] md:text-xs font-mono uppercase select-none">
                  <th className="py-2.5 font-medium">Timestamp</th>
                  <th className="py-2.5 font-medium">Provider</th>
                  <th className="py-2.5 font-medium">Detected Category</th>
                  <th className="py-2.5 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs md:text-sm text-gray-300">
                {llmIncidents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">No LLM intercepts yet.</td>
                  </tr>
                )}
                {llmIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-white/2 transition-colors duration-150">
                    <td className="py-3 text-[11px] text-gray-500">{incident.date}</td>
                    <td className="py-3 font-semibold text-white">{incident.vector}</td>
                    <td className="py-3">{incident.url}</td>
                    <td className="py-3 text-right"><StatusBadge status={statusToTone(incident.status)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Raw vs Sanitized Diff (first available example) */}
      {diffExample && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-cascade delay-4">
          <GlassCard status="danger" className="p-4">
            <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--color-danger)]">Raw (never sent)</span>
            <pre className="font-mono text-xs md:text-sm text-gray-300 mt-3 leading-relaxed whitespace-pre-wrap">
              {diffExample.metadata.originalPayload}
            </pre>
          </GlassCard>
          <GlassCard status="success" className="p-4">
            <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--color-success)]">Sanitized (actually sent)</span>
            <pre className="font-mono text-xs md:text-sm text-gray-300 mt-3 leading-relaxed whitespace-pre-wrap">
              {diffExample.metadata.decoyPayload}
            </pre>
          </GlassCard>
        </div>
      )}

    </div>
  );
}