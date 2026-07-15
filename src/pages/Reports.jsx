import React, { useState } from 'react';
import {
  FileText,
  Download,
  ArrowUpRight,
  Loader2,
  CheckCheck
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import { useSecurity } from '../context/SecurityContext';

const scorecards = [
  {
    framework: 'GDPR Compliance',
    score: 96,
    status: 'Compliant',
    color: 'var(--color-risk-safe)',
    desc: 'General Data Protection Regulation audit successfully validated for EU citizens.',
    auditedDate: 'Jul 05, 2026'
  },
  {
    framework: 'HIPAA Data Shield',
    score: 92,
    status: 'Compliant',
    color: 'var(--color-risk-safe)',
    desc: 'Health Insurance Portability and Accountability Act safeguard standards verified.',
    auditedDate: 'Jun 28, 2026'
  },
  {
    framework: 'PCI-DSS v4.0',
    score: 84,
    status: 'Action Required',
    color: 'var(--color-risk-medium)',
    desc: 'Payment Card Industry Security Standards. 2 minor compliance exclusions pending validation.',
    auditedDate: 'Jul 01, 2026'
  }
];

const mockAudits = [
  {
    id: 'REP-902',
    name: 'gdpr_q2_compliance_report.pdf',
    framework: 'GDPR',
    generated: 'Jul 10, 2026 14:32',
    score: 96,
    status: 'Pass'
  },
  {
    id: 'REP-879',
    name: 'hipaa_h2_security_audit.pdf',
    framework: 'HIPAA',
    generated: 'Jul 08, 2026 09:12',
    score: 92,
    status: 'Pass'
  },
  {
    id: 'REP-852',
    name: 'pci_dss_compliance_revalidation.pdf',
    framework: 'PCI-DSS',
    generated: 'Jul 01, 2026 18:45',
    score: 84,
    status: 'Warning'
  },
  {
    id: 'REP-741',
    name: 'internal_pii_exposure_audit_log.pdf',
    framework: 'Internal Security',
    generated: 'Jun 15, 2026 11:20',
    score: 100,
    status: 'Pass'
  }
];

export default function Reports() {
  const { incidents } = useSecurity();
  const [exportingId, setExportingId] = useState(null);
  const [exportedId, setExportedId] = useState(null);

  // Generate dynamic audits from incidents
  const dynamicAudits = incidents.map(inc => {
    let framework = 'Internal Security';
    if (inc.severity === 'high') framework = 'GDPR';
    else if (inc.severity === 'medium') framework = 'HIPAA';
    
    let score = 100;
    if (inc.severity === 'high') score = 42;
    else if (inc.severity === 'medium') score = 84;

    return {
      id: `REP-${inc.id.replace('INC-', '')}`,
      name: (inc.vector.replace(/\.[^/.]+$/, '') || 'document') + '_audit_log.pdf',
      framework: framework,
      generated: inc.date,
      score: score,
      status: score >= 90 ? 'Pass' : 'Warning'
    };
  });

  const triggerExport = (reportId) => {
    if (exportingId !== null) return;
    setExportingId(reportId);
    setExportedId(null);

    setTimeout(() => {
      setExportingId(null);
      setExportedId(reportId);
      // Auto-dismiss success state after 2.5 s
      setTimeout(() => setExportedId(null), 2500);
    }, 1600);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-bold text-2xl text-text-main tracking-tight">
          Compliance Reporting Hub
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor enterprise security stance relative to GDPR, HIPAA, and PCI-DSS compliance frameworks.
        </p>
      </div>

      {/* Compliance scorecards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {scorecards.map((card) => (
          <GlassCard key={card.framework} className="flex flex-col justify-between relative group">
            {/* Visual background gradient glow */}
            <div
              className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-5 blur-xl group-hover:opacity-10 transition-opacity pointer-events-none"
              style={{ backgroundColor: card.color }}
            />

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-base text-text-main truncate">
                    {card.framework}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono font-medium">Audited: {card.auditedDate}</span>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    card.score >= 90
                      ? 'bg-risk-safe/10 text-risk-safe border border-risk-safe/25'
                      : 'bg-risk-medium/10 text-risk-medium border border-risk-medium/25'
                  }`}
                >
                  {card.status}
                </span>
              </div>

              {/* Radial score dial + progress bar */}
              <div className="flex items-center gap-4 py-2">
                {/* Circular score dial */}
                <div className="relative shrink-0 flex items-center justify-center w-14 h-14 rounded-full border border-border bg-slate-100/50 dark:bg-black/35 font-display font-extrabold text-sm text-text-main">
                  {card.score}%
                  <span
                    className="absolute inset-0.5 rounded-full border-2 border-dashed animate-[spin_20s_linear_infinite] pointer-events-none"
                    style={{ borderColor: `${card.color}40` }}
                  />
                </div>

                {/* Bar + description */}
                <div className="flex-1 min-w-0">
                  <div className="w-full bg-slate-200 dark:bg-black/40 h-2 rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${card.score}%`,
                        backgroundImage: `linear-gradient(to right, var(--color-brand-primary), ${card.color})`
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-snug">
                    {card.desc}
                  </p>
                </div>
              </div>
            </div>

            <button className="mt-5 w-full flex items-center justify-center gap-1 py-1.5 rounded-xl border border-border text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:border-brand-primary/20 hover:text-brand-primary transition-all cursor-pointer">
              Review Action Checklist <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </GlassCard>
        ))}
      </div>

      {/* Main Reports Log */}
      <GlassCard hoverEffect={false}>
        <div className="flex items-center gap-2 pb-6 border-b border-border">
          <FileText className="w-5 h-5 text-brand-primary" />
          <h3 className="font-display font-bold text-base text-text-main">
            Generated Compliance Audits
          </h3>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto scrollbar-thin mt-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-4 px-4 w-[12%]">Report ID</th>
                <th className="py-4 px-4 w-[38%]">Audit File Name</th>
                <th className="py-4 px-4 w-[15%]">Compliance Category</th>
                <th className="py-4 px-4 w-[15%]">Timestamp</th>
                <th className="py-4 px-4 w-[10%] text-center">Score</th>
                <th className="py-4 px-4 w-[10%] text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-slate-700 dark:text-slate-300 font-medium">
              {dynamicAudits.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-slate-100/40 dark:hover:bg-white/[0.02] transition-colors duration-150"
                >
                  <td className="py-4 px-4 font-mono font-bold text-slate-500">{report.id}</td>
                  <td className="py-4 px-4 font-mono font-bold text-text-main truncate max-w-[250px]">
                    {report.name}
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-400">{report.framework}</td>
                  <td className="py-4 px-4 text-slate-500 font-mono">{report.generated}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono font-bold ${
                      report.score >= 90
                        ? 'bg-risk-safe/10 text-risk-safe border border-risk-safe/25'
                        : 'bg-risk-medium/10 text-risk-medium border border-risk-medium/25'
                    }`}>
                      {report.score}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => triggerExport(report.id, report.name)}
                      disabled={exportingId !== null}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-slate-100 dark:hover:bg-white/5 hover:text-brand-primary hover:border-brand-primary/30 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[105px] justify-center"
                    >
                      {exportingId === report.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Exporting...
                        </>
                      ) : exportedId === report.id ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-risk-safe" />
                          <span className="text-risk-safe">Downloaded</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          Export PDF
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
