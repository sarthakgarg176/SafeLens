import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ShieldCheck,
  Globe2,
  AlertOctagon,
  ScanEye,
  ArrowUpRight,
  Fingerprint,
  Calendar,
  Lock,
  Cpu
} from 'lucide-react';
import GlassCard from './common/GlassCard';
import RiskBadge from './common/RiskBadge';
import DataMaskViewer from './common/DataMaskViewer';
import SecureDropzone from './common/SecureDropzone';

const stats = [
  {
    title: 'Security Posture Score',
    value: '94/100',
    change: '+1.2% this week',
    changeType: 'up',
    color: 'var(--color-risk-safe)',
    icon: ShieldCheck,
    glow: 'neon-glow-purple'
  },
  {
    title: 'Monitored Assets',
    value: '284',
    change: '+14 new domains',
    changeType: 'up',
    color: 'var(--color-risk-low)',
    icon: Globe2
  },
  {
    title: 'Active Incidents',
    value: '3',
    change: '2 Critical, 1 High',
    changeType: 'danger',
    color: 'var(--color-risk-high)',
    icon: AlertOctagon,
    glow: 'neon-glow-red'
  },
  {
    title: 'Similarity Scans (24h)',
    value: '48,924',
    change: 'Normal rate',
    changeType: 'neutral',
    color: 'var(--color-brand-primary)',
    icon: ScanEye
  }
];

const alerts = [
  {
    id: 1,
    title: 'Typosquatting Domain Detected',
    target: 'privacyshield-ai.co',
    severity: 'High',
    time: '12 minutes ago',
    desc: 'Identified registration of active spoofing target mimicking primary branding.'
  },
  {
    id: 2,
    title: 'SSL Certificate Expiration',
    target: 'api.privacyshield.ai',
    severity: 'Medium',
    time: '2 hours ago',
    desc: 'Certificate expires in 14 days. Auto-renew validation is pending DNS verification.'
  },
  {
    id: 3,
    title: 'DMARC Failures Spike',
    target: 'mail.privacyshield.ai',
    severity: 'Low',
    time: '5 hours ago',
    desc: 'Unusual volume of failed email authentications detected from external European IPs.'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 25 } }
};

