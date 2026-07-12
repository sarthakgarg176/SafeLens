import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, ShieldAlert, Lock, CheckCircle2, X } from 'lucide-react';

export default function SecureDropzone({ onFileSelect }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (onFileSelect) onFileSelect(file);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (onFileSelect) onFileSelect(file);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (onFileSelect) onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-brand-primary" />
          <h3 className="font-display font-bold text-base text-slate-800 dark:text-slate-100">
            Secure Asset Upload Portal
          </h3>
        </div>
      </div>

      {/* Upload Zone Card Container */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative flex-1 flex flex-col items-center justify-center p-6 border-dashed border-2 rounded-2xl cursor-pointer transition-all duration-300 min-h-[220px] select-none ${
          dragActive
            ? 'border-brand-primary bg-brand-primary/5 scale-[1.01]'
            : 'border-border bg-slate-100/30 dark:bg-black/10 hover:border-brand-primary/50 hover:bg-slate-100/50 dark:hover:bg-black/25'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept="image/*,application/pdf,text/*"
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center text-center space-y-3">
            {/* Shield and Cloud Upload icon with interactive spring bounce */}
            <motion.div
              whileHover={{ y: -5, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 350, damping: 15 }}
              className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center neon-glow-purple"
            >
              <UploadCloud className="w-6 h-6 stroke-[2]" />
            </motion.div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Drag & drop sensitive document here
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                or click to browse local files
              </p>
            </div>
            
            <p className="text-[10px] text-slate-400">
              Supports PDF, PNG, JPG, or TXT (Max 10MB)
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-4 w-full max-w-xs">
            {/* File Selected State */}
            <div className="w-12 h-12 rounded-xl bg-risk-safe/10 text-risk-safe flex items-center justify-center border border-risk-safe/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <CheckCircle2 className="w-6 h-6 stroke-[2]" />
            </div>

            <div className="space-y-1 w-full">
              <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate px-2">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {formatBytes(selectedFile.size)}
              </p>
            </div>

            <button
              onClick={removeFile}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-risk-high/10 hover:text-risk-high hover:border-risk-high/20 transition-all duration-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear File
            </button>
          </div>
        )}
      </div>

      {/* Data Privacy Note Block */}
      <div className="flex items-center justify-center gap-2 p-3 rounded-xl border border-border bg-slate-100/30 dark:bg-black/10">
        <Lock className="w-3.5 h-3.5 text-risk-safe shrink-0" />
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-semibold">
          On-device processing active: data never leaves local environment.
        </span>
      </div>
    </div>
  );
}
