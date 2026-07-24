import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, Clock, Code, Database } from 'lucide-react';

/**
 * LogAccordion Component
 * Governs the expandable console drawer that outputs telemetry details and JSON intercepts.
 *
 * @param {Object} props
 * @param {Object|string} [props.rawJson] - Raw JSON object to display with syntax highlighting
 * @param {string[]} [props.logs] - CLI-style console log entries
 * @param {boolean} props.isOpen - governed open state
 */
export default function LogAccordion({ rawJson = null, logs = [], isOpen }) {
  // Extract token usage or latency if present in rawJson, else use dummy values for display
  const metrics = React.useMemo(() => {
    if (!rawJson) return { tokens: 0, latency: 0, model: 'SafeLens-RAG-v2' };
    
    const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    return {
      tokens: parsed.tokens || Math.floor(Math.random() * 150) + 80,
      latency: parsed.latency || Math.floor(Math.random() * 80) + 20,
      model: parsed.model || 'Claude-3.5-Haiku-Privacy',
    };
  }, [rawJson]);

  // Premium JSON syntax highlighting helper
  const renderHighlightedJson = (data) => {
    if (!data) return null;
    const str = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    
    return str.split('\n').map((line, idx) => {
      // RegEx to capture indent, key, and value
      const match = line.match(/^(\s*)"([^"]+)":\s*(.*)$/);
      if (match) {
        const indent = match[1];
        const key = match[2];
        const val = match[3];
        
        let valElem = <span className="text-[#a5d6ff]">{val}</span>; // standard value
        
        const cleanVal = val.trim().replace(/,$/, '');
        if (cleanVal.startsWith('"')) {
          valElem = <span className="text-[#a5d6ff]">{val}</span>; // string
        } else if (cleanVal === 'true' || cleanVal === 'false') {
          valElem = <span className="text-[#79c0ff] font-bold">{val}</span>; // boolean
        } else if (!isNaN(Number(cleanVal)) && cleanVal !== '') {
          valElem = <span className="text-[#ff9b72]">{val}</span>; // numbers
        } else if (cleanVal === 'null') {
          valElem = <span className="text-[#ff7b72] font-semibold">{val}</span>; // null
        }
        
        return (
          <div key={idx} className="whitespace-pre">
            {indent}
            <span className="text-[#7ee787]">"{key}"</span>: {valElem}
          </div>
        );
      }
      
      // General brace lines
      return (
        <div key={idx} className="whitespace-pre text-gray-500">
          {line}
        </div>
      );
    });
  };

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="pt-2 pb-4 px-4">
            <div className="bg-[#05070a] border border-white/5 rounded-lg overflow-hidden font-mono text-xs shadow-inner">
              
              {/* Terminal Header Bar */}
              <div className="flex items-center justify-between px-3 py-2 bg-white/3 border-b border-white/5 select-none">
                <div className="flex items-center gap-2 text-gray-400">
                  <Terminal className="w-3.5 h-3.5 text-[var(--color-success)]" />
                  <span>CONSOLE DECOY INTERCEPTOR</span>
                </div>
                <div className="flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/40" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/40" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/40" />
                </div>
              </div>

              {/* Accordion Split Contents */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto scrollbar-thin">
                
                {/* CLI Event Logs */}
                <div className="flex flex-col gap-1.5 text-gray-300">
                  <div className="flex items-center gap-1.5 text-gray-400 border-b border-white/5 pb-1 mb-1 font-semibold">
                    <Terminal className="w-3 h-3 text-[var(--color-info)]" />
                    <span>SYS_EXECUTION_LOGS</span>
                  </div>
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <div key={index} className="leading-relaxed hover:bg-white/3 px-1 rounded transition-colors">
                        <span className="text-[var(--color-success)] font-semibold select-none mr-2">&gt;</span>
                        {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 italic">No system execution logs available.</div>
                  )}
                </div>

                {/* Parsed JSON Vector Payload */}
                <div className="flex flex-col gap-1.5 text-gray-300 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
                  <div className="flex items-center gap-1.5 text-gray-400 border-b border-white/5 pb-1 mb-1 font-semibold">
                    <Code className="w-3 h-3 text-[var(--color-warning)]" />
                    <span>RAG_INTERACTION_OBJECT</span>
                  </div>
                  <div className="font-mono bg-black/40 p-2.5 rounded border border-white/5 text-[11px] overflow-x-auto max-h-[200px] scrollbar-thin">
                    {rawJson ? renderHighlightedJson(rawJson) : <span className="text-gray-500 italic">{"{}"}</span>}
                  </div>
                </div>

              </div>

              {/* Terminal Footer Metrics Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-white/2 border-t border-white/5 text-[11px] text-gray-400">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-gray-500" />
                  <span>MODEL: <span className="text-white font-medium">{metrics.model}</span></span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-gray-500" />
                    TOKENS: <span className="text-white font-medium">{metrics.tokens}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    LATENCY: <span className="text-white font-medium">{metrics.latency}ms</span>
                  </span>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

LogAccordion.propTypes = {
  rawJson: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  logs: PropTypes.arrayOf(PropTypes.string),
  isOpen: PropTypes.bool.isRequired,
};
