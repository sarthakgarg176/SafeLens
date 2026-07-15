import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../services/storageService.js';

/**
 * Settings Component
 * 
 * Responsibility:
 * - Displays configuration fields for privacy scanning and visual protection parameters.
 * - Handles toggles for: Active Protection, Redaction Style (Solid/Blur), Watermarking, and AI Cloaking.
 * - Manages selection of Risk Sensitivity Thresholds (Low, Medium, High).
 * - Utilizes the storageService layer to read and persist preferences.
 * 
 * Interacts with:
 * - extension/src/services/storageService.js (Handles storage operations)
 * - extension/src/popup/Popup.jsx (Renders when settings tab is active)
 */
export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    protectionEnabled: true,
    blurMode: 'redact',
    watermarkEnabled: false,
    aiCloakEnabled: false,
    riskLevelThreshold: 'medium',
  });

  // Load settings on component mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const storedSettings = await getSettings();
        setSettings(storedSettings);
      } catch (err) {
        console.warn('[SettingsUI] Failed to load configuration:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Updates specific config key and pushes state update to storage
  const updateSetting = async (key, value) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);

    try {
      await saveSettings(updatedSettings);
      console.log(`[SettingsUI] Persisted updated config: ${key} -> ${value}`);
    } catch (err) {
      console.error('[SettingsUI] Failed to persist settings:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-cyan"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in text-xs text-brand-textMain">
      <div className="flex justify-between items-center pb-2 border-b border-brand-border/40">
        <h3 className="text-sm font-bold text-brand-textBright">Protection Control System</h3>
        <span className="text-[10px] text-brand-textDim uppercase font-mono">Preferences</span>
      </div>

      {/* Global toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-brand-border/30 bg-brand-surface/30">
        <div>
          <p className="font-bold text-brand-textBright">Active Privacy Shield</p>
          <p className="text-[10px] text-brand-textDim">Intercept and scan file uploads on web page inputs</p>
        </div>
        <button
          onClick={() => updateSetting('protectionEnabled', !settings.protectionEnabled)}
          className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
            settings.protectionEnabled ? 'bg-brand-cyan' : 'bg-brand-border'
          }`}
        >
          <div
            className={`bg-brand-surface w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
              settings.protectionEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Settings list - disabled if global protection is off */}
      <div className={`space-y-3 transition-opacity duration-200 ${!settings.protectionEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
        
        {/* Redaction Style */}
        <div className="space-y-2">
          <label className="font-bold text-brand-textBright">Redaction Masking Style</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateSetting('blurMode', 'redact')}
              className={`p-2.5 rounded-lg border text-center font-semibold transition-all duration-200 ${
                settings.blurMode === 'redact'
                  ? 'border-brand-cyan bg-brand-cyan/5 text-brand-cyan'
                  : 'border-brand-border/40 bg-brand-surface/20 text-brand-textMain hover:border-brand-border'
              }`}
            >
              ⬛ Solid Block
            </button>
            <button
              onClick={() => updateSetting('blurMode', 'blur')}
              className={`p-2.5 rounded-lg border text-center font-semibold transition-all duration-200 ${
                settings.blurMode === 'blur'
                  ? 'border-brand-cyan bg-brand-cyan/5 text-brand-cyan'
                  : 'border-brand-border/40 bg-brand-surface/20 text-brand-textMain hover:border-brand-border'
              }`}
            >
              ░░ Pixelate Blur
            </button>
          </div>
        </div>

        {/* Protection Toggles */}
        <div className="p-3 rounded-xl border border-brand-border/30 bg-brand-surface/30 space-y-3.5">
          {/* Watermark toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-brand-textBright">Invisible Ownership Watermark</p>
              <p className="text-[10px] text-brand-textDim">Embed secure DCT watermarks in image frequencies</p>
            </div>
            <button
              onClick={() => updateSetting('watermarkEnabled', !settings.watermarkEnabled)}
              className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                settings.watermarkEnabled ? 'bg-brand-purple' : 'bg-brand-border'
              }`}
            >
              <div
                className={`bg-brand-surface w-3 h-3 rounded-full shadow-md transform transition-transform duration-200 ${
                  settings.watermarkEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* AI Cloak toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-brand-textBright">Adversarial AI Cloaking</p>
              <p className="text-[10px] text-brand-textDim">Poison image pixels to disrupt scraping AI models</p>
            </div>
            <button
              onClick={() => updateSetting('aiCloakEnabled', !settings.aiCloakEnabled)}
              className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                settings.aiCloakEnabled ? 'bg-brand-purple' : 'bg-brand-border'
              }`}
            >
              <div
                className={`bg-brand-surface w-3 h-3 rounded-full shadow-md transform transition-transform duration-200 ${
                  settings.aiCloakEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Sensitivity slider */}
        <div className="space-y-1.5 p-3 rounded-xl border border-brand-border/30 bg-brand-surface/30">
          <div className="flex justify-between items-center">
            <span className="font-bold text-brand-textBright">PII Scanning Sensitivity</span>
            <span className="text-[10px] font-bold text-brand-cyan uppercase bg-brand-cyan/10 px-2 py-0.5 rounded">
              {settings.riskLevelThreshold}
            </span>
          </div>
          <p className="text-[10px] text-brand-textDim mb-2">Adjusts threshold to classification alert rules</p>
          <div className="flex gap-2">
            {['low', 'medium', 'high'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => updateSetting('riskLevelThreshold', lvl)}
                className={`flex-1 py-1.5 rounded-lg border text-center font-bold transition-all duration-200 ${
                  settings.riskLevelThreshold === lvl
                    ? 'border-brand-purple bg-brand-purpleGlow text-brand-purple'
                    : 'border-brand-border/40 bg-brand-surface/20 hover:border-brand-border'
                }`}
              >
                {lvl.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
