import React, { useState } from 'react';
import {
  FileCode,
  FileText,
  FileImage,
  FileArchive,
  Search,
  Eye,
  Download,
  Calendar,
  Layers,
  Globe,
  ShieldCheck,
  X,
  Fingerprint,
  HardDrive
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import RiskBadge from '../components/common/RiskBadge';

const mockAssets = [
  {
    id: 'ASSET-8821',
    name: 'id_card_front.png',
    type: 'Government ID',
    rawType: 'image',
    uploadDate: 'Jul 10, 2026',
    source: 'staging.auth-service',
    status: 'Blurred',
    risk: 'low',
    size: '1.4 MB',
    hash: '8f2d7c9a1e0b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
    piiDetected: ['National ID Number', 'Full Name', 'Date of Birth']
  },
  {
    id: 'ASSET-7732',
    name: 'salary_slip_aarav.pdf',
    type: 'Financial Invoice',
    rawType: 'pdf',
    uploadDate: 'Jul 09, 2026',
    source: 'internal.hcm-portal',
    status: 'Redacted',
    risk: 'medium',
    size: '482 KB',
    hash: '0e3b9f4a1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
    piiDetected: ['Salary Figures', 'Bank Account Info', 'Home Address']
  },
  {
    id: 'ASSET-4109',
    name: 'ssh_config.cfg',
    type: 'System Logs',
    rawType: 'code',
    uploadDate: 'Jul 08, 2026',
    source: 'dev-server-01.local',
    status: 'Redacted',
    risk: 'high',
    size: '12 KB',
    hash: '7c3aed6366f10a0b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4g5h',
    piiDetected: ['SSH Private Key', 'Root Credentials', 'Internal Ports']
  },
  {
    id: 'ASSET-1024',
    name: 'brand_logo_watermarked.png',
    type: 'Brand Trademark',
    rawType: 'image',
    uploadDate: 'Jul 07, 2026',
    source: 'corporate-marketing',
    status: 'Watermarked',
    risk: 'safe',
    size: '2.8 MB',
    hash: '3f2d1c0b9a8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c',
    piiDetected: []
  },
  {
    id: 'ASSET-5520',
    name: 'database_backup_dump.tar.gz',
    type: 'System Backup',
    rawType: 'archive',
    uploadDate: 'Jul 05, 2026',
    source: 'backup-storage-pool',
    status: 'Masked',
    risk: 'high',
    size: '142.6 MB',
    hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
    piiDetected: ['Customer Accounts', 'Password Hashes', 'Billing Tokens']
  }
];

export default function Assets() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);

  const getFileIcon = (rawType) => {
    switch (rawType) {
      case 'image':
        return <FileImage className="w-5 h-5 text-indigo-500" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-amber-500" />;
      case 'archive':
        return <FileArchive className="w-5 h-5 text-blue-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const filteredAssets = mockAssets.filter((asset) =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Title block */}
      <div>
        <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-slate-100 tracking-tight">
          Protected Assets Directory
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review, analyze, and retrieve files protected by active security layers.
        </p>
      </div>

      {/* Main GlassCard Container */}
      <GlassCard hoverEffect={false} className="relative overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search assets by file name, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-border bg-slate-100/50 dark:bg-black/20 focus:bg-surface text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Showing {filteredAssets.length} of {mockAssets.length} Assets</span>
          </div>
        </div>

        {/* Assets Data Table */}
        <div className="overflow-x-auto scrollbar-thin mt-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-4 px-4 w-[8%] text-center">Icon</th>
                <th className="py-4 px-4 w-[22%]">File Name</th>
                <th className="py-4 px-4 w-[15%]">Asset Type</th>
                <th className="py-4 px-4 w-[15%]">Upload Date</th>
                <th className="py-4 px-4 w-[15%]">Source Origin</th>
                <th className="py-4 px-4 w-[12%] text-center">Status</th>
                <th className="py-4 px-4 w-[13%] text-center">Threat Level</th>
                <th className="py-4 px-4 w-[10%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-slate-700 dark:text-slate-300 font-medium">
              {filteredAssets.map((asset) => (
                <tr
                  key={asset.id}
                  className="hover:bg-slate-100/40 dark:hover:bg-white/2 transition-colors duration-150 group"
                >
                  <td className="py-4 px-4 flex justify-center">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-black/30 border border-border flex items-center justify-center">
                      {getFileIcon(asset.rawType)}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {asset.name}
                  </td>
                  <td className="py-4 px-4">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {asset.type}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {asset.uploadDate}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono truncate max-w-[150px]">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      {asset.source}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      asset.status === 'Redacted'
                        ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                        : asset.status === 'Blurred'
                        ? 'bg-risk-low/10 text-risk-low border border-risk-low/20'
                        : asset.status === 'Watermarked'
                        ? 'bg-risk-safe/10 text-risk-safe border border-risk-safe/20'
                        : 'bg-risk-medium/10 text-risk-medium border border-risk-medium/20'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <RiskBadge level={asset.risk} className="py-0.5 px-2 text-[10px]" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedAsset(asset)}
                        className="p-1.5 rounded-lg border border-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-primary hover:border-brand-primary/30 transition-all cursor-pointer"
                        title="View Metadata Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg border border-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-risk-safe hover:border-risk-safe/30 transition-all cursor-pointer"
                        title="Download Copy"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 dark:text-slate-500 font-sans">
                    No protected assets matched your filter rules.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Details Side-Drawer Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedAsset(null)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-md h-full bg-slate-50 dark:bg-[#0c0d14] border-l border-border shadow-2xl p-6 overflow-y-auto scrollbar-thin z-10 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Fingerprint className="w-5 h-5 text-brand-primary animate-pulse" />
                  <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">
                    Cryptographic Audit
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-1.5 rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5 text-slate-400" />
                </button>
              </div>

              {/* Asset Snapshot */}
              <div className="p-4 rounded-xl bg-slate-100/60 dark:bg-black/20 border border-border flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center shadow-sm">
                  {getFileIcon(selectedAsset.rawType)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                    {selectedAsset.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedAsset.id}</p>
                </div>
              </div>

              {/* Metadata Records */}
              <div className="space-y-4 text-xs">
                <h4 className="font-display font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Resource Parameters
                </h4>

                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-slate-400">CATEGORY</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedAsset.type}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-slate-400">ORIGIN</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedAsset.source}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-slate-400">FILE_SIZE</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedAsset.size}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-slate-400">ENFORCEMENT</span>
                    <span className="font-semibold text-brand-primary">{selectedAsset.status}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-slate-400">SEVERITY</span>
                    <RiskBadge level={selectedAsset.risk} className="py-0.5 px-2 text-[9px]" />
                  </div>
                  <div className="flex flex-col gap-1.5 py-2">
                    <span className="text-slate-400">SHA256_HASH</span>
                    <span className="text-[9px] break-all bg-slate-100 dark:bg-black/35 p-2 rounded-lg border border-border text-slate-500">
                      {selectedAsset.hash}
                    </span>
                  </div>
                </div>
              </div>

              {/* PII Matches */}
              <div className="space-y-3 text-xs">
                <h4 className="font-display font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Shielded PII Attributes ({selectedAsset.piiDetected.length})
                </h4>

                <div className="flex flex-wrap gap-1.5">
                  {selectedAsset.piiDetected.map((item) => (
                    <span
                      key={item}
                      className="px-2.5 py-1 rounded-lg bg-risk-high/5 border border-risk-high/15 text-risk-high text-[10px] font-bold"
                    >
                      {item}
                    </span>
                  ))}
                  {selectedAsset.piiDetected.length === 0 && (
                    <span className="text-slate-400 italic">No sensitive data leaks detected.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-6 border-t border-border mt-8">
              <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-sm font-semibold hover:shadow-lg hover:shadow-brand-primary/25 transition-all cursor-pointer">
                <ShieldCheck className="w-4 h-4" /> Verify Protection Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
