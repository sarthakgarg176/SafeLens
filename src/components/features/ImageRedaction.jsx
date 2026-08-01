import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, ScanEye, AlertTriangle, Gauge, CheckCircle2, Upload } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { processImage, fetchAssetsSummary } from '../../services/api';

const DEFAULT_RESULT = {
  status: 'REDACTED',
  piiCount: 3,
  boundingBoxes: [
    { x: 20, y: 30, w: 90, h: 16 },
    { x: 20, y: 60, w: 130, h: 16 },
    { x: 160, y: 30, w: 70, h: 16 }
  ],
  latencyMs: 398,
  dimensions: '1080x720'
};

/**
 * ImageRedaction
 * Lets you upload an image, sends it to POST /api/process-image, and shows the
 * returned bounding boxes over detected sensitive text plus backend headers.
 */
export default function ImageRedaction() {
  const [result, setResult] = useState(DEFAULT_RESULT);
  const [scanning, setScanning] = useState(false);
  const [imagesScanned, setImagesScanned] = useState(212);
  const [piiElementsFound, setPiiElementsFound] = useState(58);

  useEffect(() => {
    let isMounted = true;
    fetchAssetsSummary().then((summary) => {
      if (isMounted) {
        setImagesScanned(summary.imagesScanned);
        setPiiElementsFound(summary.piiElementsFound);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    try {
      const data = await processImage(file);
      setResult(data);
      setImagesScanned((prev) => prev + 1);
    } finally {
      setScanning(false);
      e.target.value = ''; // allow re-selecting the same file
    }
  };

  const { status, piiCount, boundingBoxes, latencyMs, dimensions } = result;

  return (
    <div className="w-full min-h-screen bg-[#0a0d14] text-white p-4 md:p-8 flex flex-col gap-6 font-sans">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 animate-cascade delay-1">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-wider uppercase">Image Redaction</h2>
            <p className="text-xs text-gray-500 font-mono">
              Scans uploaded or pasted images and blacks out sensitive text — IDs, card numbers, signatures — before upload.
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 text-xs font-mono uppercase tracking-wider cursor-pointer hover:bg-[var(--color-success)]/20 transition-colors">
          <Upload className="w-4 h-4" />
          {scanning ? 'Scanning…' : 'Scan Image'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={scanning} />
        </label>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-cascade delay-2">
        <GlassCard hoverable status="info" glow className="p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">Images Scanned</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--color-info)] tracking-tight">{imagesScanned}</span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-info)]/10 text-[var(--color-info)] border border-[var(--color-info)]/20">
            <ScanEye className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard hoverable status="warning" glow className="p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">PII Elements Found</span>
            <span className="text-2xl md:text-3xl font-black text-[var(--color-warning)] tracking-tight">{piiElementsFound}</span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </GlassCard>

        <GlassCard hoverable className="p-4 flex items-center justify-between border-white/10">
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest uppercase">Latency</span>
            <span className="text-2xl md:text-3xl font-black text-white tracking-tight">{latencyMs}ms</span>
          </div>
          <div className="p-3 rounded-lg bg-white/5 text-white border border-white/10">
            <Gauge className="w-6 h-6" />
          </div>
        </GlassCard>
      </div>

      {/* Image viewer + backend header panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-cascade delay-3">
        <div className="lg:col-span-2">
          <GlassCard className="p-5 border-white/10">
            <h3 className="font-bold text-sm tracking-wider font-mono text-white uppercase border-b border-white/5 pb-4 mb-4">
              Scanned Image — Detected Regions
            </h3>
            <svg viewBox="0 0 260 140" className="w-full h-auto rounded-lg" style={{ background: '#111623' }}>
              <rect x="1" y="1" width="258" height="138" rx="8" fill="none" stroke="rgba(255,255,255,0.08)" />
              {boundingBoxes.map((b, i) => (
                <rect
                  key={i}
                  x={b.x} y={b.y} width={b.w} height={b.h}
                  fill="var(--color-danger, #f87171)" fillOpacity="0.18"
                  stroke="var(--color-danger, #f87171)" strokeWidth="1.5" rx="2"
                />
              ))}
              <rect x="20" y="90" width="180" height="10" fill="#232a38" rx="2" />
              <rect x="20" y="106" width="130" height="10" fill="#232a38" rx="2" />
            </svg>
            <p className="text-[10px] text-gray-500 font-mono mt-3">
              Demo layout shown until an image is scanned — click "Scan Image" above to upload a real one.
            </p>
          </GlassCard>
        </div>

        <GlassCard className="p-5 border-white/10 flex flex-col gap-3">
          <h3 className="font-bold text-sm tracking-wider font-mono text-white uppercase border-b border-white/5 pb-4 mb-1">
            Backend Response
          </h3>
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-gray-500 uppercase tracking-wider">Status</span>
            <span className="text-[var(--color-success)] flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> {status}
            </span>
          </div>
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-gray-500 uppercase tracking-wider">PII Elements</span>
            <span className="text-white">{piiCount} found</span>
          </div>
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-gray-500 uppercase tracking-wider">Latency</span>
            <span className="text-white">{latencyMs}ms</span>
          </div>
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-gray-500 uppercase tracking-wider">Dimensions</span>
            <span className="text-white">{dimensions}</span>
          </div>
        </GlassCard>
      </div>

    </div>
  );
}
