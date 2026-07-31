import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import StatusBadge from './StatusBadge';
import LogAccordion from './LogAccordion';

/**
 * StepCard Component
 * Displays a single pipeline execution phase, complete with status, timestamps, and log console accordions.
 *
 * @param {Object} props
 * @param {number} props.stepNumber - Execution phase digit (e.g. 1, 2, 3...)
 * @param {string} props.title - Title describing the intercept phase
 * @param {string} props.timestamp - Clock execution signature (ISO or formatted string)
 * @param {'success' | 'warning' | 'failed' | 'danger' | 'info'} props.status - Intercept state
 * @param {string[]} [props.logs] - CLI logs
 * @param {Object|string} [props.rawJson] - Payload details
 * @param {number} props.index - Element list index for staggering cascade animation
 * @param {boolean} [props.isLast] - Disables vertical connector line if final card
 */
export default function StepCard({
  stepNumber,
  title,
  timestamp,
  status,
  logs = [],
  rawJson = null,
  index,
  isLast = false
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Map status states to theme configurations for left nodes
  const nodeConfig = React.useMemo(() => {
    switch (status) {
      case 'success':
        return {
          border: 'border-[var(--color-success)] text-[var(--color-success)]',
          glow: 'glow-status-success pulse-glow-green',
        };
      case 'warning':
        return {
          border: 'border-[var(--color-warning)] text-[var(--color-warning)]',
          glow: 'glow-status-warning pulse-glow-amber',
        };
      case 'failed':
      case 'danger':
        return {
          border: 'border-[var(--color-danger)] text-[var(--color-danger)]',
          glow: 'glow-status-danger pulse-glow-crimson',
        };
      default:
        return {
          border: 'border-[var(--color-info)] text-[var(--color-info)]',
          glow: 'glow-status-info',
        };
    }
  }, [status]);

  const toggleAccordion = (e) => {
    // Avoid double trigger if target is something else or let standard clicks toggle
    setIsOpen((prev) => !prev);
  };

  // Safe offset calculation for staggered CSS animation
  const staggerClass = `animate-cascade delay-${(index % 8) + 1}`;

  return (
    <div className={`flex gap-4 items-stretch w-full ${staggerClass}`}>
      {/* Left: Sequence Node and Glowing Vertical Link */}
      <div className="flex flex-col items-center shrink-0 w-8">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs border bg-[#0a0d14] z-10 transition-all duration-300 ${nodeConfig.border} ${nodeConfig.glow}`}
        >
          {stepNumber}
        </div>
        {!isLast && (
          <div className="w-[2px] grow bg-gradient-to-b from-white/15 to-white/5 my-1 min-h-[30px]" />
        )}
      </div>

      {/* Right: Main Glass Card content */}
      <div className="grow mb-4">
        <GlassCard
          hoverable
          status={status}
          className="w-full transition-all duration-300"
          onClick={toggleAccordion}
        >
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 select-none cursor-pointer">
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold text-sm md:text-base tracking-wide text-white">
                {title}
              </h3>
              <span className="text-[10px] md:text-xs font-mono text-gray-500">
                {timestamp}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <StatusBadge status={status} />
              <button
                type="button"
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors duration-200"
                aria-label={isOpen ? 'Collapse logs' : 'Expand logs'}
              >
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Embedded Log Accordion */}
          <LogAccordion rawJson={rawJson} logs={logs} isOpen={isOpen} />
        </GlassCard>
      </div>
    </div>
  );
}

StepCard.propTypes = {
  stepNumber: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  timestamp: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['success', 'warning', 'failed', 'danger', 'info']).isRequired,
  logs: PropTypes.arrayOf(PropTypes.string),
  rawJson: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  index: PropTypes.number.isRequired,
  isLast: PropTypes.bool,
};
