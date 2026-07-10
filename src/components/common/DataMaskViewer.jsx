import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function DataMaskViewer() {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0-100)

  const handleSliderChange = (e) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <div className="flex flex-col h-full glass-card border border-border rounded-2xl overflow-hidden text-text-main shadow-lg">

      {/* Header telemetry area */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-slate-100/40 dark:bg-black/10">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-risk-high" />
          <span className="text-xs font-semibold tracking-wider uppercase font-mono">
            PII Redaction Engine Simulation
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono font-medium text-slate-400">
          <span>Slider Split: {sliderPosition}%</span>
        </div>
      </div>

      {/* Main Interactive Slit Screen Frame Container */}
      <div className="relative flex-1 min-h-[300px] w-full bg-slate-50 dark:bg-black/40 font-mono select-none overflow-hidden">

        {/* ==========================================================================
           LEFT PANEL: Original Unprotected Data Matrix (Always Base Level)
           ========================================================================== */}
        <div className="absolute inset-0 p-6 flex flex-col justify-center space-y-4 text-xs sm:text-sm text-slate-800 dark:text-slate-300">
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-risk-high/10 border border-risk-high/30 text-risk-high text-[10px] font-bold tracking-widest uppercase">
            ORIGINAL UNPROTECTED PII
          </div>

          <div className="space-y-2 mt-4 bg-risk-high/5 p-4 rounded-xl border border-risk-high/10">
            <p><span className="text-slate-400 dark:text-slate-500 font-semibold">CLIENT_EMAIL:</span> <span className="bg-risk-high/10 text-risk-high px-1 rounded">admin@cloakai.ai</span></p>
            <p><span className="text-slate-400 dark:text-slate-500 font-semibold">CORE_NODE_IP:</span> <span className="bg-risk-high/10 text-risk-high px-1 rounded">192.168.1.105</span></p>
            <p><span className="text-slate-400 dark:text-slate-500 font-semibold">ACC_TOKEN_ID:</span> <span className="bg-risk-high/10 text-risk-high px-1 rounded">sk-live-7729x-4491b-9923z</span></p>
            <p><span className="text-slate-400 dark:text-slate-500 font-semibold">GOVT_ID_TEXT:</span> <span className="bg-risk-high/10 text-risk-high px-1 rounded">PAN: BKPPG1294M</span></p>
          </div>
        </div>

        {/* ==========================================================================
           RIGHT PANEL: Redacted Masked Layer (Width cropped dynamically via Clip-Path)
           ========================================================================== */}
        <div
          className="absolute inset-0 p-6 flex flex-col justify-center space-y-4 text-xs sm:text-sm bg-slate-100 dark:bg-[#0c0d14] text-slate-800 dark:text-slate-200 transition-colors duration-150"
          style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}
        >
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-risk-safe/10 border border-risk-safe/30 text-risk-safe text-[10px] font-bold tracking-widest uppercase">
            REDACTED SAFE ASSET
          </div>

          <div className="space-y-2 mt-4 bg-risk-safe/5 p-4 rounded-xl border border-risk-safe/10 backdrop-blur-sm">
            <p><span className="text-slate-400 dark:text-slate-500 font-semibold">CLIENT_EMAIL:</span> <span className="bg-risk-safe/10 text-risk-safe px-1 rounded font-bold">admin•••••@c•••••••••.ai</span></p>
            <p><span className="text-slate-400 dark:text-slate-500 font-semibold">CORE_NODE_IP:</span> <span className="bg-risk-safe/10 text-risk-safe px-1 rounded font-bold">192.168.•••.•••</span></p>
            <p><span className="text-slate-400 dark:text-slate-500 font-semibold">ACC_TOKEN_ID:</span> <span className="bg-risk-safe/10 text-risk-safe px-1 rounded font-bold">sk-live-•••••-•••••-•••••</span></p>
            <p><span className="text-slate-400 dark:text-slate-500 font-semibold">GOVT_ID_TEXT:</span> <span className="bg-risk-safe/10 text-risk-safe px-1 rounded font-bold">PAN: ••••••••••</span></p>
          </div>
        </div>

        {/* Vertical Divider Indicator Handle Line */}
        <div
          className="absolute inset-y-0 w-0.5 bg-brand-primary shadow-[0_0_10px_rgba(124,58,237,0.5)] pointer-events-none z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center text-white border border-white/20 shadow-lg scale-100 group-hover:scale-110 transition-transform">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 4 4 4m8-8l4 4-4 4" />
            </svg>
          </div>
        </div>

        {/* Draggable transparent input slider layer overlay */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
          aria-label="Data redaction percentage divider adjustment slider"
        />
      </div>

      {/* Footer descriptor status bar */}
      <div className="p-4 border-t border-border bg-slate-50/50 dark:bg-black/5 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-sans font-medium">
          Drag the slider handle across the center card area to evaluate real-time canvas obfuscation rules.
        </p>
      </div>
    </div>
  );
}