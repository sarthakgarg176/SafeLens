/**
 * feature-flags.js
 * Manages chrome.storage.local toggles for the extension.
 */

const DEFAULT_SETTINGS_URL = chrome.runtime.getURL('config/default-settings.json');

export async function getSettings() {
  const stored = await chrome.storage.local.get(null);

  if (stored && Object.keys(stored).length > 0) {
    if (stored.newAgentApiEndpoint === '/api/v2/process-upload') {
      stored.newAgentApiEndpoint = '/api/protect';
      await chrome.storage.local.set({ newAgentApiEndpoint: '/api/protect' });
    }
    return stored;
  }

  // First run - load defaults and persist them
  const response = await fetch(DEFAULT_SETTINGS_URL);
  const defaults = await response.json();
  await chrome.storage.local.set(defaults);
  return defaults;
}

export async function getFeatureFlag(flagName) {
  const settings = await getSettings();
  return settings[flagName];
}

export async function setFeatureFlag(flagName, value) {
  await chrome.storage.local.set({ [flagName]: value });
}