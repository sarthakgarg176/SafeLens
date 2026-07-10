import React, { useState } from 'react';
import {
  Gavel,
  Percent,
  AlertOctagon,
  Globe2,
  Trash2,
  Layers,
  X,
  FileSignature,
  CheckCircle2
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import { useSecurity } from '../context/SecurityContext';

const takedownStats = [
  {
    title: 'Total Requests Filed',
    value: '142 Demands',
    change: 'Cumulative filings',
    icon: Gavel,
    color: 'var(--color-brand-primary)'
  },
  {
    title: 'Successful Removal Rate',
    value: '88.4%',
    change: 'Industry benchmark: 72%',
    icon: Percent,
    color: 'var(--color-risk-safe)'
  },
  {
    title: 'Pending Escalations',
    value: '12 Active',
    change: 'Domain suspension queue',
    icon: AlertOctagon,
    color: 'var(--color-risk-high)'
  }
];

function getStatusClasses(status) {
  if (status.includes('Mitigated') || status.includes('Approved')) {
    return 'bg-risk-safe/10 text-risk-safe border border-risk-safe/25';
  }
  if (status.includes('Pending') || status.includes('Notice')) {
    return 'bg-risk-medium/10 text-risk-medium border border-risk-medium/25';
  }
  return 'bg-brand-primary/10 text-brand-primary border border-brand-primary/25 font-bold';
}

export default function TakedownCenter() {
  /* ── Consume shared context ─────────────────────────────────────────────── */
  const { takedowns, triggerLegalTakedown } = useSecurity();

  /* ── Local modal state ──────────────────────────────────────────────────── */
  const [selectedTakedown, setSelectedTakedown] = useState(null);
  const [legalNotes, setLegalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successTarget, setSuccessTarget] = useState('');

  const openModal = (td) => {
    setSelectedTakedown(td);
    setLegalNotes('');
    setSuccessTarget('');
  };

  const closeModal = () => {
    if (submitting) return;
    setSelectedTakedown(null);
    setLegalNotes('');
    setSuccessTarget('');
    setSubmitting(false);
  };

  const handleEscalationSubmit = (e) => {
    e.preventDefault();
    if (!selectedTakedown || submitting) return;
    setSubmitting(true);

    setTimeout(() => {
      // Dispatch to context (persists to localStorage automatically)
      triggerLegalTakedown(selectedTakedown.id);
      setSuccessTarget(selectedTakedown.target);
      setSubmitting(false);

      // Auto-close after 2 seconds
      setTimeout(() => {
        setSelectedTakedown(null);
        setLegalNotes('');
        setSuccessTarget('');
      }, 2000);
    }, 1200);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-bold text-2xl text-text-main tracking-tight">
          Tactical Legal Remediation
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review, issue, and escalate DMCA or registrar takedown demands targeting domain-squatting
          or credential exposures.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {takedownStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.title} padding="p-5" className="relative overflow-hidden group">
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 blur-xl group-hover:opacity-10 transition-opacity pointer-events-none"
                style={{ backgroundColor: stat.color }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
                  {stat.title}
                </span>
                <div
                  className="p-2 rounded-xl border border-border"
                  style={{ color: stat.color, backgroundColor: `${stat.color}10` }}
                >
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-display font-bold text-2xl text-text-main tracking-tight">
                  {stat.value}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-1">{stat.change}</p>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Takedown Table Card */}
      <GlassCard hoverEffect={false}>
        <div className="flex items-center gap-2 pb-6 border-b border-border">
          <Gavel className="w-5 h-5 text-brand-primary animate-pulse" />
          <h3 className="font-display font-bold text-base text-text-main">
            Active Legal Removal Streams
          </h3>
        </div>

        <div className="overflow-x-auto scrollbar-thin mt-6">
          <table className="w-full text-left text-xs border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-border text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-4 px-4 w-[12%]">Target ID</th>
                <th className="py-4 px-4 w-[28%]">Target Host/URL</th>
                <th className="py-4 px-4 w-[20%]">Takedown Protocol</th>
                <th className="py-4 px-4 w-[12%] text-center">Filing Count</th>
                <th className="py-4 px-4 w-[13%] text-center">Status</th>
                <th className="py-4 px-4 w-[15%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-text-main font-medium">
              {takedowns.map((td) => (
                <tr
                  key={td.id}
                  className="hover:bg-slate-100/40 dark:hover:bg-white/[0.02] transition-colors duration-150"
                >
                  <td className="py-4 px-4 font-mono font-bold text-slate-500">{td.id}</td>
                  <td className="py-4 px-4 font-mono font-bold text-text-main max-w-[220px]">
                    <span className="flex items-center gap-1.5">
                      <Globe2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{td.target}</span>
                    </span>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {td.type}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-bold">{td.counter}</td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase whitespace-nowrap ${getStatusClasses(td.status)}`}
                    >
                      {td.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => openModal(td)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-slate-100 dark:hover:bg-white/5 hover:text-risk-high hover:border-risk-high/30 transition-all text-xs font-semibold cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-risk-high shrink-0" /> Escalate to Legal
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ── Escalation Modal Dialog ── */}
      {selectedTakedown && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Dark backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeModal}
          />

          {/* Dialog card */}
          <div
            className="relative w-full max-w-md border border-border rounded-2xl shadow-2xl p-6 z-10 space-y-4"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-brand-primary" />
                <h3 id="modal-title" className="font-display font-bold text-base text-text-main">
                  Legal Team Escalation
                </h3>
              </div>
              <button
                onClick={closeModal}
                disabled={submitting}
                aria-label="Close modal"
                className="p-1 rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Success state */}
            {successTarget ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-risk-safe/10 border border-risk-safe/30 text-risk-safe flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 stroke-[2]" />
                </div>
                <p className="text-sm font-semibold text-text-main leading-snug">Escalation Filed</p>
                <p className="text-xs text-slate-400 px-2 leading-relaxed">
                  Legal dispatch pending for{' '}
                  <span className="font-mono font-bold text-text-main">{successTarget}</span>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEscalationSubmit} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
                    Takedown Host Target
                  </span>
                  <p className="text-sm font-mono font-bold text-text-main bg-slate-100/60 dark:bg-black/25 border border-border p-2 rounded-lg truncate">
                    {selectedTakedown.target}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
                    Takedown Protocol Type
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                    {selectedTakedown.type}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="legal-notes"
                    className="text-[10px] text-slate-400 uppercase font-mono font-semibold block"
                  >
                    Legal Escalation Notes &amp; Evidence
                  </label>
                  <textarea
                    id="legal-notes"
                    required
                    rows={3}
                    placeholder="Provide evidentiary notes, hosting IP, whois details, or domain squatting screenshot references..."
                    value={legalNotes}
                    onChange={(e) => setLegalNotes(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-slate-100/50 dark:bg-black/20 focus:bg-surface text-text-main placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-text-main hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-xs font-semibold hover:shadow-lg hover:shadow-brand-primary/25 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all inline-flex items-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Confirm Submission'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
