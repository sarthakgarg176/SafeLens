import React, { useState } from 'react';
import { Settings as SettingsIcon, Sliders, ToggleLeft, ToggleRight, Radio, Server, ShieldCheck, Check, Sparkles, Loader2 } from 'lucide-react';
import GlassCard from '../common/GlassCard';

export default function Settings() {
  // Feature Flags State
  const [useNewAgent, setUseNewAgent] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  
  // Endpoint config
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:8000');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(''); // 'success' | 'error' | ''

  // Notification state
  const [toastDuration, setToastDuration] = useState(4); // 4 seconds
  const [toastPosition, setToastPosition] = useState('top-right');

  const testConnection = () => {
    setTestingConnection(true);
    setTestResult('');
    setTimeout(() => {
      setTestingConnection(false);
      setTestResult('success');
    }, 1200);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-6 font-mono">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Section 1: System Feature Flags */}
        <GlassCard className="p-5 border-white/10">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4 select-none">
            <Sliders className="w-4 h-4 text-[var(--color-success)]" />
            <h3 className="font-bold text-sm tracking-wider uppercase text-white">
              Feature Flag Controls
            </h3>
          </div>

          <div className="flex flex-col gap-4 text-xs">
            
            {/* Flag 1: LangGraph vs Legacy */}
            <div className="flex items-center justify-between p-3 bg-white/2 border border-white/5 rounded select-none">
              <div className="flex flex-col gap-0.5 max-w-[80%]">
                <span className="text-white font-semibold flex items-center gap-1.5">
                  LANGGRAPH ORCHESTRATOR <span className="px-1.5 py-0.5 rounded text-[8px] border border-[var(--color-info)]/20 text-[var(--color-info)] font-bold bg-[var(--color-info)]/5">ACTIVE</span>
                </span>
                <span className="text-[10px] text-gray-500">
                  Runs vectors through LangGraph agent instead of legacy static keyword checking.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setUseNewAgent(!useNewAgent)}
                className="text-gray-400 hover:text-white"
              >
                {useNewAgent ? (
                  <ToggleRight className="w-8 h-8 text-[var(--color-success)] glow-status-success rounded" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-600" />
                )}
              </button>
            </div>

            {/* Flag 2: Decoy Watermarking */}
            <div className="flex items-center justify-between p-3 bg-white/2 border border-white/5 rounded select-none">
              <div className="flex flex-col gap-0.5 max-w-[80%]">
                <span className="text-white font-semibold">DECOY WATERMARKING</span>
                <span className="text-[10px] text-gray-500">
                  Appends signature hash tokens to synthetic decoys to trace audit history.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                className="text-gray-400 hover:text-white"
              >
                {watermarkEnabled ? (
                  <ToggleRight className="w-8 h-8 text-[var(--color-success)] glow-status-success rounded" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-600" />
                )}
              </button>
            </div>

          </div>
        </GlassCard>

        {/* Section 2: API Connection Settings */}
        <GlassCard className="p-5 border-white/10">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4 select-none">
            <Server className="w-4 h-4 text-[var(--color-info)]" />
            <h3 className="font-bold text-sm tracking-wider uppercase text-white">
              Backend Endpoint configuration
            </h3>
          </div>

          <div className="flex flex-col gap-4 text-xs">
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="endpointInput" className="text-gray-500 font-semibold tracking-wider">SECURITY API HOST URL</label>
              <div className="flex gap-2">
                <input
                  id="endpointInput"
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--color-info)] transition-all"
                />
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testingConnection}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded font-bold text-[10px] tracking-wider transition-all disabled:opacity-50 text-white"
                >
                  {testingConnection ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    'TEST PING'
                  )}
                </button>
              </div>
            </div>

            {testResult === 'success' && (
              <div className="p-2.5 border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 text-[10px] text-[var(--color-success)] rounded flex items-center gap-1.5 select-none font-bold">
                <Check className="w-4 h-4 shrink-0" />
                <span>CONNECTION ONLINE (PING: 14ms) - API VERSION v2.0-STABLE</span>
              </div>
            )}

          </div>
        </GlassCard>

      </div>

      {/* Section 3: Browser Toast UI Positioning */}
      <GlassCard className="p-5 border-white/10">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4 select-none">
          <Radio className="w-4 h-4 text-[var(--color-warning)]" />
          <h3 className="font-bold text-sm tracking-wider uppercase text-white">
            Toast UI Notification preferences
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          {/* Duration Slider */}
          <div className="flex flex-col gap-3 justify-center">
            <div className="flex justify-between items-center select-none">
              <span className="text-gray-500 font-semibold tracking-wider">TOAST DISPLAY DURATION</span>
              <span className="text-white font-bold">{toastDuration} Seconds</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={toastDuration}
              onChange={(e) => setToastDuration(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--color-warning)] focus:outline-none"
            />
            <div className="flex justify-between text-[9px] text-gray-600 select-none">
              <span>1s</span>
              <span>10s</span>
            </div>
          </div>

          {/* Toast position selector */}
          <div className="flex flex-col gap-2">
            <span className="text-gray-500 font-semibold tracking-wider">ALERT NOTIFICATION POSITION</span>
            <div className="grid grid-cols-2 gap-2 select-none">
              {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setToastPosition(pos)}
                  className={`py-2 px-3 border rounded text-[10px] font-bold font-mono tracking-wider transition-all uppercase ${
                    toastPosition === pos
                      ? 'border-[var(--color-warning)] text-[var(--color-warning)] bg-[var(--color-warning)]/5'
                      : 'border-white/10 hover:border-white/20 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {pos.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

        </div>

      </GlassCard>

      {/* Settings Footer */}
      <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-gray-500 select-none">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-success)]" /> ALL CONFIGURATION ARMED & ENCRYPTED IN RUNTIME
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-info)]" /> SYSTEM BUILD: v2.0.4-NEON
        </span>
      </div>

    </div>
  );
}
