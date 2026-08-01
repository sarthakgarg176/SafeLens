import React, { useState, useEffect } from 'react';
import { Globe, ShieldCheck, Gauge, ScanEye, CheckCircle2 } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { fetchIncidents, getCachedIncidents, classifyIncident, decoyActionLabel } from '../../services/api';

/**
 * DecoySwapper
 * Shows spoofed/phishing sites caught and the synthetic decoy credentials fed to them instead of real ones.
 * Pulls from the unified /api/incidents feed, filtered to non-LLM (domain spoofing) vectors.
 */
export default function DecoySwapper() {
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
        <span className="text-xs text-gray-500 font-mono uppercase tracking-widest">Loading Decoy Swapper telemetry…</span>
      </div>
    );
  }

  const decoyIncidents = incidents.filter((i) => classifyIncident(i) === 'decoy');
  const decoysInjectedCount = decoyIncidents.filter((i) => i.metadata?.decoyPayload).length;
  const successRate = decoyIncidents.length
    ? Math.round((decoyIncidents.filter((i) => i.status !== 'Escalated').length / decoyIncidents.length) * 100)
    : 100;

  return (
    <div className="w-full min-h-screen bg-[#0a0d14] text-white p-4 md:p-8 flex flex-col gap-6 font-sans">

      {/* Header */}
      <div className="flex items-center gap-3 animate-cascade delay-1">
        <div className="p-3 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20">
          <Globe className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-wider uppercase">Decoy Swapper</h2>
          <p className="text-xs text-gray-500 font-mono">
            Spots phishing sites and feeds them fake-but-valid-looking card &amp; Aadhaar numbers instead of real ones.
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-cascade delay-2">
        <GlassCard hoverable status="info" glow className="p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">Flagged Domains</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--color-info)] tracking-tight">{decoyIncidents.length}</span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-info)]/10 text-[var(--color-info)] border border-[var(--color-info)]/20">
            <ScanEye className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard hoverable status="success" glow className="p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">Decoys Injected</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--color-success)] tracking-tight">{decoysInjectedCount}</span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard hoverable className="p-4 flex items-center justify-between border-white/10">
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">Success Rate</span>
            <span className="text-2xl md:text-3xl font-black text-white tracking-tight">{successRate}%</span>
          </div>
          <div className="p-3 rounded-lg bg-white/5 text-white border border-white/10">
            <Gauge className="w-6 h-6" />
          </div>
        </GlassCard>
      </div>

      {/* Algorithmic decoy badges */}
      <div className="flex gap-2 flex-wrap animate-cascade delay-3">
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 uppercase tracking-wider">
          Luhn-Compliant Card Decoy
        </span>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 uppercase tracking-wider">
          Verhoeff-Compliant Aadhaar Decoy
        </span>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[var(--color-info)]/10 text-[var(--color-info)] border border-[var(--color-info)]/20 uppercase tracking-wider">
          Synthetic Decoy Injected
        </span>
      </div>

      {/* Flagged sites table */}
      <div className="animate-cascade delay-4">
        <GlassCard className="p-5 border-white/10 w-full">
          <h3 className="font-bold text-sm tracking-wider font-mono text-white uppercase border-b border-white/5 pb-4 mb-4">
            Flagged Sites
          </h3>
          <div className="w-full overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 text-[10px] md:text-xs font-mono uppercase select-none">
                  <th className="py-2.5 font-medium">Target Host</th>
                  <th className="py-2.5 font-medium">Detection Category</th>
                  <th className="py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs md:text-sm text-gray-300">
                {decoyIncidents.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-gray-500">No flagged sites yet.</td>
                  </tr>
                )}
                {decoyIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-white/2 transition-colors duration-150">
                    <td className="py-3 font-semibold text-white">{incident.vector}</td>
                    <td className="py-3">{incident.url}</td>
                    <td className="py-3 text-right">
                      <span className="text-[var(--color-success)] text-[11px] font-semibold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {decoyActionLabel(incident).toUpperCase()}
                      </span>
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
