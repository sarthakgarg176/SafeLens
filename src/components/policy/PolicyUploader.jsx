import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import GlassCard from '../common/GlassCard';

const PIPELINE_STEPS = [
  { key: 'parsing', label: 'Parsing text layers' },
  { key: 'chunking', label: 'Semantic text chunking' },
  { key: 'embeddings', label: 'Generating Ollama embeddings' },
  { key: 'indexing', label: 'Indexing into ChromaDB vectors' }
];

/**
 * PolicyUploader Component
 * Provides an interactive drag-and-drop portal for privacy rule ingestion.
 * Simulates vector embedding generation.
 *
 * @param {Object} props
 * @param {Function} [props.onUploadSuccess] - Callback when policy is fully vector-indexed
 */
export default function PolicyUploader({ onUploadSuccess = null }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'uploading' | 'processing' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const processFile = (selectedFile) => {
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    if (extension !== 'pdf' && extension !== 'html') {
      setStatus('error');
      setErrorMsg('Invalid file format. Only PDF and HTML guidelines are supported.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setStatus('processing');
    setErrorMsg('');
    setCurrentStepIndex(0);
    setProgress(0);

    // Mock API upload endpoint simulation: /api/v1/policy/upload
    // Staged step updates
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < PIPELINE_STEPS.length) {
        setCurrentStepIndex(step);
        setProgress((step / PIPELINE_STEPS.length) * 100);
      } else {
        clearInterval(interval);
        setProgress(100);
        setStatus('success');
        
        // Trigger success callback to link with ActivePolicies
        if (onUploadSuccess) {
          onUploadSuccess({
            id: `policy-${Date.now()}`,
            title: selectedFile.name.replace(/\.[^/.]+$/, ""), // strip extension
            category: extension === 'pdf' ? 'GDPR PII' : 'Compliance Spec',
            chunks: Math.floor(Math.random() * 30) + 15,
            date: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }),
            enabled: true
          });
        }
      }
    }, 1000);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const resetUploader = () => {
    setFile(null);
    setStatus('idle');
    setCurrentStepIndex(-1);
    setProgress(0);
    setErrorMsg('');
  };

  return (
    <GlassCard className="p-5 border-white/10 w-full">
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 select-none">
        <h3 className="font-bold text-sm tracking-wider font-mono text-white uppercase">
          Policy Ingestion Portal
        </h3>
        <span className="text-[10px] text-gray-500 font-mono">ENDPOINT: /api/v1/policy/upload</span>
      </div>

      {status === 'idle' && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-all duration-300 cursor-pointer text-center ${
            isDragActive
              ? 'border-[var(--color-success)] bg-[var(--color-success)]/5 scale-[0.99] glow-status-success'
              : 'border-white/10 hover:border-white/20 hover:bg-white/2'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.html"
            onChange={handleFileChange}
          />
          <UploadCloud
            className={`w-10 h-10 mb-3 transition-colors duration-300 ${
              isDragActive ? 'text-[var(--color-success)]' : 'text-gray-400'
            }`}
          />
          <p className="text-sm font-semibold text-white tracking-wide">
            Drag & drop enterprise guidelines
          </p>
          <p className="text-xs text-gray-500 mt-1.5 font-mono">
            Supports .pdf, .html policy briefs
          </p>
        </div>
      )}

      {status === 'processing' && (
        <div className="p-4 border border-white/5 rounded-lg bg-black/20 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[var(--color-info)] animate-spin" />
            <div className="flex-1">
              <div className="flex justify-between items-center text-xs font-mono mb-1 select-none">
                <span className="text-gray-300">STREAMING EMBEDDINGS</span>
                <span className="text-white font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--color-info)] h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pipeline Progress Stages */}
          <div className="flex flex-col gap-2 border-t border-white/5 pt-3 font-mono text-[11px]">
            {PIPELINE_STEPS.map((step, idx) => {
              let stepClass = 'text-gray-500';
              let stepPrefix = '○';

              if (idx < currentStepIndex) {
                stepClass = 'text-[var(--color-success)] font-medium';
                stepPrefix = '●';
              } else if (idx === currentStepIndex) {
                stepClass = 'text-[var(--color-info)] font-bold animate-pulse';
                stepPrefix = '▶';
              }

              return (
                <div key={step.key} className={`flex items-center gap-2 ${stepClass}`}>
                  <span className="shrink-0">{stepPrefix}</span>
                  <span>{step.label.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="p-4 border border-[var(--color-success)]/20 rounded-lg bg-[var(--color-success)]/5 text-center flex flex-col items-center justify-center gap-3">
          <CheckCircle className="w-10 h-10 text-[var(--color-success)]" />
          <div>
            <p className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              Vector Ingest Complete
            </p>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              {file?.name} successfully indexed
            </p>
          </div>
          <button
            onClick={resetUploader}
            className="mt-2 px-4 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-white transition-all active:scale-95"
          >
            INGEST ANOTHER FILE
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="p-4 border border-[var(--color-danger)]/20 rounded-lg bg-[var(--color-danger)]/5 text-center flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-10 h-10 text-[var(--color-danger)]" />
          <div>
            <p className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              Ingestion Error
            </p>
            <p className="text-xs text-[var(--color-danger)] mt-1 font-mono max-w-[200px]">
              {errorMsg}
            </p>
          </div>
          <button
            onClick={resetUploader}
            className="mt-2 px-4 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-white transition-all active:scale-95"
          >
            TRY AGAIN
          </button>
        </div>
      )}
    </GlassCard>
  );
}

PolicyUploader.propTypes = {
  onUploadSuccess: PropTypes.func,
};
