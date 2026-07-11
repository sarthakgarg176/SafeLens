import React from 'react';

const badgeConfig = {
  high: {
    classes: 'bg-risk-high/10 text-risk-high border border-risk-high/20',
    label: 'High Risk',
    dotColor: 'bg-risk-high',
  },
  medium: {
    classes: 'bg-risk-medium/10 text-risk-medium border border-risk-medium/20',
    label: 'Medium Risk',
    dotColor: 'bg-risk-medium',
  },
  low: {
    classes: 'bg-risk-low/10 text-risk-low border border-risk-low/20',
    label: 'Low Risk',
    dotColor: 'bg-risk-low',
  },
  safe: {
    classes: 'bg-risk-safe/10 text-risk-safe border border-risk-safe/20',
    label: 'Safe Asset',
    dotColor: 'bg-risk-safe',
  },
};

export default function RiskBadge({ level = 'safe', showPulse = true, className = '', children }) {
  const normLevel = level.toLowerCase();
  const config = badgeConfig[normLevel] || badgeConfig.safe;

  // Pulse dot applies only to 'high' and 'medium' levels by layout spec
  const hasPulse = showPulse && (normLevel === 'high' || normLevel === 'medium');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 ${config.classes} ${className}`}
    >
      {hasPulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotColor}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`}></span>
        </span>
      )}
      {children || config.label}
    </span>
  );
}
