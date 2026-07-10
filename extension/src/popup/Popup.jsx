import React, { useState, useEffect } from 'react';
import Settings from './Settings';
import ScanSummary from './ScanSummary';
import { 
  getSettings, 
  getScans, 
  calculateStats, 
  clearScans, 
  saveSettings, 
  subscribeToStorage 
} from '../services/storageService.js';

/**
 * Popup Root React Component
 * 
 * Responsibility:
 * - Coordinates view states (Home, Scan Report, Settings).
 * - Displays active protection switches, status headers, and statistics counters.
 * - Consumes the storageService layer to retrieve data, subscribe to updates, and clear logs.
 * - Never performs raw metrics math or direct chrome.storage execution.
 * 
 * Interacts with:
 * - extension/src/popup/Settings.jsx
 * - extension/src/popup/ScanSummary.jsx
 * - extension/src/services/storageService.js (Decouples data operations)
 */
export default function Popup() {
  const [activeTab, setActiveTab] = useState('home'); // home, settings, summary
  const [protectionEnabled, setProtectionEnabled] = useState(true);
  const [recentScan, setRecentScan] = useState(null);
  const [stats, setStats] = useState({ totalScanned: 0, secured: 0 });

  // Load state and subscribe to changes in chrome.storage
  useEffect(() => {
    async function loadData() {
      try {
        const storedSettings = await getSettings();
        setProtectionEnabled(storedSettings.protectionEnabled !== false);

        // Retrieve scan logs, allowing placeholder seed data if history is empty
        const scanHistory = await getScans(true);
        if (scanHistory.length > 0) {
          setRecentScan(scanHistory[0]);
          
          // Delegate statistics aggregation calculation to storage service
          const currentStats = calculateStats(scanHistory);
          setStats(currentStats);
        }
      } catch (err) {
        console.warn('[Popup] Failed to load local extension details:', err);
      }
    }

    loadData();

    // Subscribe to storage changes using the storage service wrapper
    const unsubscribe = subscribeToStorage(
      (newSettings) => {
        setProtectionEnabled(newSettings.protectionEnabled !== false);
      },
      (newScans) => {
        if (newScans.length > 0) {
          setRecentScan(newScans[0]);
          const currentStats = calculateStats(newScans);
          setStats(currentStats);
        } else {
          setRecentScan(null);
          setStats({ totalScanned: 0, secured: 0 });
        }
      }
    );

    // Return the clean unbind listener
    return unsubscribe;
  }, []);

  // Toggles the extension protection state directly from Home tab
  const toggleShield = async () => {
    try {
      const nextState = !protectionEnabled;
      setProtectionEnabled(nextState);

      const currentSettings = await getSettings();
      await saveSettings({ ...currentSettings, protectionEnabled: nextState });
    } catch (e) {
      console.error('[Popup] Failed to toggle active shield:', e);
    }
  };

  // Clears simulated history logs
  const clearHistory = async () => {
    try {
      await clearScans();
      setRecentScan(null);
      setStats({ totalScanned: 0, secured: 0 });
    } catch (e) {
      console.error('[Popup] Failed to wipe logs:', e);
    }
  };

  return (
    <div className="w-[340px] m-2.5 bg-gradient-to-b from-brand-surface to-brand-bg border border-brand-border/60 rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[440px] select-none">
      
      {/* Decorative top grid glow */}
      <div className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] bg-brand-purpleGlow rounded-full blur-[80px] pointer-events-none" />

      {/* Header section */}
      <header className="flex items-center justify-between border-b border-brand-border/40 pb-3 z-10">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${protectionEnabled ? 'bg-brand-cyan shadow-cyan animate-pulse' : 'bg-brand-textDim'}`} />
          <h1 className="text-lg font-extrabold tracking-wide bg-gradient-to-r from-brand-cyan to-brand-blue bg-clip-text text-transparent">
            SafeLens
          </h1>
        </div>
        <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-purpleGlow border border-brand-purple/20 text-brand-purple">
          SHIELD ACTIVE
        </span>
      </header>

      {/* Main content body */}
      <main className="flex-1 my-4 z-10">
        {activeTab === 'home' && (
          <div className="space-y-4 animate-fade-in">
            {/* Active Shield Widget */}
            <div className="flex flex-col items-center py-2 bg-brand-surface/20 rounded-xl border border-brand-border/20 shadow-inner">
              <button
                onClick={toggleShield}
                className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl transition-all duration-300 ${
                  protectionEnabled 
                    ? 'border-brand-cyan bg-brand-cyan/10 shadow-cyan text-brand-cyan hover:bg-brand-cyan/20'
                    : 'border-brand-border bg-brand-bg text-brand-textDim hover:border-brand-textDim'
                }`}
              >
                🛡️
              </button>
              <h3 className="text-xs font-bold text-brand-textBright mt-3">
                {protectionEnabled ? 'Shield Engaged' : 'Shield Suspended'}
              </h3>
              <p className="text-[10px] text-brand-textDim mt-0.5">
                {protectionEnabled ? 'Scanning all outbound media uploads' : 'Outbound media passing unscanned'}
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-brand-surface/40 border border-brand-border/20 rounded-xl">
                <span className="text-[9px] font-bold text-brand-textDim uppercase tracking-wide">Files Scanned</span>
                <p className="text-lg font-extrabold text-brand-textBright mt-0.5">{stats.totalScanned}</p>
              </div>
              <div className="p-3 bg-brand-surface/40 border border-brand-border/20 rounded-xl">
                <span className="text-[9px] font-bold text-brand-textDim uppercase tracking-wide">Threats Secured</span>
                <p className="text-lg font-extrabold text-brand-cyan mt-0.5">{stats.secured}</p>
              </div>
            </div>

            {/* Recent Scan segment link */}
            {recentScan ? (
              <div 
                onClick={() => setActiveTab('summary')}
                className="p-3 bg-brand-surface/40 hover:bg-brand-surface-hover/50 border border-brand-border/20 rounded-xl flex justify-between items-center cursor-pointer transition-all duration-200"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base">📄</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-brand-textDim uppercase font-bold tracking-wider">Latest Incident</p>
                    <p className="text-xs font-bold text-brand-textBright truncate w-[160px]">{recentScan.fileName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    recentScan.riskLevel === 'high' ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                  }`}>
                    {recentScan.riskLevel.toUpperCase()}
                  </span>
                  <span className="text-brand-cyan font-bold text-xs">→</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-brand-border/40 text-center text-xs text-brand-textDim">
                No outbound upload logs available.
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && <Settings />}
        {activeTab === 'summary' && <ScanSummary scanRecord={recentScan} onBack={() => setActiveTab('home')} />}
      </main>

      {/* Navigation Footer Tab Bar */}
      <footer className="flex items-center justify-around border-t border-brand-border/40 pt-3.5 mt-2 z-10">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'home' ? 'text-brand-cyan' : 'text-brand-textDim hover:text-brand-textMain'
          }`}
        >
          <span className="text-base">🏠</span>
          <span className="text-[9px] font-bold">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === 'settings' ? 'text-brand-cyan' : 'text-brand-textDim hover:text-brand-textMain'
          }`}
        >
          <span className="text-base">⚙️</span>
          <span className="text-[9px] font-bold">Settings</span>
        </button>

        {recentScan && (
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'summary' ? 'text-brand-cyan' : 'text-brand-textDim hover:text-brand-textMain'
            }`}
          >
            <span className="text-base">📊</span>
            <span className="text-[9px] font-bold">Report</span>
          </button>
        )}

        <button
          onClick={clearHistory}
          className="flex flex-col items-center gap-1 text-brand-textDim hover:text-brand-red/80 transition-colors"
          title="Wipe Intercept Logs"
        >
          <span className="text-base">🗑️</span>
          <span className="text-[9px] font-bold">Reset</span>
        </button>
      </footer>

    </div>
  );
}
