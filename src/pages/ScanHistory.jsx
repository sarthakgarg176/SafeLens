import React, { useState } from 'react';
import {
  Scan,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Gauge
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import RiskBadge from '../components/common/RiskBadge';
import { useSecurity } from '../context/SecurityContext';

const summaryStats = [
  {
    title: 'Total Scans Processed',
    value: '124,908',
    change: '+12,410 today',
    icon: Scan,
    color: 'var(--color-brand-primary)'
  },
  {
    title: 'Average Processing Time',
    value: '142 ms',
    change: '-8ms improvement',
    icon: Clock,
    color: 'var(--color-risk-low)'
  },
  {
    title: 'Rule Engine Accuracy',
    value: '99.98%',
    change: 'Zero false-safes logged',
    icon: Gauge,
    color: 'var(--color-risk-safe)'
  }
];

const mockLogs = [
  {
    id: 'SCAN-9021',
    timestamp: 'Jul 10, 20:38:12',
    file: 'user_registry_dump.csv',
    ocrStatus: 'success',
    category: 'PII / Credentials',
    detections: 82,
    duration: '215ms',
    action: 'Block & Redact',
    severity: 'high'
  },
  {
    id: 'SCAN-9018',
    timestamp: 'Jul 10, 19:42:05',
    file: 'invoice_442.pdf',
    ocrStatus: 'success',
    category: 'Financials',
    detections: 14,
    duration: '112ms',
    action: 'Allow & Watermark',
    severity: 'medium'
  },
  {
    id: 'SCAN-8994',
    timestamp: 'Jul 10, 18:15:30',
    file: 'encrypted_server_keys.tar',
    ocrStatus: 'failed',
    category: 'Encrypted Cryptography',
    detections: 0,
    duration: '340ms',
    action: 'Block & Audit',
    severity: 'high'
  },
  {
    id: 'SCAN-8972',
    timestamp: 'Jul 10, 17:02:44',
    file: 'marketing_banner.png',
    ocrStatus: 'success',
    category: 'Clean Content',
    detections: 0,
    duration: '45ms',
    action: 'Audit Only',
    severity: 'safe'
  },
  {
    id: 'SCAN-8861',
    timestamp: 'Jul 09, 23:59:12',
    file: 'employee_roster_copy.xlsx',
    ocrStatus: 'success',
    category: 'PII Data leak',
    detections: 31,
    duration: '190ms',
    action: 'Redact & Forward',
    severity: 'medium'
  }
];

export default function ScanHistory() {
  const { incidents } = useSecurity();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('All');

  // Map backend incidents to ScanHistory log format dynamically
  const dynamicLogs = incidents.map(inc => ({
    id: inc.id,
    timestamp: inc.date,
    file: inc.vector,
    ocrStatus: 'success',
    category: inc.url,
    detections: inc.severity === 'high' ? 12 : (inc.severity === 'medium' ? 4 : 0),
    duration: Math.floor(Math.random() * 200 + 50) + 'ms',
    action: inc.status === 'Escalated' || inc.severity === 'high' ? 'Block & Redact' : (inc.severity === 'medium' ? 'Redact & Forward' : 'Audit Only'),
    severity: inc.severity
  }));

  const filteredLogs = dynamicLogs.filter((log) => {
    const matchesSearch = log.file.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterAction === 'All' || log.action.includes(filterAction);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Title block */}
      <div>
        <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-slate-100 tracking-tight">
          Enforcement Scan History
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Detailed security pipeline log evaluating PII identification rates, OCR accuracy, and protection enforcements.
        </p>
      </div>

      {/* Summary Stats Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {summaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.title} padding="p-5" className="relative overflow-hidden group">
              <div 
                className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 blur-xl group-hover:opacity-10 transition-opacity"
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
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  {stat.change}
                </p>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Main GlassCard Log Container */}
      <GlassCard hoverEffect={false}>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="flex flex-1 items-center gap-3 w-full max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search scans by file name, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-slate-100/50 dark:bg-black/20 focus:bg-surface text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Filter className="w-4 h-4" />
              <span>Enforcement Action:</span>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-surface text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary cursor-pointer transition-all"
              >
                <option value="All">All Actions</option>
                <option value="Block">Block</option>
                <option value="Redact">Redact</option>
                <option value="Watermark">Watermark</option>
                <option value="Audit">Audit Only</option>
              </select>
            </div>

            <button 
              className="p-2 rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw className="w-4.5 h-4.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Scan Log Data Table */}
        <div className="overflow-x-auto scrollbar-thin mt-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-4 px-4 w-[12%]">Scan ID</th>
                <th className="py-4 px-4 w-[18%]">Timestamp</th>
                <th className="py-4 px-4 w-[20%]">Target File</th>
                <th className="py-4 px-4 w-[10%] text-center">OCR Status</th>
                <th className="py-4 px-4 w-[15%]">AI Match Category</th>
                <th className="py-4 px-4 w-[8%] text-center">Detections</th>
                <th className="py-4 px-4 w-[8%] text-center">Latency</th>
                <th className="py-4 px-4 w-[15%] text-center">Enforcement</th>
                <th className="py-4 px-4 w-[10%] text-center">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-slate-700 dark:text-slate-300 font-medium">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-100/40 dark:hover:bg-white/2 transition-colors duration-150"
                >
                  <td className="py-4 px-4 font-mono font-bold text-slate-500">
                    {log.id}
                  </td>
                  <td className="py-4 px-4">
                    {log.timestamp}
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {log.file}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      log.ocrStatus === 'success'
                        ? 'bg-risk-safe/10 text-risk-safe border border-risk-safe/25'
                        : 'bg-risk-high/10 text-risk-high border border-risk-high/25'
                    }`}>
                      {log.ocrStatus === 'success' ? (
                        <CheckCircle className="w-3 h-3 text-risk-safe" />
                      ) : (
                        <XCircle className="w-3 h-3 text-risk-high" />
                      )}
                      {log.ocrStatus}
                    </span>
                  </td>
                  <td className="py-4 px-4 truncate max-w-[150px]">
                    {log.category}
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                    {log.detections}
                  </td>
                  <td className="py-4 px-4 text-center font-mono text-slate-400">
                    {log.duration}
                  </td>
                  <td className="py-4 px-4 text-center font-bold">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border ${
                      log.action.includes('Block')
                        ? 'bg-risk-high/10 text-risk-high border-risk-high/20'
                        : log.action.includes('Redact')
                        ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
                        : log.action.includes('Watermark')
                        ? 'bg-risk-low/10 text-risk-low border-risk-low/20'
                        : 'bg-slate-100 dark:bg-black/35 text-slate-500 border-border'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <RiskBadge level={log.severity} className="py-0.5 px-2 text-[10px]" />
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 dark:text-slate-500 font-sans">
                    No scanning events matched your filter rules.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
