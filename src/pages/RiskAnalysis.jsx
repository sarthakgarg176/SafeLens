import React, { useState } from 'react';
import {
  ShieldAlert,
  Activity,
  Crosshair,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  GitBranch,
  Database,
  Wifi,
  Server,
  Lock,
  Bug
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import RiskBadge from '../components/common/RiskBadge';
import { useSecurity } from '../context/SecurityContext';

/* ─── Static threat trend data (no need to persist) ───────────────────────── */
const threatTrends = [
  {
    id: 'THR-041',
    title: 'Stale API Endpoints',
    category: 'API Surface',
    severity: 'high',
    icon: Wifi,
    trend: 'up',
    discovered: 'Jul 10, 2026',
    affected: 7,
    detail: 'Deprecated v1 API routes remain publicly routable, lacking auth middleware updates.',
  },
  {
    id: 'THR-038',
    title: 'Exposed Git History Keys',
    category: 'Source Leakage',
    severity: 'high',
    icon: GitBranch,
    trend: 'stable',
    discovered: 'Jul 08, 2026',
    affected: 3,
    detail: 'Committed .env secrets found in public repository commit history via truffleHog scan.',
  },
  {
    id: 'THR-033',
    title: 'Unencrypted S3 Buckets',
    category: 'Cloud Storage',
    severity: 'medium',
    icon: Database,
    trend: 'down',
    discovered: 'Jul 06, 2026',
    affected: 2,
    detail: 'Two S3 objects with sensitive telemetry logs lack server-side encryption at rest.',
  },
  {
    id: 'THR-029',
    title: 'Misconfigured CORS Policy',
    category: 'Web Security',
    severity: 'medium',
    icon: Server,
    trend: 'stable',
    discovered: 'Jul 05, 2026',
    affected: 4,
    detail: 'Production API allows wildcard (*) CORS origins on authenticated endpoints.',
  },
  {
    id: 'THR-021',
    title: 'Outdated TLS Cipher Suite',
    category: 'Cryptography',
    severity: 'medium',
    icon: Lock,
    trend: 'down',
    discovered: 'Jun 29, 2026',
    affected: 1,
    detail: 'TLS 1.0/1.1 cipher suites still negotiated on legacy CDN edge nodes.',
  },
  {
    id: 'THR-014',
    title: 'XSS in Report Export UI',
    category: 'Application Layer',
    severity: 'low',
    icon: Bug,
    trend: 'stable',
    discovered: 'Jun 20, 2026',
    affected: 1,
    detail: 'Reflected XSS vector in filename sanitisation inside PDF report export flow.',
  },
];

/* ─── Trend arrow ──────────────────────────────────────────────────────────── */
function TrendIndicator({ trend }) {
  if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-risk-high" />;
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-risk-safe" />;
  return <ChevronRight className="w-3.5 h-3.5 text-risk-low" />;
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function RiskAnalysis() {
  /* ── Pull live activeVectorCount from shared context ────────────────────── */
  const { activeVectorCount } = useSecurity();

  /* ── Local expand state — purely UI, no need to persist ─────────────────── */
  const [expanding, setExpanding] = useState(null);

  const toggleExpand = (id) =>
    setExpanding((prev) => (prev === id ? null : id));

  /* ── Build metrics array with live activeVectorCount ─────────────────────── */
  const metrics = [
    {
      label: 'System Threat Index',
      value: '7.4',
      unit: '/ 10',
      delta: '+0.3 since last scan',
      trend: 'up',
      icon: ShieldAlert,
      color: 'var(--color-risk-high)',
      desc: 'Composite vulnerability index aggregating CVE feeds, exposure breadth, and exploit probability.',
    },
    {
      label: 'Unmitigated Exposure Surface',
      value: '23',
      unit: 'Endpoints',
      delta: '−4 mitigated this week',
      trend: 'down',
      icon: Crosshair,
      color: 'var(--color-risk-medium)',
      desc: 'Total count of externally reachable service endpoints with no active WAF or auth gate.',
    },
    {
      label: 'Active Vector Count',
      value: String(activeVectorCount),
      unit: 'Vectors',
      delta: activeVectorCount > 3 ? `${activeVectorCount} unresolved incidents` : 'Nearly contained',
      trend: activeVectorCount > 3 ? 'up' : 'down',
      icon: Activity,
      color: activeVectorCount > 3 ? 'var(--color-risk-high)' : 'var(--color-risk-safe)',
      desc: 'Live exploit vectors derived from unmitigated incidents across the platform.',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-text-main tracking-tight">
            Risk Analysis
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Vulnerability intelligence command centre — monitor exposure metrics, active threat
            vectors, and remediation priority queues in real time.
          </p>
        </div>
        <button className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-brand-primary hover:border-brand-primary/30 transition-all cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" />
          Re-scan
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <GlassCard key={m.label} className="flex flex-col gap-3 relative group overflow-hidden">
              {/* Glow */}
              <div
                className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-5 blur-2xl group-hover:opacity-10 transition-opacity pointer-events-none"
                style={{ backgroundColor: m.color }}
              />

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {m.label}
                </span>
                <div
                  className="p-2 rounded-xl border border-border"
                  style={{ color: m.color, backgroundColor: `${m.color}10` }}
                >
                  <Icon className="w-4 h-4 stroke-[2]" />
                </div>
              </div>

              <div className="flex items-end gap-1">
                <span className="font-display font-extrabold text-4xl text-text-main leading-none transition-all duration-300">
                  {m.value}
                </span>
                <span className="text-sm text-slate-400 font-semibold mb-0.5">{m.unit}</span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                {m.trend === 'up' ? (
                  <TrendingUp className="w-3.5 h-3.5 text-risk-high" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-risk-safe" />
                )}
                {m.delta}
              </div>

              <p className="text-[11px] text-slate-400 leading-snug border-t border-border pt-3">
                {m.desc}
              </p>
            </GlassCard>
          );
        })}
      </div>

      {/* Threat trends table */}
      <GlassCard hoverEffect={false}>
        <div className="flex items-center gap-2 pb-6 border-b border-border">
          <AlertTriangle className="w-5 h-5 text-risk-high" />
          <h3 className="font-display font-bold text-base text-text-main">
            Top Active Threat Trends
          </h3>
          <span className="ml-auto text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-risk-high/10 text-risk-high border border-risk-high/25">
            {threatTrends.length} TRACKED
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-thin mt-6">
          <table className="w-full text-left text-xs border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-border text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-4 px-4 w-[12%]">Vector ID</th>
                <th className="py-4 px-4 w-[26%]">Threat Title</th>
                <th className="py-4 px-4 w-[16%]">Category</th>
                <th className="py-4 px-4 w-[12%] text-center">Severity</th>
                <th className="py-4 px-4 w-[8%] text-center">Trend</th>
                <th className="py-4 px-4 w-[12%]">Discovered</th>
                <th className="py-4 px-4 w-[8%] text-center">Affected</th>
                <th className="py-4 px-4 w-[6%] text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-text-main font-medium">
              {threatTrends.map((t) => {
                const Icon = t.icon;
                const isOpen = expanding === t.id;
                return (
                  <React.Fragment key={t.id}>
                    <tr className="hover:bg-slate-100/40 dark:hover:bg-white/[0.02] transition-colors duration-150">
                      <td className="py-4 px-4 font-mono font-bold text-slate-500">{t.id}</td>
                      <td className="py-4 px-4">
                        <span className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold">{t.title}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500">{t.category}</td>
                      <td className="py-4 px-4 text-center">
                        <RiskBadge level={t.severity} />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="flex justify-center">
                          <TrendIndicator trend={t.trend} />
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-mono">{t.discovered}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-mono font-bold text-text-main">{t.affected}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => toggleExpand(t.id)}
                          aria-label="Toggle details"
                          className={`p-1.5 rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-all ${
                            isOpen
                              ? 'text-brand-primary border-brand-primary/30 bg-brand-primary/5'
                              : 'text-slate-400'
                          }`}
                        >
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isOpen ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-slate-50/50 dark:bg-black/10">
                        <td colSpan={8} className="px-6 py-3">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border-l-2 border-brand-primary/50 pl-3">
                            {t.detail}
                          </p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
