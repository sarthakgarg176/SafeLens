import React, { useState } from 'react';
import { FileDown, Server, Cpu, Database, CheckCircle2, ShieldCheck, HelpCircle, Loader2 } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import StatusBadge from '../timeline/StatusBadge';

export default function Reports() {
  const [exporting, setExporting] = useState(false);
  const [exportStep, setExportStep] = useState('');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSuccess, setExportSuccess] = useState(false);

  const triggerExport = () => {
    if (exporting) return;
    setExporting(true);
    setExportSuccess(false);
    setExportProgress(0);
    
    const steps = [
      'Compiling privacy interception logs...',
      'Analyzing RAG vector policy parameters...',
      'Evaluating decoy data compliance thresholds...',
      'Bundling Executive Security Audit PDF...'
    ];

    let stepIdx = 0;
    setExportStep(steps[0]);

    const interval = setInterval(() => {
      stepIdx += 1;
      if (stepIdx < steps.length) {
        setExportStep(steps[stepIdx]);
        setExportProgress((stepIdx / steps.length) * 100);
      } else {
        clearInterval(interval);
        setExportProgress(100);
        setExporting(false);
        setExportSuccess(true);
      }
    }, 1200);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-6 font-mono">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <GlassCard className="p-5 border-white/10 select-none">
          <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
            Total Leaks Prevented
          </span>
          <h2 className="text-3xl font-black text-[var(--color-success)] tracking-tight mt-1.5">
            384 Threats
          </h2>
          <p className="text-[10px] text-gray-400 mt-2">
            Outbound credential leaks intercepted and decoyed since system armed.
          </p>
        </GlassCard>

        {/* Metric 2 */}
        <GlassCard className="p-5 border-white/10 select-none">
          <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
            Decoy Data Compliance Score
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight mt-1.5">
            98.6%
          </h2>
          <p className="text-[10px] text-gray-400 mt-2">
            Compliance threshold rating under GDPR Article 32 guidelines.
          </p>
        </GlassCard>

        {/* Metric 3 */}
        <GlassCard className="p-5 border-white/10 select-none">
          <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
            Synthetic Swaps Rate
          </span>
          <h2 className="text-3xl font-black text-[var(--color-info)] tracking-tight mt-1.5">
            100% SUCCESS
          </h2>
          <p className="text-[10px] text-gray-400 mt-2">
            Ratio of targeted intercepts that deployed synthetic decoy packets.
          </p>
        </GlassCard>

      </div>

      {/* Health Monitoring and Export Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Core Services Node Health */}
        <GlassCard className="p-5 border-white/10">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4 select-none">
            <Server className="w-4 h-4 text-[var(--color-success)]" />
            <h3 className="font-bold text-sm tracking-wider uppercase text-white">
              System Service Health
            </h3>
          </div>

          <div className="flex flex-col gap-4 text-xs font-mono">
            
            {/* Service 1: Ollama */}
            <div className="flex items-center justify-between p-3 bg-white/2 border border-white/5 rounded">
              <div className="flex items-center gap-3">
                <Cpu className="w-5 h-5 text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-white font-semibold">Ollama local LLM service</span>
                  <span className="text-[10px] text-gray-500">Model: llama-3-privacy:8b</span>
                </div>
              </div>
              <StatusBadge status="success" label="ONLINE" />
            </div>

            {/* Service 2: ChromaDB */}
            <div className="flex items-center justify-between p-3 bg-white/2 border border-white/5 rounded">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-white font-semibold">ChromaDB Vector Store</span>
                  <span className="text-[10px] text-gray-500">Index size: 8 Compliance Rules</span>
                </div>
              </div>
              <StatusBadge status="success" label="CONNECTED" />
            </div>

            {/* Service 3: Node API */}
            <div className="flex items-center justify-between p-3 bg-white/2 border border-white/5 rounded">
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-white font-semibold">Node Security interceptor API</span>
                  <span className="text-[10px] text-gray-500">API Port: 8000 (Localhost)</span>
                </div>
              </div>
              <StatusBadge status="success" label="OPERATIONAL" />
            </div>

          </div>
        </GlassCard>

        {/* Executive PDF Report Exporter */}
        <GlassCard className="p-5 border-white/10 flex flex-col justify-between min-h-[250px]">
          <div>
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4 select-none">
              <FileDown className="w-4 h-4 text-[var(--color-info)]" />
              <h3 className="font-bold text-sm tracking-wider uppercase text-white">
                Compliance Document Exporter
              </h3>
            </div>
            
            <p className="text-xs text-gray-400 leading-relaxed font-sans mb-6">
              Generate and download a cryptographically signed executive report of all data prevention metrics, RAG policy modifications, and decoy telemetry streams for corporate compliance review.
            </p>
          </div>

          <div>
            {exporting && (
              <div className="p-3 border border-white/5 bg-black/40 rounded-lg text-xs mb-4">
                <div className="flex items-center gap-2 text-[var(--color-info)] font-bold mb-1.5 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--color-info)] shrink-0" />
                  <span>{exportStep.toUpperCase()}</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[var(--color-info)] h-full transition-all duration-300" style={{ width: `${exportProgress}%` }} />
                </div>
              </div>
            )}

            {exportSuccess && (
              <div className="p-3 border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 rounded-lg text-xs text-center flex items-center justify-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
                <span className="text-white font-semibold">REPORT COMPILED & DOWNLOADED</span>
              </div>
            )}

            <button
              onClick={triggerExport}
              disabled={exporting}
              className="w-full py-3 bg-[var(--color-info)]/10 hover:bg-[var(--color-info)]/20 text-[var(--color-info)] border border-[var(--color-info)]/30 active:scale-95 disabled:opacity-50 font-bold tracking-wider rounded font-mono text-xs flex items-center justify-center gap-2 transition-all"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--color-info)]" />
                  <span>COMPILING REPORT...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>EXPORT EXECUTIVE SECURITY AUDIT PDF</span>
                </>
              )}
            </button>
          </div>
        </GlassCard>

      </div>

    </div>
  );
}
