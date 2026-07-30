import React, { useState, useEffect } from 'react';
import { Shield, ShieldOff, ShieldAlert, Clock, Globe, Plus } from 'lucide-react';
import {
  subscribeToShieldStatus,
  requestShieldStatus,
  setShieldPaused,
  snoozeShield,
  addWhitelistDomain
} from '../../services/extensionBridge';

/**
 * ShieldStatusBar
 * Shows live extension shield status (Active / Snoozed / Not Found) and lets
 * you snooze, resume, or whitelist a domain — synced with interceptor.js via
 * window.postMessage (no page refresh needed).
 */
export default function ShieldStatusBar() {
  const [status, setStatus] = useState(null); // null = still checking
  const [domainInput, setDomainInput] = useState('');
  const [showWhitelistInput, setShowWhitelistInput] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToShieldStatus(setStatus);
    requestShieldStatus();
    // Re-check periodically in case the extension only just loaded
    const interval = setInterval(requestShieldStatus, 10000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSnooze = (e) => {
    const minutes = Number(e.target.value);
    if (minutes > 0) snoozeShield(minutes);
    e.target.value = '';
  };

  const handleResume = () => setShieldPaused(false);

  const handleAddWhitelist = () => {
    const domain = domainInput.trim();
    if (!domain) return;
    addWhitelistDomain(domain);
    setDomainInput('');
    setShowWhitelistInput(false);
  };

  // Still waiting for the first response
  if (!status) {
    return (
      <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
        <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
        Checking shield status…
      </div>
    );
  }

  if (!status.detected) {
    return (
      <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
        <ShieldOff className="w-3.5 h-3.5" />
        Extension Not Detected
      </div>
    );
  }

  const isPaused = status.extensionPaused;
  const minutesLeft = status.pauseUntilTimestamp
    ? Math.max(0, Math.round((status.pauseUntilTimestamp - Date.now()) / 60000))
    : null;

  return (
    <div className="flex items-center gap-3 flex-wrap font-mono text-xs">

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: isPaused ? 'var(--color-warning)' : 'var(--color-success)' }}
        />
        {isPaused ? (
          <ShieldAlert className="w-3.5 h-3.5" style={{ color: 'var(--color-warning)' }} />
        ) : (
          <Shield className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
        )}
        <span className="font-semibold" style={{ color: isPaused ? 'var(--color-warning)' : 'var(--color-success)' }}>
          {isPaused ? `Snoozed${minutesLeft !== null ? ` · ${minutesLeft}m left` : ''}` : 'Shield Active'}
        </span>
      </div>

      {/* Snooze / Resume control */}
      {isPaused ? (
        <button
          onClick={handleResume}
          className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
        >
          Resume Protection
        </button>
      ) : (
        <select
          defaultValue=""
          onChange={handleSnooze}
          className="bg-white/5 hover:bg-white/10 border border-white/10 rounded px-2 py-1 text-gray-300 cursor-pointer focus:outline-none"
        >
          <option value="" disabled>Snooze…</option>
          <option value="15">15 minutes</option>
          <option value="60">1 hour</option>
          <option value="1440">24 hours</option>
        </select>
      )}

      {/* Whitelist quick-add */}
      {showWhitelistInput ? (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddWhitelist()}
            placeholder="example.com"
            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white placeholder-gray-600 focus:outline-none focus:border-[var(--color-info)] w-[130px]"
          />
          <button
            onClick={handleAddWhitelist}
            className="px-2 py-1 rounded bg-[var(--color-info)]/10 hover:bg-[var(--color-info)]/20 border border-[var(--color-info)]/20 text-[var(--color-info)]"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowWhitelistInput(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <Globe className="w-3 h-3" /> <Plus className="w-3 h-3" /> Whitelist
        </button>
      )}
    </div>
  );
}
