/**
 * Storage Service for SafeLens Chrome Extension
 * 
 * Responsibility:
 * - Abstracts all read, write, and clear operations on `chrome.storage.local`.
 * - Decouples React UI components from Chrome runtime API implementations.
 * - Handles event listener subscriptions for real-time storage changes.
 * - Aggregates scan stats (total scanned, secured threats count) so components do not perform calculations.
 * 
 * Interacts with:
 * - chrome.storage.local (Accesses Chrome API)
 * - extension/src/popup/Popup.jsx & Settings.jsx (Consumes these wrapper methods)
 */

const SETTINGS_KEY = 'settings';
const SCANS_KEY = 'scans';

// Default settings applied if none exist in storage
const DEFAULT_SETTINGS = {
  protectionEnabled: true,
  blurMode: 'redact',
  watermarkEnabled: false,
  aiCloakEnabled: false,
  riskLevelThreshold: 'medium',
};

// Mock data used strictly as a placeholder when no real scans exist yet
const PLACEHOLDER_SCAN = {
  fileName: 'passports_scan.png',
  size: 245760,
  riskLevel: 'high',
  confidence: 0.96,
  piiCount: 3,
  processingTime: 240,
  status: 'protected',
  detections: [
    { type: 'SSN', text: 'XXX-XX-3456', confidence: 0.99 },
    { type: 'EMAIL', text: 'admin@safelens.io', confidence: 0.94 },
    { type: 'CREDIT_CARD', text: 'XXXX-XXXX-XXXX-1111', confidence: 0.97 }
  ]
};

/**
 * Checks if the Chrome storage runtime is available.
 * @returns {boolean}
 */
function isChromeStorageAvailable() {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
}

/**
 * Fetch settings from storage.
 * @returns {Promise<Object>} The settings object
 */
export async function getSettings() {
  try {
    if (!isChromeStorageAvailable()) {
      return { ...DEFAULT_SETTINGS };
    }
    const data = await chrome.storage.local.get(SETTINGS_KEY);
    return data[SETTINGS_KEY] || { ...DEFAULT_SETTINGS };
  } catch (error) {
    console.error('[StorageService] Error getting settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Persist settings to storage.
 * @param {Object} settings - Complete settings object
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  try {
    if (!isChromeStorageAvailable()) {
      return;
    }
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  } catch (error) {
    console.error('[StorageService] Error saving settings:', error);
    throw error;
  }
}

/**
 * Fetch scan history from storage.
 * If empty and loadPlaceholder is true, returns a placeholder mock item.
 * @param {boolean} [loadPlaceholder=true] - Toggle to populate initial UI
 * @returns {Promise<Object[]>} List of scan records
 */
export async function getScans(loadPlaceholder = true) {
  try {
    if (!isChromeStorageAvailable()) {
      return loadPlaceholder ? [PLACEHOLDER_SCAN] : [];
    }
    const data = await chrome.storage.local.get(SCANS_KEY);
    const scans = data[SCANS_KEY] || [];
    
    if (scans.length === 0 && loadPlaceholder) {
      return [PLACEHOLDER_SCAN];
    }
    return scans;
  } catch (error) {
    console.error('[StorageService] Error getting scans:', error);
    return loadPlaceholder ? [PLACEHOLDER_SCAN] : [];
  }
}

/**
 * Calculates pre-aggregated scan statistics.
 * @param {Object[]} scans - Collection of scan logs
 * @returns {{ totalScanned: number, secured: number }} Statistics metadata
 */
export function calculateStats(scans) {
  if (!Array.isArray(scans)) {
    return { totalScanned: 0, secured: 0 };
  }
  
  const totalScanned = scans.length;
  // Count protected and blocked uploads as secured
  const secured = scans.filter(
    (s) => s.status === 'protected' || s.status === 'blocked'
  ).length;

  return { totalScanned, secured };
}

/**
 * Clears all scan history.
 * @returns {Promise<void>}
 */
export async function clearScans() {
  try {
    if (!isChromeStorageAvailable()) {
      return;
    }
    await chrome.storage.local.set({ [SCANS_KEY]: [] });
  } catch (error) {
    console.error('[StorageService] Error clearing scans:', error);
    throw error;
  }
}

/**
 * Subscribes a callback to change events in chrome storage.
 * Returns an unbind function.
 * 
 * @param {function(Object): void} onSettingsChange - Fired when settings modify
 * @param {function(Object[]): void} onScansChange - Fired when scans modify
 * @returns {function(): void} Unbind function
 */
export function subscribeToStorage(onSettingsChange, onScansChange) {
  if (!isChromeStorageAvailable() || typeof chrome.storage.onChanged === 'undefined') {
    return () => {};
  }

  const listener = (changes, areaName) => {
    if (areaName === 'local') {
      if (changes[SETTINGS_KEY] && typeof onSettingsChange === 'function') {
        onSettingsChange(changes[SETTINGS_KEY].newValue || DEFAULT_SETTINGS);
      }
      if (changes[SCANS_KEY] && typeof onScansChange === 'function') {
        onScansChange(changes[SCANS_KEY].newValue || []);
      }
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}
