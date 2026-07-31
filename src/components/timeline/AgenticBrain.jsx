import React, { useState, useEffect, useCallback } from 'react';
import { Play, RefreshCw, Cpu, Activity, Clock, ShieldAlert, Sparkles, Server } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import StepCard from './StepCard';
import StatusBadge from './StatusBadge';

// Mock telemetry simulations
const SIMULATIONS = {
  decoy: {
    name: 'Decoy Intervention',
    status: 'success',
    badgeLabel: 'DECOY DEPLOYED',
    totalLatency: '240ms',
    steps: [
      {
        stepNumber: 1,
        title: 'HTTP Request Intercepted',
        timestamp: '11:03:01.050',
        status: 'success',
        logs: [
          'INFO: Hooked window.fetch outbound buffers successfully.',
          'DEBUG: Captured JSON payload destined for https://api.external-ai.com/v1/chat/completions.',
          'INFO: Intercept buffering active. Transferring payload payload_data.bin to risk analyzer.'
        ],
        rawJson: {
          source: 'safelens-chrome-extension',
          destination: 'https://api.external-ai.com/v1/chat',
          payload_size_kb: 14.2,
          intercept_latency_ms: 12
        }
      },
      {
        stepNumber: 2,
        title: 'OCR & Structural Layout Parser',
        timestamp: '11:03:01.120',
        status: 'success',
        logs: [
          'INFO: Running document boundary extraction on upload buffers.',
          'DEBUG: Detected embedded Base64 image attachment.',
          'SUCCESS: Local Tesseract OCR process complete. Parsed 2 critical credentials blocks.'
        ],
        rawJson: {
          segments_parsed: 8,
          ocr_engine: 'tesseract-wasm-v5',
          extracted_keys: ['admin_password_raw', 'jwt_secret_token']
        }
      },
      {
        stepNumber: 3,
        title: 'RAG policy vector Database Query',
        timestamp: '11:03:01.190',
        status: 'success',
        logs: [
          'INFO: Generating embeddings using local micro-transformer model.',
          'DEBUG: Querying local vector storage. Dimensions = 1536.',
          'SUCCESS: Found similarity match above threshold (Cosine: 0.924) with Policy ID RL-801-SEC.'
        ],
        rawJson: {
          query_vectors_dimensions: 1536,
          similarity_matched: 0.924,
          policy_matched_id: 'RL-801-SEC',
          policy_name: 'Confidential Key Leakage Prevention'
        }
      },
      {
        stepNumber: 4,
        title: 'Security Risk & Intent Evaluator',
        timestamp: '11:03:01.215',
        status: 'warning',
        logs: [
          'INFO: Evaluating context risk markers.',
          'WARNING: Intent assessment flags potential outbound corporate secret leak.',
          'INFO: Risk level escalated to Critical. Action policy triggered: INJECT_DECOY.'
        ],
        rawJson: {
          risk_score: 0.94,
          risk_category: 'CREDENTIAL_EXPOSURE',
          intent: 'OUTBOUND_DATA_LEAK',
          escalation_required: true
        }
      },
      {
        stepNumber: 5,
        title: 'Synthetic Decoy Generation & Replacement',
        timestamp: '11:03:01.260',
        status: 'success',
        logs: [
          'INFO: Synthesizing decoy keys based on RL-801-SEC pattern guidelines.',
          'DEBUG: Replacing true secrets in payload buffer with fake high-entropy values.',
          'SUCCESS: Output payload updated. Masked confidential segments.'
        ],
        rawJson: {
          decoy_version: 'v2.0-entropy',
          injected_decoy_fields: ['admin_password_raw', 'jwt_secret_token'],
          sanitized_hash: '8f3e5b12a9cd...'
        }
      },
      {
        stepNumber: 6,
        title: 'Decoy Response Sent',
        timestamp: '11:03:01.290',
        status: 'success',
        logs: [
          'SUCCESS: Outbound request dispatched successfully with sanitized decoy buffers.',
          'INFO: Intercept cycle resolved. SafeLens 2.0 Command Center stats updated.'
        ],
        rawJson: {
          http_status: 200,
          total_pipeline_time_ms: 240,
          takedown_triggered: true
        }
      }
    ]
  },
  whitelist: {
    name: 'Whitelisted Bypass',
    status: 'warning',
    badgeLabel: 'DOMAIN BYPASSED',
    totalLatency: '45ms',
    steps: [
      {
        stepNumber: 1,
        title: 'HTTP Request Intercepted',
        timestamp: '11:05:42.100',
        status: 'success',
        logs: [
          'INFO: Hooked window.fetch outbound buffers successfully.',
          'DEBUG: Captured JSON payload destined for https://authorized.internal-domain.com/v1/save.'
        ],
        rawJson: {
          source: 'safelens-chrome-extension',
          destination: 'https://authorized.internal-domain.com/v1/save',
          payload_size_kb: 4.8
        }
      },
      {
        stepNumber: 2,
        title: 'Domain Authorization Check',
        timestamp: '11:05:42.115',
        status: 'warning',
        logs: [
          'INFO: Scanning domain list database.',
          'WARNING: Domain authorized.internal-domain.com matches Whitelist rule WL-CORPORATE-CORE.',
          'INFO: Command executor skipping content parsers.'
        ],
        rawJson: {
          whitelisted_rule: 'WL-CORPORATE-CORE',
          match_category: 'INTERNAL_DEVELOPMENT',
          skip_analysis: true
        }
      },
      {
        stepNumber: 3,
        title: 'Bypass Action Finalized',
        timestamp: '11:05:42.145',
        status: 'warning',
        logs: [
          'SUCCESS: Outbound request passed without modification.',
          'INFO: Telemetry logged under Category: Whitelisted Bypass.'
        ],
        rawJson: {
          bypass_reason: 'INTERNAL_TRUSTED_DOMAIN',
          total_pipeline_time_ms: 45
        }
      }
    ]
  },
  failure: {
    name: 'Spoofing / System Alert',
    status: 'failed',
    badgeLabel: 'INTERCEPT FAIL',
    totalLatency: '110ms',
    steps: [
      {
        stepNumber: 1,
        title: 'HTTP Request Intercepted',
        timestamp: '11:08:15.300',
        status: 'success',
        logs: [
          'INFO: Hooked window.fetch outbound buffers successfully.',
          'DEBUG: Captured file upload buffers for suspicious_packet.exe.'
        ],
        rawJson: {
          source: 'safelens-chrome-extension',
          file_name: 'suspicious_packet.exe',
          payload_size_kb: 412.0
        }
      },
      {
        stepNumber: 2,
        title: 'Decoy Injection & Parse Attempt',
        timestamp: '11:08:15.340',
        status: 'success',
        logs: [
          'INFO: Initiating binary stream parser.',
          'DEBUG: Scanning PE headers and signature blocks.'
        ],
        rawJson: {
          is_binary: true,
          mime_type: 'application/octet-stream'
        }
      },
      {
        stepNumber: 3,
        title: 'Decoy Insertion Failure',
        timestamp: '11:08:15.410',
        status: 'failed',
        logs: [
          'ERROR: Failed to parse binary stream. Struct padding mismatch.',
          'CRITICAL: Spoofing hazard detected! Outbound packet contains self-signing credentials hash.',
          'CRITICAL: Unable to replace target token. Threat block rule matching.'
        ],
        rawJson: {
          error: 'BUFFER_MUTATION_FAILED',
          vulnerability_code: 'CVE-SPOOF-HAZARD',
          severity: 'HIGH_INTENSITY'
        }
      }
    ]
  }
};

