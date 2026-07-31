import React from 'react';
import PropTypes from 'prop-types';

/**
 * StatusBadge Component
 * Renders a small pulsing neon dot alongside uppercase status text.
 * Mapped to the SafeLens 2.0 security Operations status guidelines.
 *
 * @param {Object} props
 * @param {'success' | 'warning' | 'failed' | 'danger' | 'info'} props.status - Status state
 * @param {string} [props.label] - Optional text override for status label
 */
export default function StatusBadge({ status, label }) {
  const config = React.useMemo(() => {
    switch (status) {
      case 'success':
        return {
          textClass: 'status-success',
          bgClass: 'bg-status-success',
          dotClass: 'bg-[var(--color-success)] pulse-glow-green',
          defaultLabel: 'SUCCESS',
        };
      case 'warning':
        return {
          textClass: 'status-warning',
          bgClass: 'bg-status-warning',
          dotClass: 'bg-[var(--color-warning)] pulse-glow-amber',
          defaultLabel: 'WARNING',
        };
      case 'failed':
      case 'danger':
        return {
          textClass: 'status-danger',
          bgClass: 'bg-status-danger',
          dotClass: 'bg-[var(--color-danger)] pulse-glow-crimson',
          defaultLabel: 'FAILED',
        };
      case 'info':
      default:
        return {
          textClass: 'status-info',
          bgClass: 'bg-status-info',
          dotClass: 'bg-[var(--color-info)]',
          defaultLabel: 'PROCESSING',
        };
    }
  }, [status]);

  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase transition-all duration-300 border border-white/5 ${config.bgClass} ${config.textClass}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotClass}`} />
      <span>{displayLabel}</span>
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['success', 'warning', 'failed', 'danger', 'info']).isRequired,
  label: PropTypes.string,
};
