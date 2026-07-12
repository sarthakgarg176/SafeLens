import { initialize } from './domObserver.js';

/**
 * SafeLens Content Script Entry Point
 * 
 * Responsibility:
 * - Bootstraps the DOM Observers and listeners.
 * - Manages extension content-side startup hooks.
 * 
 * Interacts with:
 * - extension/src/content/domObserver.js (Orchestrates element scanning and events)
 */

console.log('[SafeLens] Content Script successfully injected.');

try {
  // Initialize the DOM observer
  initialize();
} catch (error) {
  console.error('[SafeLens] Failed to initialize content observers:', error);
}