export default function AgenticBrain() {
  const [selectedSim, setSelectedSim] = useState('decoy');
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [engineStatus, setEngineStatus] = useState('ACTIVE');

  // Trigger live-telemetry streaming simulation
  const runSimulation = useCallback((simKey) => {
    if (isStreaming) return;
    
    setIsStreaming(true);
    setVisibleSteps([]);
    setEngineStatus('PROCESSING');
    
    const targetSteps = SIMULATIONS[simKey].steps;
    
    // Staggered addition of steps to build timeline progressively
    targetSteps.forEach((step, idx) => {
      setTimeout(() => {
        setVisibleSteps((prev) => [...prev, step]);
        
        // Final step check
        if (idx === targetSteps.length - 1) {
          setIsStreaming(false);
          setEngineStatus('MONITORING');
        }
      }, (idx + 1) * 450);
    });
  }, [isStreaming]);

  // Initial trigger on mount
  useEffect(() => {
    runSimulation('decoy');
    
    // Cleanup on unmount
    return () => {
      setIsStreaming(false);
    };
  }, []);

  const handleSimChange = (simKey) => {
    if (isStreaming) return;
    setSelectedSim(simKey);
    runSimulation(simKey);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-6">
      
      {/* Simulation Controls & Statistics Header */}
      <GlassCard className="p-5 border-white/10" scanLine={isStreaming}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          {/* Headline Status */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded bg-white/5 border border-white/10 transition-colors duration-300 ${isStreaming ? 'text-[var(--color-success)] glow-status-success' : 'text-gray-400'}`}>
              <Activity className={`w-5 h-5 ${isStreaming ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-widest text-gray-400 uppercase">
                  Agentic AI Privacy Engine
                </h2>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] pulse-glow-green" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2 mt-0.5">
                LIVE TELEMETRY STREAM
              </h1>
            </div>
          </div>

          {/* Configuration Selector */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-gray-500 font-mono hidden sm:inline">SIM_MODE:</span>
            <div className="flex bg-black/40 border border-white/5 p-1 rounded-md">
              {Object.keys(SIMULATIONS).map((key) => (
                <button
                  key={key}
                  onClick={() => handleSimChange(key)}
                  disabled={isStreaming}
                  className={`px-3 py-1.5 rounded text-xs font-semibold font-mono tracking-wider transition-all duration-200 ${
                    selectedSim === key
                      ? 'bg-white/10 text-white border border-white/10 shadow-sm'
                      : 'text-gray-500 hover:text-gray-300 disabled:opacity-50'
                  }`}
                >
                  {SIMULATIONS[key].name.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => runSimulation(selectedSim)}
              disabled={isStreaming}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold font-mono tracking-wider transition-all duration-200 bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/30 hover:bg-[var(--color-success)]/20 active:scale-95 disabled:opacity-50"
            >
              {isStreaming ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>RUN</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Tactical Info Dashboard Panels */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 border-t border-white/5 pt-5 relative z-10 font-mono">
          
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <Server className="w-3.5 h-3.5" /> Engine status
            </span>
            <span className={`text-xs md:text-sm font-bold tracking-wider ${isStreaming ? 'text-[var(--color-info)]' : 'text-[var(--color-success)]'}`}>
              {engineStatus}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Pipeline latency
            </span>
            <span className="text-xs md:text-sm font-bold text-white tracking-wider">
              {SIMULATIONS[selectedSim].totalLatency}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Active policies
            </span>
            <span className="text-xs md:text-sm font-bold text-white tracking-wider">
              8 Vector Rules
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Action Result
            </span>
            <div className="flex items-center mt-0.5">
              <StatusBadge status={SIMULATIONS[selectedSim].status} label={SIMULATIONS[selectedSim].badgeLabel} />
            </div>
          </div>

        </div>
      </GlassCard>

      {/* Timeline Stream */}
      <div className="flex flex-col w-full pl-2">
        {visibleSteps.length > 0 ? (
          visibleSteps.map((step, idx) => (
            <StepCard
              key={step.stepNumber}
              stepNumber={step.stepNumber}
              title={step.title}
              timestamp={step.timestamp}
              status={step.status}
              logs={step.logs}
              rawJson={step.rawJson}
              index={idx}
              isLast={idx === SIMULATIONS[selectedSim].steps.length - 1}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 font-mono border border-dashed border-white/5 rounded-lg">
            <Cpu className="w-8 h-8 mb-3 text-gray-600 animate-pulse" />
            <p className="text-xs tracking-wider">AWAITING SYSTEM BOOT TELEMETRY...</p>
          </div>
        )}
      </div>

    </div>
  );
}