export default function DashboardGrid() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 space-y-6"
    >
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <GlassCard
              key={stat.title}
              variants={cardVariants}
              padding="p-5"
              className={`flex flex-col justify-between overflow-hidden relative group cursor-pointer ${stat.glow || ''}`}
            >
              {/* Background gradient hint */}
              <div 
                className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-xl group-hover:opacity-20 transition-opacity duration-300"
                style={{ backgroundColor: stat.color }}
              />
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase">
                  {stat.title}
                </span>
                <div 
                  className="p-2 rounded-xl border border-border"
                  style={{ color: stat.color, backgroundColor: `${stat.color}08` }}
                >
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-display font-bold text-2xl text-slate-800 dark:text-slate-100 tracking-tight">
                  {stat.value}
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {stat.changeType === 'up' && <TrendingUp className="w-3.5 h-3.5 text-risk-safe" />}
                  <span className={`text-xs font-medium ${
                    stat.changeType === 'danger' 
                      ? 'text-risk-high' 
                      : stat.changeType === 'up' 
                      ? 'text-risk-safe' 
                      : 'text-slate-400'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Phase 2 UI Showcase: Data Masking & Secure File Dropzone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard variants={cardVariants} className="flex flex-col justify-between">
          <DataMaskViewer />
        </GlassCard>
        <GlassCard variants={cardVariants} className="flex flex-col justify-between">
          <SecureDropzone />
        </GlassCard>
      </div>


      {/* Main Threat Intel Section (Two-Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Live Threat Monitor */}
        <motion.div 
          variants={cardVariants}
          className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">
                  Active Security Incidents
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Threat vector triggers requiring analyst verification.
                </p>
              </div>
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Incident list */}
            <div className="mt-4 space-y-3.5">
              {alerts.map((alert) => {
                const borderColors = {
                  High: 'border-l-risk-high',
                  Medium: 'border-l-risk-medium',
                  Low: 'border-l-risk-low',
                };
                const badgeColors = {
                  High: 'bg-risk-high/10 text-risk-high',
                  Medium: 'bg-risk-medium/10 text-risk-medium',
                  Low: 'bg-risk-low/10 text-risk-low',
                };
                return (
                  <div
                    key={alert.id}
                    className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 rounded-xl border border-border border-l-4 ${borderColors[alert.severity]} bg-slate-50/50 dark:bg-black/10 hover:bg-slate-50 dark:hover:bg-black/20 transition-all duration-200 group cursor-pointer`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <RiskBadge level={alert.severity} className="py-0.5 px-2 text-[10px]" />
                        <h4 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-200">
                          {alert.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Target Resource: <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">{alert.target}</code>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {alert.desc}
                      </p>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 font-medium">{alert.time}</span>
                      <button className="opacity-0 group-hover:opacity-100 text-xs font-semibold text-brand-primary flex items-center gap-0.5 transition-all duration-200">
                        Investigate <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Right 1/3: Similarity Vector Visualization */}
        <motion.div 
          variants={cardVariants}
          className="glass-card p-6 rounded-2xl flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">
                Threat Density Map
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Simulated AI vector space telemetry.
              </p>
            </div>

            {/* Dynamic Vector Space Visualization Grid */}
            <div className="relative h-48 rounded-xl border border-border bg-slate-100/50 dark:bg-black/30 overflow-hidden flex items-center justify-center">
              {/* Grid Lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:14px_24px]" />
              
              {/* Concentric rings */}
              <div className="absolute border border-brand-primary/5 rounded-full w-40 h-40 animate-pulse" />
              <div className="absolute border border-brand-primary/10 rounded-full w-28 h-28" />
              <div className="absolute border border-brand-primary/20 rounded-full w-16 h-16" />

              {/* Scanning sweep */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/0 via-brand-primary/5 to-brand-primary/0 origin-center animate-spin" style={{ animationDuration: '8s' }} />

              {/* Simulated Node clusters */}
              <div className="absolute top-10 left-16 w-3 h-3 rounded-full bg-risk-safe shadow-[0_0_10px_var(--color-risk-safe)]" />
              <div className="absolute top-28 left-12 w-2 h-2 rounded-full bg-risk-low opacity-60" />
              <div className="absolute top-20 right-20 w-3 h-3 rounded-full bg-risk-medium shadow-[0_0_10px_var(--color-risk-medium)]" />
              <div className="absolute bottom-12 right-14 w-4.5 h-4.5 rounded-full bg-risk-high shadow-[0_0_12px_var(--color-risk-high)] animate-ping" />
              <div className="absolute bottom-12 right-14 w-4.5 h-4.5 rounded-full bg-risk-high shadow-[0_0_12px_var(--color-risk-high)]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-brand-primary border-2 border-white shadow-[0_0_15px_var(--color-brand-primary)]" />
            </div>

            {/* Node Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-risk-high shrink-0" />
                <span>Malicious Cluster (1)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-risk-medium shrink-0" />
                <span>Suspected Spoof (1)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-risk-low shrink-0" />
                <span>Benign Nodes (2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary shrink-0" />
                <span>Primary Brand IP</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Recent Scans Status */}
      <motion.div 
        variants={cardVariants}
        className="glass-card p-6 rounded-2xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <Fingerprint className="w-5 h-5 text-brand-primary" />
          <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">
            Recent Scanning Operations
          </h3>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Scan Target</th>
                <th className="py-3 px-4">Scan Type</th>
                <th className="py-3 px-4">Assets Evaluated</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-slate-600 dark:text-slate-300 font-medium">
              <tr className="hover:bg-slate-100/30 dark:hover:bg-white/2 transition-colors">
                <td className="py-3 px-4 font-mono font-bold">*.privacyshield.ai</td>
                <td className="py-3 px-4 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-slate-400" /> Certificate Audit</td>
                <td className="py-3 px-4">124 Domains</td>
                <td className="py-3 px-4 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Jul 10, 20:30</td>
                <td className="py-3 px-4">
                  <RiskBadge level="safe" className="py-0.5 px-2 text-[10px]">Completed</RiskBadge>
                </td>
              </tr>
              <tr className="hover:bg-slate-100/30 dark:hover:bg-white/2 transition-colors">
                <td className="py-3 px-4 font-mono font-bold">Github Org Repos</td>
                <td className="py-3 px-4 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-slate-400" /> Secrets Scanner</td>
                <td className="py-3 px-4">42 Repositories</td>
                <td className="py-3 px-4 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Jul 10, 19:45</td>
                <td className="py-3 px-4">
                  <RiskBadge level="low" className="py-0.5 px-2 text-[10px]">Active</RiskBadge>
                </td>
              </tr>
              <tr className="hover:bg-slate-100/30 dark:hover:bg-white/2 transition-colors">
                <td className="py-3 px-4 font-mono font-bold">Brand Trademarks</td>
                <td className="py-3 px-4 flex items-center gap-1.5"><ScanEye className="w-3.5 h-3.5 text-slate-400" /> Logo Similarity</td>
                <td className="py-3 px-4">1,409 Images</td>
                <td className="py-3 px-4 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Jul 10, 18:12</td>
                <td className="py-3 px-4">
                  <RiskBadge level="high" className="py-0.5 px-2 text-[10px]">Alert Triggered</RiskBadge>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
