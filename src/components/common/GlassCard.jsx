import React from 'react';

/**
 * GlassCard component is a sleek, glassmorphic container designed for the SafeLens 2.0 Command Center.
 * It leverages backdrop filter blur effects, custom hover states, and dynamic status-aware neon highlights.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The child components or content to render inside the card.
 * @param {string} [props.className] - Optional custom CSS classes to merge with the glass styles.
 * @param {boolean} [props.hoverable] - If true, enables hover translations, glow boosts, and interactive cursor states.
 * @param {'success' | 'warning' | 'danger' | 'info' | 'neon-green' | 'warning-amber' | 'alert-crimson'} [props.status] - Semantic status variant that highlights borders and text shadows.
 * @param {boolean} [props.glow] - If true, adds a constant soft background glow based on the status color.
 * @param {boolean} [props.pulse] - If true, adds a soft neon pulse animation to status glows.
 * @param {boolean} [props.scanLine] - If true, adds a visual rolling telemetry scan line overlay.
 */
export default function GlassCard({
  children,
  className = '',
  hoverable = false,
  status = '',
  glow = false,
  pulse = false,
  scanLine = false,
  ...props
}) {
  // Normalize the status tags to standard system key names
  const normalizedStatus = React.useMemo(() => {
    if (!status) return '';
    const map = {
      'success': 'success',
      'neon-green': 'success',
      'warning': 'warning',
      'warning-amber': 'warning',
      'danger': 'danger',
      'alert-crimson': 'danger',
      'info': 'info'
    };
    return map[status] || '';
  }, [status]);

  const classes = React.useMemo(() => {
    const list = ['glass-card-base'];

    if (hoverable) {
      list.push('glass-card-interactive');
      if (normalizedStatus) {
        list.push(`glass-card-${normalizedStatus}-hover`);
      }
    }

    if (normalizedStatus) {
      list.push(`border-status-${normalizedStatus}`);
      
      if (glow) {
        list.push(`glow-status-${normalizedStatus}`);
      }

      if (pulse) {
        list.push(`pulse-glow-${normalizedStatus}`);
      }
    }

    if (className) {
      list.push(className);
    }

    return list.join(' ');
  }, [hoverable, normalizedStatus, glow, pulse, className]);

  return (
    <div className={classes} {...props}>
      {scanLine && <div className="radar-scan-line" />}
      {/* Absolute grid overlay to support premium tech grid layout look */}
      <div className="cyber-grid-overlay" />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
