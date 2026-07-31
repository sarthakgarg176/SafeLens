/**
 * domain-checker.js
 * Extracts the current page hostname and checks it against the
 * whitelist.json using exact matching, preventing spoofing bypass
 * techniques (e.g. domain.com.fake.com).
 *
 * Trust sources (merged):
 *   1. Static config/whitelist.json — bundled with the extension.
 *   2. Dynamic chrome.storage.local['safelens_whitelist'] — domains added
 *      live from the dashboard's "Whitelist" quick-add button
 *      (see ShieldStatusBar.jsx / extensionBridge.js / interceptor.js).
 */

window.SafeLensDomainChecker = (function () {
  const DYNAMIC_WHITELIST_KEY = 'safelens_whitelist';

  let whitelistCache = null;

  async function loadWhitelist() {
    if (whitelistCache) return whitelistCache;
    const url = chrome.runtime.getURL('config/whitelist.json');
    const response = await fetch(url);
    whitelistCache = await response.json();
    return whitelistCache;
  }

  async function loadDynamicWhitelist() {
    try {
      const stored = await chrome.storage.local.get([DYNAMIC_WHITELIST_KEY]);
      return stored[DYNAMIC_WHITELIST_KEY] || [];
    } catch (err) {
      console.warn('[SafeLensDomainChecker] Failed to read dynamic whitelist:', err);
      return [];
    }
  }

  function matchesPattern(hostname, pattern) {
    // pattern like "*.gov.in" -> must end with ".gov.in"
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(1); // ".gov.in"
      return hostname.endsWith(suffix);
    }
    return hostname === pattern;
  }

  async function isTrustedDomain() {
    const hostname = new URL(window.location.href).hostname;
    const { trustedDomains = [], trustedDomainPatterns = [] } = await loadWhitelist();
    const dynamicDomains = await loadDynamicWhitelist();

    const exactMatch =
      trustedDomains.includes(hostname) || dynamicDomains.includes(hostname);
    const patternMatch = trustedDomainPatterns.some((p) => matchesPattern(hostname, p));

    return exactMatch || patternMatch;
  }

  return { isTrustedDomain };
})();