/**
 * pii-detector.js - Fast Local Heuristics & Regex Pre-filtering
 */

export function getRegexPatterns() {
  return {
    CREDIT_CARD: /(?:^|[^\d])((?:\d[ -]*?){13,16})(?:[^\d]|$)/g,
    PAN: /(?:^|[^A-Z0-9])([A-Z]{5}[0-9]{4}[A-Z]{1})(?=[^A-Z0-9]|$)/gi,
    PASSPORT: /(?:^|[^A-Z0-9])([A-PR-WYA-Z][0-9]{7})(?=[^A-Z0-9]|$)/gi,
    VOTER_ID: /(?:^|[^A-Z0-9])([A-Z]{3}[0-9]{7})(?=[^A-Z0-9]|$)/gi,
    PHONE: /(?:^|[^\d])(?:\+91[\s-]?)?([6-9]\d{9})(?:[^\d]|$)/g,
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    API_KEY: /(?:key|token|secret|api[_\-]?key)\s*[:=]\s*["']?[A-Za-z0-9\-_/+=]{16,}["']?/gi
  };
}

export function containsSensitiveKeywords(text = '') {
  if (!text) return false;
  const lower = text.toLowerCase();
  const keywords = ['card', 'credit', 'debit', 'passport', 'voter', 'license', 'tax', 'salary', 'password', 'secret'];
  return keywords.some(kw => lower.includes(kw));
}