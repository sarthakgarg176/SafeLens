/**
 * feature-flags.js
 * Manages chrome.storage.local toggles for the extension.
 */

const DEFAULT_SETTINGS_URL = chrome.runtime.getURL('config/default-settings.json');

export async function getSettings() {
  let defaults = {
    USE_NEW_AGENT: true,
    notificationsEnabled: true,
    notificationPosition: "top-right",
    notificationDurationMs: 3500,
    backendApiBaseUrl: "http://127.0.0.1:8000",
    legacyApiEndpoint: "/api/protect",
    newAgentApiEndpoint: "/api/protect"
  };

  try {
    const response = await fetch(DEFAULT_SETTINGS_URL);
    if (response.ok) {
      const fetchedDefaults = await response.json();
      defaults = { ...defaults, ...fetchedDefaults };
    }
  } catch (e) {
    console.warn('[feature-flags] Could not load default-settings.json:', e);
  }

  const stored = await chrome.storage.local.get(null);
  const merged = { ...defaults, ...(stored || {}) };

  if (merged.newAgentApiEndpoint === '/api/v2/process-upload') {
    merged.newAgentApiEndpoint = '/api/protect';
    await chrome.storage.local.set({ newAgentApiEndpoint: '/api/protect' });
  }

  if (!stored || Object.keys(stored).length === 0 || !stored.backendApiBaseUrl) {
    await chrome.storage.local.set(merged);
  }

  return merged;
}

export async function getFeatureFlag(flagName) {
  const settings = await getSettings();
  return settings[flagName];
}

export async function setFeatureFlag(flagName, value) {
  await chrome.storage.local.set({ [flagName]: value });
}