import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, RefreshCw, Crosshair, HelpCircle, Activity } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import StatusBadge from '../timeline/StatusBadge';

const THREAT_FEED = [
  { id: 'tf-1', host: 'fake-bank-auth.com', level: 'failed', risk: 'HIGH', label: 'TYPOSQUAT DETECTED', reason: 'Typosquatted domain mimicking certified trust-bank.com portal.', date: '2026-07-24 11:20' },
  { id: 'tf-2', host: 'external-ai-upload.xyz', level: 'warning', risk: 'MEDIUM', label: 'UNREGISTERED HOST', reason: 'Outbound upload attempt destined for unverified model service.', date: '2026-07-24 10:45' },
  { id: 'tf-3', host: 'company-internal.com', level: 'success', risk: 'LOW', label: 'WHITELISTED PASS', reason: 'Authorized domain match. Security constraints bypassed.', date: '2026-07-24 09:12' }
];

export default function SpoofingAlerts() {
  const [threats, setThreats] = useState(THREAT_FEED);
  const [isolateThreats, setIsolateThreats] = useState(false);
  const canvasRef = useRef(null);

  // Animated Vector Space Cluster Map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Define mock vector space nodes
    let nodes = [
      // Malicious Cluster (Red)
      { x: 120, y: 110, vx: 0.1, vy: -0.1, r: 6, color: '#ff3333', type: 'malicious', label: 'fake-bank.com' },
      { x: 150, y: 130, vx: -0.15, vy: 0.1, r: 5, color: '#ff3333', type: 'malicious', label: 'spoof-portal.net' },
      { x: 130, y: 150, vx: 0.08, vy: 0.12, r: 5, color: '#ff3333', type: 'malicious', label: 'leak-node.org' },

      // Unregistered Cluster (Amber)
      { x: 320, y: 180, vx: -0.05, vy: 0.05, r: 6, color: '#ff9900', type: 'unregistered', label: 'external-ai.xyz' },
      { x: 300, y: 220, vx: 0.1, vy: -0.05, r: 5, color: '#ff9900', type: 'unregistered', label: 'unverified-upload.co' },

      // Safe Cluster (Green)
      { x: 220, y: 280, vx: -0.1, vy: -0.08, r: 7, color: '#00ffcc', type: 'safe', label: 'company-internal.com' },
      { x: 250, y: 290, vx: 0.05, vy: 0.08, r: 5, color: '#00ffcc', type: 'safe', label: 'verified-gov.in' },
      { x: 210, y: 310, vx: 0.06, vy: -0.05, r: 5, color: '#00ffcc', type: 'safe', label: 'corp-auth.com' },
      { x: 180, y: 270, vx: -0.05, vy: 0.07, r: 5, color: '#00ffcc', type: 'safe', label: 'api.safelens.io' }
    ];

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = 360;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawGrid = () => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      const step = 30;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Center Axes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = '#566275';
      ctx.font = '9px monospace';
      ctx.fillText('EMBEDDING DIMENSION 1 (X)', canvas.width - 150, canvas.height / 2 - 5);
      ctx.fillText('EMBEDDING DIMENSION 2 (Y)', canvas.width / 2 + 5, 15);
    };

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid();

      // Render similarity linkages (lines between nodes in the same cluster)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[i].type === nodes[j].type) {
            const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
            // Only link nodes that are reasonably close
            if (dist < 120) {
              const alpha = Math.max(0, 1 - dist / 120) * 0.15;
              ctx.strokeStyle = nodes[i].type === 'malicious' ? `rgba(255, 51, 51, ${alpha})` :
                                nodes[i].type === 'unregistered' ? `rgba(255, 153, 0, ${alpha})` :
                                `rgba(0, 255, 204, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // Update and draw nodes
      nodes.forEach((node) => {
        // Apply isolation highlight filter
        if (isolateThreats && node.type !== 'malicious') {
          ctx.globalAlpha = 0.15;
        } else {
          ctx.globalAlpha = 1.0;
        }

        // Float motion boundary checks
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 20 || node.x > canvas.width - 20) node.vx *= -1;
        if (node.y < 20 || node.y > canvas.height - 20) node.vy *= -1;

        // Draw outer glow ring
        ctx.shadowBlur = isolateThreats && node.type === 'malicious' ? 20 : 8;
        ctx.shadowColor = node.color;
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Draw inner dot highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Node Title Tag (only key nodes)
        if (node.r > 5) {
          ctx.fillStyle = node.type === 'malicious' ? '#ff7b72' : '#8f9cae';
          ctx.font = '8px monospace';
          ctx.fillText(node.label, node.x + 10, node.y + 3);
        }
      });
      ctx.globalAlpha = 1.0; // reset

      // Draw cluster boundary zones
      if (isolateThreats) {
        ctx.strokeStyle = 'rgba(255, 51, 51, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(135, 130, 75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = 'rgba(255, 51, 51, 0.05)';
        ctx.beginPath();
        ctx.arc(135, 130, 75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff3333';
        ctx.font = '9px font-mono';
        ctx.fillText('MALICIOUS CLUSTER', 65, 45);
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isolateThreats]);

  const handleRegenerate = () => {
    setIsolateThreats(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-6 font-mono">
      
      {/* Risk Cluster Map & Threat Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Vector Space Cluster Visualization */}
        <GlassCard className="p-5 border-white/10 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 select-none">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-[var(--color-danger)]" />
                <h3 className="font-bold text-sm tracking-wider uppercase text-white">
                  Vector Space Cluster Map
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsolateThreats(!isolateThreats)}
                  className={`px-2 py-1 rounded text-[9px] font-bold border transition-colors ${
                    isolateThreats
                      ? 'bg-[var(--color-danger)]/15 border-[var(--color-danger)] text-[var(--color-danger)]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {isolateThreats ? 'THREAT ZONE ISOLATED' : 'ISOLATE THREATS'}
                </button>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white"
                  title="Refresh Vectors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Simulated Vector Graph */}
            <div className="relative border border-white/5 rounded-lg bg-black/40 overflow-hidden">
              <canvas ref={canvasRef} className="block w-full h-[360px]" />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-500 justify-between select-none">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)] shrink-0" /> SAFE NODES</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)] shrink-0" /> UNREGISTERED</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[var(--color-danger)] shrink-0" /> MALICIOUS / SPOOFED</span>
          </div>
        </GlassCard>

        {/* Threat Feed List */}
        <GlassCard className="p-5 border-white/10 flex flex-col gap-4">
          
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 select-none">
            <ShieldAlert className="w-4 h-4 text-[var(--color-danger)]" />
            <h3 className="font-bold text-sm tracking-wider uppercase text-white">
              Threat Intelligence Feed
            </h3>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[380px] scrollbar-thin pr-1">
            {threats.map((threat) => (
              <div
                key={threat.id}
                className={`p-4 border rounded-lg transition-all duration-300 ${
                  threat.level === 'failed'
                    ? 'border-[var(--color-danger)]/25 bg-[var(--color-danger)]/5'
                    : threat.level === 'warning'
                    ? 'border-[var(--color-warning)]/25 bg-[var(--color-warning)]/5'
                    : 'border-[var(--color-success)]/10 bg-[var(--color-success)]/3'
                }`}
              >
                
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white font-bold text-xs md:text-sm">{threat.host}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{threat.date}</span>
                  </div>
                  
                  {/* Risk Badge */}
                  <StatusBadge status={threat.level} label={`${threat.risk} RISK`} />
                </div>

                {/* Details */}
                <div className="mt-3 text-xs leading-relaxed text-gray-400">
                  <span className="text-white font-semibold block text-[10px] tracking-wider font-mono text-gray-500 uppercase mb-1">
                    THREAT PROFILE: {threat.label}
                  </span>
                  {threat.reason}
                </div>

              </div>
            ))}
          </div>

        </GlassCard>

      </div>

    </div>
  );
}
