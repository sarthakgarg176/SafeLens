import React from 'react';
import PropTypes from 'prop-types';
import { ShieldCheck, ToggleLeft, ToggleRight, Trash2, Calendar, Database, Layers } from 'lucide-react';
import GlassCard from '../common/GlassCard';

/**
 * ActivePolicies Component
 * Displays a list of vector compliance models currently loaded in ChromaDB.
 * Provides on-the-fly toggling (enabled/disabled) and deletion options.
 *
 * @param {Object} props
 * @param {Array} props.policies - Array of compliance policy objects
 * @param {Function} props.onToggle - Handler function to toggle a policy
 * @param {Function} props.onDelete - Handler function to delete a policy
 */
export default function ActivePolicies({ policies = [], onToggle, onDelete }) {
  
  // Custom tag styling based on compliance category
  const getCategoryStyles = (category) => {
    const cleanCat = category.toUpperCase();
    if (cleanCat.includes('GDPR') || cleanCat.includes('PII')) {
      return 'border-[var(--color-danger)]/30 text-[var(--color-danger)] bg-[var(--color-danger)]/5';
    }
    if (cleanCat.includes('FINAN') || cleanCat.includes('SEC')) {
      return 'border-[var(--color-warning)]/30 text-[var(--color-warning)] bg-[var(--color-warning)]/5';
    }
    return 'border-[var(--color-info)]/30 text-[var(--color-info)] bg-[var(--color-info)]/5';
  };

  return (
    <GlassCard className="p-5 border-white/10 w-full">
      
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 select-none">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[var(--color-success)]" />
          <h3 className="font-bold text-sm tracking-wider font-mono text-white uppercase">
            Active Vector Policies
          </h3>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">
          CHROMADB ENGINE
        </span>
      </div>

      {/* Policies List */}
      <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
        {policies.length > 0 ? (
          policies.map((policy) => (
            <div
              key={policy.id}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                policy.enabled
                  ? 'border-white/10 bg-white/2 hover:border-white/20'
                  : 'border-white/5 bg-black/40 opacity-60'
              }`}
            >
              
              {/* Row 1: Title & Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h4 className={`text-xs md:text-sm font-semibold tracking-wide transition-colors ${policy.enabled ? 'text-white' : 'text-gray-500 line-through'}`}>
                    {policy.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getCategoryStyles(policy.category)}`}>
                      {policy.category}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                      <Layers className="w-3 h-3" /> {policy.chunks} Chunks
                    </span>
                  </div>
                </div>

                {/* Actions Button Stack */}
                <div className="flex items-center gap-2 shrink-0">
                  
                  {/* Enable / Disable Toggle Switch */}
                  <button
                    onClick={() => onToggle(policy.id)}
                    type="button"
                    className="p-1 rounded hover:bg-white/5 transition-all text-gray-400 hover:text-white"
                    title={policy.enabled ? 'Disable Policy' : 'Enable Policy'}
                  >
                    {policy.enabled ? (
                      <ToggleRight className="w-6 h-6 text-[var(--color-success)] glow-status-success rounded" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-600" />
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDelete(policy.id)}
                    type="button"
                    className="p-1 rounded hover:bg-[var(--color-danger)]/10 text-gray-500 hover:text-[var(--color-danger)] transition-all"
                    title="Delete Policy"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Row 2: Telemetry Meta */}
              <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2 text-[10px] text-gray-500 font-mono select-none">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Index Date: {policy.date}
                </span>
                <span className="flex items-center gap-1 text-[var(--color-success)] font-bold">
                  {policy.enabled ? (
                    <>
                      <ShieldCheck className="w-3 h-3" /> ARMED
                    </>
                  ) : (
                    <span className="text-gray-600">BYPASSED</span>
                  )}
                </span>
              </div>

            </div>
          ))
        ) : (
          <div className="text-center py-10 border border-dashed border-white/5 rounded-lg text-gray-500 font-mono text-xs">
            No compliance guidelines indexed yet.
          </div>
        )}
      </div>

    </GlassCard>
  );
}

ActivePolicies.propTypes = {
  policies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      chunks: PropTypes.number.isRequired,
      date: PropTypes.string.isRequired,
      enabled: PropTypes.bool.isRequired,
    })
  ).isRequired,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
