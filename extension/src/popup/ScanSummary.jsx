import React, { useState } from 'react';
import RiskCard from './RiskCard';

/**
 * ScanSummary Component
 * 
 * Responsibility:
 * - Renders a structured report of the last scanned file transaction.
 * - Displays scanning latency (processing time), mime types, and file metadata.
 * - Lists PII occurrences with individual confidence ratings.
 * - Integrates RiskCard to show consolidated safety level warnings.
 * - Integrates report generation button calling the FastAPI reports API.
 */
export default function ScanSummary({ scanRecord, onBack }) {
  const [reportState, setReportState] = useState({ loading: false, url: null, error: null, id: null });

  if (!scanRecord) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-surface border border-brand-border/40 flex items-center justify-center text-brand-textDim text-lg mb-3">
          🔍
        </div>
        <p className="text-sm font-semibold text-brand-textBright">No Scans Recorded</p>
        <p className="text-xs text-brand-textDim mt-1 max-w-[200px]">
          Upload an image on any webpage to trigger real-time privacy scanning.
        </p>
      </div>
    );
  }

  const {
    fileName = 'unnamed_file.png',
    size = 0,
    riskLevel = 'low',
    confidence = 0,
    piiCount = 0,
    detections = [],
    processingTime = 0,
    status = 'pending',
    incidentId = null
  } = scanRecord;

  // Format file size
  const fileSizeKB = (size / 1024).toFixed(1);

  // Status badge styling helper
  const getStatusBadge = (s) => {
    switch (s.toLowerCase()) {
      case 'protected':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'bypassed':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'blocked':
      case 'cancelled':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      default:
        return 'bg-brand-border/55 border-brand-border text-brand-textMain';
    }
  };

  const handleGenerateReport = async () => {
    if (!incidentId) return;
    setReportState({ loading: true, url: null, error: null, id: null });
    try {
      const response = await fetch(`https://safelens-zttx.onrender.com/api/report?incident_id=${incidentId}`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const result = await response.json();
      if (result.success && result.data) {
        setReportState({
          loading: false,
          url: result.data.download_url,
          id: result.data.report_id,
          error: null
        });
      } else {
        throw new Error(result.message || 'Report generation failed');
      }
    } catch (err) {
      console.error('[ScanSummary] Failed to generate PDF report:', err);
      setReportState({
        loading: false,
        url: null,
        id: null,
        error: err.message
      });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center pb-2 border-b border-brand-border/40">
        <button
          onClick={onBack}
          className="text-xs text-brand-cyan hover:text-brand-cyanHover font-bold flex items-center gap-1 transition-colors"
        >
          ← Back Home
        </button>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${getStatusBadge(status)}`}>
          {status.toUpperCase()}
        </span>
      </div>

      {/* File details card */}
      <div className="p-3 bg-brand-surface/40 border border-brand-border/30 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-purpleGlow border border-brand-purple/20 flex items-center justify-center text-lg shadow-inner">
          🖼️
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-brand-textBright truncate">{fileName}</p>
          <p className="text-[10px] text-brand-textDim">
            {fileSizeKB} KB • {processingTime}ms latency
          </p>
        </div>
      </div>

      {/* Risk Metrics */}
      <RiskCard riskLevel={riskLevel} piiCount={piiCount} confidence={confidence} />

      {/* Report Generation Section */}
      {incidentId && (
        <div className="p-3 bg-brand-surface/30 border border-brand-border/20 rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-brand-textBright">Incident Report</span>
            <span className="text-[10px] text-brand-textDim">ID: {incidentId}</span>
          </div>
          {reportState.url ? (
            <div className="space-y-1.5">
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <span>✓</span> Report Generated (ID: {reportState.id})
              </p>
              <p className="text-[9px] text-brand-textDim font-mono truncate bg-brand-bg/50 p-1.5 rounded border border-brand-border/10">
                {reportState.url}
              </p>
            </div>
          ) : (
            <button
              onClick={handleGenerateReport}
              disabled={reportState.loading}
              className={`w-full py-2 px-3 rounded-lg border text-center font-bold transition-all duration-200 text-xs ${
                reportState.loading
                  ? 'border-brand-border bg-brand-bg text-brand-textDim cursor-not-allowed'
                  : 'border-brand-cyan bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan'
              }`}
            >
              {reportState.loading ? 'Generating PDF...' : '📄 Generate Incident Report'}
            </button>
          )}
          {reportState.error && (
            <p className="text-[9px] text-red-400 font-medium">Error: {reportState.error}</p>
          )}
        </div>
      )}

      {/* Detections details */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-brand-textBright tracking-wide">Detections List</h4>
        {detections.length === 0 ? (
          <div className="p-3 rounded-lg border border-brand-border/20 bg-brand-surface/20 text-center text-xs text-brand-textDim">
            No sensitive data elements detected in image.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
            {detections.map((det, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 rounded-lg bg-brand-surface/30 border border-brand-border/20 text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-purple"></span>
                  <span className="font-bold text-brand-textBright">{det.type}</span>
                  <span className="text-[10px] text-brand-textDim font-mono max-w-[120px] truncate bg-brand-bg/50 px-1 py-0.5 rounded">
                    {det.value || det.text}
                  </span>
                </div>
                <span className="text-brand-cyan font-semibold">
                  {Math.round((det.fusedConfidence || det.confidence) * 100)}% Match
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
