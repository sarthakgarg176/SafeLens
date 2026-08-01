import React, { useState } from 'react';
import { Terminal, Eye, Search, Filter, RefreshCw, X, HelpCircle } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import StatusBadge from '../timeline/StatusBadge';
import AgenticBrain from '../timeline/AgenticBrain';

const AUDIT_LOGS = [
  { id: 'log-1', time: '11:32:04', url: 'https://api.openai.com/v1/chat', filename: 'user_credentials_upload.json', type: 'JSON', size: '14.2 KB', action: 'Decoyed', status: 'success', latency: 240 },
  { id: 'log-2', time: '11:28:15', url: 'https://slack.com/services/upload', filename: 'deployment_key.pem', type: 'PEM', size: '3.4 KB', action: 'Decoyed', status: 'success', latency: 215 },
  { id: 'log-3', time: '11:15:42', url: 'https://github.com/uploads/key', filename: 'admin_oauth.json', type: 'JSON', size: '8.1 KB', action: 'Blocked', status: 'failed', latency: 110 },
  { id: 'log-4', time: '11:02:11', url: 'https://authorized.internal-domain.com/v1', filename: 'trusted_config.html', type: 'HTML', size: '25.6 KB', action: 'Allowed', status: 'warning', latency: 45 },
  { id: 'log-5', time: '10:58:30', url: 'https://huggingface.co/api/models', filename: 'huggingface_secret.txt', type: 'TXT', size: '1.2 KB', action: 'Decoyed', status: 'success', latency: 220 },
  { id: 'log-6', time: '10:45:19', url: 'https://api.external-ai.com/v1/embeddings', filename: 'vector_input.pdf', type: 'PDF', size: '1.8 MB', action: 'Decoyed', status: 'success', latency: 260 },
  { id: 'log-7', time: '10:12:05', url: 'https://slack.com/services/upload', filename: 'public_image.png', type: 'PNG', size: '412 KB', action: 'Allowed', status: 'warning', latency: 38 }
];

