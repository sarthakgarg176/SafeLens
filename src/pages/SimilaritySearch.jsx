import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Copy,
  Image,
  FileCode2,
  Globe,
  ShieldAlert,
  Zap,
  ExternalLink,
  CheckCheck,
  AlertTriangle,
  Fingerprint
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';

/* ─── Mock dataset ─────────────────────────────────────────────────────────── */
const cloneData = [
  {
    id: 'SIM-001',
    name: 'privacy-shield-clone.net',
    matchType: 'Domain Impersonation',
    source: 'WhoisXML API',
    confidence: 97.2,
    icon: Globe,
    color: 'var(--color-risk-high)',
    routed: false
  },
  {
    id: 'SIM-002',
    name: 'shield_logo_copy_v2.png',
    matchType: 'Logo Impersonation',
    source: 'Google Reverse Image',
    confidence: 94.5,
    icon: Image,
    color: 'var(--color-risk-high)',
    routed: false
  },
  {
    id: 'SIM-003',
    name: 'privacyshielddocs-mirror.com',
    matchType: 'Cloned Asset',
    source: 'Shodan Crawler',
    confidence: 88.1,
    icon: Copy,
    color: 'var(--color-risk-medium)',
    routed: false
  },
  {
    id: 'SIM-004',
    name: 'ps-ai-login-phish.io',
    matchType: 'Phishing Page Clone',
    source: 'PhishTank Database',
    confidence: 91.7,
    icon: ShieldAlert,
    color: 'var(--color-risk-high)',
    routed: false
  },
  {
    id: 'SIM-005',
    name: 'safelens_admin_panel_copy.html',
    matchType: 'Cloned Asset',
    source: 'VirusTotal Submission',
    confidence: 76.3,
    icon: FileCode2,
    color: 'var(--color-risk-medium)',
    routed: false
  },
  {
    id: 'SIM-006',
    name: 'privacyshield-variant-eu.co.uk',
    matchType: 'Domain Impersonation',
    source: 'WhoisXML API',
    confidence: 62.8,
    icon: Globe,
    color: 'var(--color-risk-low)',
    routed: false
  }
];

/* ─── Confidence badge ─────────────────────────────────────────────────────── */
function ConfidencePill({ value }) {
  const classes =
    value >= 90
      ? 'bg-risk-high/10 text-risk-high border-risk-high/30'
      : value >= 75
      ? 'bg-risk-medium/10 text-risk-medium border-risk-medium/30'
      : 'bg-risk-low/10 text-risk-low border-risk-low/30';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono font-extrabold ${classes}`}>
      <Fingerprint className="w-3 h-3" />
      {value.toFixed(1)}%
    </span>
  );
}

/* ─── Match-type badge ─────────────────────────────────────────────────────── */
function MatchTypeBadge({ type }) {
  return (
    <span className="inline-flex px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">
      {type}
    </span>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function SimilaritySearch() {
  const [query, setQuery] = useState('');
  const [threshold, setThreshold] = useState(60);
  const [routed, setRouted] = useState({});   // id -> true/false

  const routeToTakedown = (id) => {
    setRouted((prev) => ({ ...prev, [id]: true }));
  };

  const filtered = useMemo(() => {
    return cloneData.filter(
      (c) =>
        c.confidence >= threshold &&
        (c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.matchType.toLowerCase().includes(query.toLowerCase()) ||
          c.source.toLowerCase().includes(query.toLowerCase()))
    );
  }, [query, threshold]);

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-bold text-2xl text-text-main tracking-tight">
          Similarity Search
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Detect lookalike assets, cloned domains, and impersonation resources
          across open-source intelligence feeds and reverse-image pipelines.
        </p>
      </div>

      {/* Toolbar GlassCard */}
      <GlassCard padding="p-5" hoverEffect={false}>
        <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-end">
          {/* Search input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search resource name, match type, source..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-slate-100/50 dark:bg-black/20 focus:bg-surface text-text-main placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
            />
          </div>

          {/* Threshold slider */}
          <div className="flex flex-col gap-1.5 w-full lg:w-64 shrink-0">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Min. Confidence Threshold
              </span>
              <span className="font-mono font-extrabold text-sm text-brand-primary">
                {threshold}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full h-1.5 rounded-full accent-brand-primary cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--color-brand-primary) ${threshold}%, rgba(100,116,139,0.25) ${threshold}%)`
              }}
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Live count */}
        <p className="mt-4 text-[11px] text-slate-400 font-medium">
          Showing{' '}
          <span className="text-text-main font-bold">{filtered.length}</span>{' '}
          of {cloneData.length} flagged resources at ≥{threshold}% confidence.
        </p>
      </GlassCard>

      {/* Clone cards grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((clone) => {
            const Icon = clone.icon;
            const isRouted = routed[clone.id];

            return (
              <GlassCard key={clone.id} className="flex flex-col gap-4 relative group overflow-hidden">
                {/* Glow accent */}
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 blur-2xl group-hover:opacity-10 transition-opacity pointer-events-none"
                  style={{ backgroundColor: clone.color }}
                />

                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="p-2.5 rounded-xl border border-border shrink-0"
                    style={{ color: clone.color, backgroundColor: `${clone.color}10` }}
                  >
                    <Icon className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <ConfidencePill value={clone.confidence} />
                </div>

                {/* Resource name */}
                <div className="space-y-1 min-w-0">
                  <p className="font-mono font-bold text-sm text-text-main truncate" title={clone.name}>
                    {clone.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <MatchTypeBadge type={clone.matchType} />
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium border-t border-border pt-3">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-brand-primary" />
                    {clone.source}
                  </span>
                  <span className="font-mono">{clone.id}</span>
                </div>

                {/* Action button */}
                {isRouted ? (
                  <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-risk-safe/30 bg-risk-safe/10 text-risk-safe text-xs font-semibold">
                    <CheckCheck className="w-3.5 h-3.5" />
                    Routed to Takedown
                  </div>
                ) : (
                  <button
                    onClick={() => routeToTakedown(clone.id)}
                    className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-risk-high/40 hover:text-risk-high hover:bg-risk-high/5 transition-all cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-risk-high" />
                    Route to Takedown Center
                  </button>
                )}
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard hoverEffect={false}>
          <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
              <Search className="w-7 h-7" />
            </div>
            <p className="font-display font-bold text-base text-text-main">No Matches Found</p>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Adjust your confidence threshold or search term to surface lookalike assets.
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
