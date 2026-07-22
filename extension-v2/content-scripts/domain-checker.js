/**
 * domain-checker.js
 * Extracts the current page hostname and checks it against the
 * whitelist.json using exact matching, preventing spoofing bypass
 * techniques (e.g. domain.com.fake.com).
 */

window.SafeLensDomainChecker = (function () {
  let whitelistCache = null;

  async function loadWhitelist() {
    if (whitelistCache) return whitelistCache;
    const url = chrome.runtime.getURL('config/whitelist.json');
    const response = await fetch(url);
    whitelistCache = await response.json();
    return whitelistCache;
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

    const exactMatch = trustedDomains.includes(hostname);
    const patternMatch = trustedDomainPatterns.some((p) => matchesPattern(hostname, p));

    return exactMatch || patternMatch;
  }

  return { isTrustedDomain };
})();