export default function InterceptionLogs() {
  const [logs, setLogs] = useState(AUDIT_LOGS);
  const [domainFilter, setDomainFilter] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedTraceLog, setSelectedTraceLog] = useState(null);

  // Filter processing
  const filteredLogs = logs.filter((log) => {
    const matchesDomain = log.url.toLowerCase().includes(domainFilter.toLowerCase()) || 
                          log.filename.toLowerCase().includes(domainFilter.toLowerCase());
    
    const matchesType = fileTypeFilter === 'ALL' || log.type === fileTypeFilter;
    
    let matchesAction = true;
    if (actionFilter !== 'ALL') {
      if (actionFilter === 'Decoyed') matchesAction = log.action === 'Decoyed';
      else if (actionFilter === 'Allowed') matchesAction = log.action === 'Allowed';
      else if (actionFilter === 'Blocked') matchesAction = log.action === 'Blocked';
    }

    return matchesDomain && matchesType && matchesAction;
  });

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-6 font-mono">
      
      {/* Filter and Control Dashboard */}
      <GlassCard className="p-5 border-white/10 select-none">
        
        {/* Header Title */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
          <Filter className="w-4 h-4 text-[var(--color-info)]" />
          <h3 className="font-bold text-sm tracking-wider uppercase text-white">
            Audit Filter Engine
          </h3>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* Domain Hostname Search */}
          <div className="flex flex-col gap-1.5">
            <span className="text-gray-500 font-semibold tracking-wider">FILTER BY URL OR FILE</span>
            <div className="relative">
              <input
                type="text"
                placeholder="Search domain/file..."
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 pl-8 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--color-info)] transition-all"
              />
              <Search className="w-4 h-4 text-gray-600 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* File Type Dropdown */}
          <div className="flex flex-col gap-1.5">
            <span className="text-gray-500 font-semibold tracking-wider">FILE EXTENSION TYPE</span>
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-info)] transition-all cursor-pointer"
            >
              <option value="ALL">ALL TYPES</option>
              <option value="JSON">JSON</option>
              <option value="PEM">PEM / KEYS</option>
              <option value="HTML">HTML</option>
              <option value="PDF">PDF</option>
              <option value="PNG">PNG / IMAGE</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-gray-500 font-semibold tracking-wider">RESOLUTION ACTION</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-[var(--color-info)] transition-all cursor-pointer"
            >
              <option value="ALL">ALL ACTIONS</option>
              <option value="Decoyed">DECOY REPLACED</option>
              <option value="Allowed">ALLOWED / BYPASSED</option>
              <option value="Blocked">BLOCKED / REFUSED</option>
            </select>
          </div>

        </div>

      </GlassCard>

      {/* Logs Table */}
      <GlassCard className="p-5 border-white/10">
        
        {/* Table Title Row */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 select-none">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[var(--color-success)]" />
            <h3 className="font-bold text-sm tracking-wider uppercase text-white">
              Data Interception Audit Database
            </h3>
          </div>
          <span className="text-[10px] text-gray-500 flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 text-[var(--color-success)]" /> MATCHES: {filteredLogs.length} EVENTS
          </span>
        </div>

        {/* Table element */}
        <div className="w-full overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse text-xs min-w-[850px]">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 select-none pb-2">
                <th className="py-2.5 font-medium">Timestamp</th>
                <th className="py-2.5 font-medium">Target URL Endpoint</th>
                <th className="py-2.5 font-medium">Filename (Payload)</th>
                <th className="py-2.5 font-medium">Format</th>
                <th className="py-2.5 font-medium">Resolution</th>
                <th className="py-2.5 font-medium">Latency</th>
                <th className="py-2.5 font-medium text-right">Execution Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/2 transition-colors duration-150">
                    
                    {/* Timestamp */}
                    <td className="py-3 text-gray-500">{log.time}</td>

                    {/* URL */}
                    <td className="py-3 font-semibold text-white max-w-[220px] truncate" title={log.url}>
                      {log.url}
                    </td>

                    {/* Filename */}
                    <td className="py-3 max-w-[200px] truncate" title={log.filename}>
                      {log.filename} <span className="text-[10px] text-gray-500">({log.size})</span>
                    </td>

                    {/* Format */}
                    <td className="py-3">
                      <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 font-bold text-[10px] text-gray-400">
                        {log.type}
                      </span>
                    </td>

                    {/* Resolution */}
                    <td className="py-3">
                      <span className={`font-bold text-[10px] uppercase ${
                        log.status === 'success' ? 'text-[var(--color-success)]' : log.status === 'warning' ? 'text-[var(--color-warning)]' : 'text-[var(--color-danger)]'
                      }`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Latency */}
                    <td className="py-3 text-gray-400">{log.latency}ms</td>

                    {/* Trace Inspection Trigger */}
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedTraceLog(log)}
                        type="button"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded font-semibold text-[10px] hover:text-white transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> INSPECT
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-gray-500 italic">
                    No interception events matched selection criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </GlassCard>

      {/* ── AGENTIC BRAIN OVERLAY MODAL ───────────────────────────────────────── */}
      {selectedTraceLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-filter backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0d14]/90 border border-white/15 rounded-xl shadow-2xl relative p-6">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedTraceLog(null)}
              type="button"
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all active:scale-90"
              aria-label="Close trace inspector"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Trace Header */}
            <div className="flex flex-col gap-1.5 border-b border-white/5 pb-4 mb-6">
              <span className="text-[10px] text-[var(--color-success)] tracking-widest font-bold uppercase flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> SYSTEM EVENT TRACE
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Trace ID: {selectedTraceLog.id.toUpperCase()} ({selectedTraceLog.filename})
              </h2>
              <p className="text-xs text-gray-500 font-mono">
                Source Endpoint: <span className="text-gray-300">{selectedTraceLog.url}</span>
              </p>
            </div>

            {/* Scoped AgenticBrain Visualizer */}
            <div className="w-full">
              <AgenticBrain />
            </div>

            {/* Modal Actions Footer */}
            <div className="flex justify-end gap-3 mt-6 border-t border-white/5 pt-4">
              <button
                onClick={() => setSelectedTraceLog(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs font-bold text-white transition-all active:scale-95"
              >
                CLOSE INSPECTOR
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
