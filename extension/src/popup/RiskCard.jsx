import React from 'react';

/**
 * RiskCard Component
 * 
 * Responsibility:
 * - Displays a visual risk rating card based on PII detections.
 * - Highlights severity categories (Low, Medium, High) with dynamic colors.
 * - Details overall item count, confidence rating, and recommended action.
 * 
 * Input/Output Contract (Props):
 * - riskLevel: 'low'|'medium'|'high'
 * - piiCount: number
 * - confidence: number (0 to 1 scale)
 * 
 * Interacts with:
 * - extension/src/popup/ScanSummary.jsx (Embeds this card in its report layout)
 */
export default function RiskCard({ riskLevel = 'low', piiCount = 0, confidence = 0 }) {
  // Determine dynamic classes and recommended action text based on risk severity
  const getRiskDetails = () => {
    switch (riskLevel.toLowerCase()) {
      case 'high':
        return {
          textColor: 'text-red-400',
          borderColor: 'border-red-500/30',
          bgColor: 'bg-red-500/10',
          glowColor: 'shadow-red-500/20',
          title: 'High Risk Alert',
          action: '⚠️ Action Required: Redact sensitive contents before proceeding with submission.',
        };
      case 'medium':
        return {
          textColor: 'text-orange-400',
          borderColor: 'border-orange-500/30',
          bgColor: 'bg-orange-500/10',
          glowColor: 'shadow-orange-500/20',
          title: 'Medium Risk Found',
          action: '🛡️ Recommended: Apply blur redaction to private coordinates.',
        };
      case 'low':
      default:
        return {
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/30',
          bgColor: 'bg-emerald-500/10',
          glowColor: 'shadow-emerald-500/20',
          title: 'Low Risk Profile',
          action: '✅ Safe to Upload: No highly sensitive PII matched.',
        };
    }
  };

  const details = getRiskDetails();
  const confidencePercent = Math.round(confidence * 100);

  return (
    <div className={`p-4 rounded-xl border ${details.bgColor} ${details.borderColor} shadow-lg ${details.glowColor} transition-all duration-300`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-brand-textDim font-semibold tracking-wider uppercase">Risk Evaluation</span>
        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-current ${details.textColor}`}>
          {riskLevel.toUpperCase()}
        </span>
      </div>

      <h3 className={`text-base font-bold mb-1 ${details.textColor}`}>{details.title}</h3>
      
      <div className="grid grid-cols-2 gap-3 my-3 border-t border-brand-border/40 pt-3">
        <div>
          <p className="text-[10px] text-brand-textDim uppercase tracking-wide">PII Count</p>
          <p className="text-lg font-bold text-brand-textBright">{piiCount} Items</p>
        </div>
        <div>
          <p className="text-[10px] text-brand-textDim uppercase tracking-wide">Confidence Rating</p>
          <p className="text-lg font-bold text-brand-textBright">{confidencePercent}%</p>
        </div>
      </div>

      <div className="mt-3 text-xs border-t border-brand-border/40 pt-3 text-brand-textMain leading-relaxed font-medium">
        {details.action}
      </div>
    </div>
  );
}
