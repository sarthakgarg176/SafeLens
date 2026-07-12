import React, { useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import RiskBadge from '../components/common/RiskBadge';
import { useSecurity } from '../context/SecurityContext';

/**
 * Returns Tailwind classes for the status SELECT element (background + text + border).
 */
function getStatusClasses(status) {
  switch (status) {
    case 'Mitigated':
      return 'bg-risk-safe/10 text-risk-safe border-risk-safe/40';
    case 'Investigating':
      return 'bg-risk-low/10 text-risk-low border-risk-low/40';
    case 'Escalated':
      return 'bg-risk-high/10 text-risk-high border-risk-high/40';
    default:
      return 'bg-surface text-text-main border-border';
  }
}

/**
 * Returns Tailwind classes for the left-border accent on each table row.
 */
function getRowAccent(status) {
  switch (status) {
    case 'Mitigated':
      return 'border-l-4 border-l-risk-safe';
    case 'Escalated':
      return 'border-l-4 border-l-risk-high';
    case 'Investigating':
      return 'border-l-4 border-l-risk-low';
    default:
      return 'border-l-4 border-l-transparent';
  }
}

export default function Incidents() {
  /* ── Consume shared context ─────────────────────────────────────────────── */
  const { incidents, updateIncidentStatus } = useSecurity();

  /* ── Local UI state (filter / search — no need to persist) ─────────────── */
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.vector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity =
      filterSeverity === 'All' ||
      inc.severity.toLowerCase() === filterSeverity.toLowerCase();
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-bold text-2xl text-text-main tracking-tight">
          Active Threat Monitoring Board
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review and update current incident resolution cycles for detected credential exposures,
          source repositories, or open assets.
        </p>
      </div>

      {/* Grid container log */}
      <GlassCard hoverEffect={false}>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search threat vectors, incident IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-slate-100/50 dark:bg-black/20 focus:bg-surface text-text-main placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Filter className="w-4 h-4" />
              <span>Severity:</span>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text-main font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer transition-all"
              >
                <option value="All">All Severities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <button
              className="p-2 rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
              title="Refresh Incidents"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Incidents Data Table */}
        <div className="overflow-x-auto scrollbar-thin mt-6">
          <table className="w-full text-left text-xs border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-border text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-4 px-4 w-[13%]">Incident ID</th>
                <th className="py-4 px-4 w-[22%]">Threat Vector</th>
                <th className="py-4 px-4 w-[28%]">Source Leak URL</th>
                <th className="py-4 px-4 w-[13%]">Discovery Date</th>
                <th className="py-4 px-4 w-[10%] text-center">Severity</th>
                <th className="py-4 px-4 w-[14%] text-center">Resolution Cycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-text-main font-medium">
              {filteredIncidents.map((inc) => (
                <tr
                  key={inc.id}
                  className={`hover:bg-slate-100/40 dark:hover:bg-white/[0.02] transition-colors duration-150 ${getRowAccent(inc.status)}`}
                >
                  <td className="py-4 px-4 font-mono font-bold text-text-main">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-risk-medium shrink-0" />
                      {inc.id}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-semibold text-text-main">{inc.vector}</td>
                  <td className="py-4 px-4 font-mono text-[11px] max-w-[220px]">
                    <a
                      href={inc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-primary hover:text-brand-secondary inline-flex items-center gap-1 truncate max-w-full"
                    >
                      <span className="truncate">{inc.url}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                    </a>
                  </td>
                  <td className="py-4 px-4 text-slate-500">{inc.date}</td>
                  <td className="py-4 px-4 text-center">
                    <RiskBadge level={inc.severity} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <select
                      value={inc.status}
                      onChange={(e) => updateIncidentStatus(inc.id, e.target.value)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-primary/40 transition-all duration-200 ${getStatusClasses(inc.status)}`}
                    >
                      <option value="Investigating">Investigating</option>
                      <option value="Mitigated">Mitigated</option>
                      <option value="Escalated">Escalated</option>
                    </select>
                  </td>
                </tr>
              ))}

              {filteredIncidents.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No open security threats registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Information Tip block */}
      <div className="flex items-start gap-2.5 p-4 rounded-xl border border-border bg-slate-100/30 dark:bg-black/10">
        <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
        <p className="text-[11px] font-medium text-slate-400">
          Modifying the Resolution Cycle updates active audit trackers and re-calibrates the Risk
          Analysis active vector count in real time. Changes are persisted to local storage
          automatically.
        </p>
      </div>
    </div>
  );
}
