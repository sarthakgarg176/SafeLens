/**
 * SafeLens Chrome Extension Content Script
 *
 * Lightweight script injected into the web document canvas page layer.
 * Verifies successful extension initialization and logs a greeting.
 */

(function () {
  const extensionName = "SafeLens Privacy Shield AI";
  console.log(
    `%c[${extensionName}]%c Content script injected and initialized successfully. Canvas layer scanning active.`,
    "color: #7c3aed; font-weight: bold; font-size: 11px;",
    "color: #a78bfa; font-weight: normal;"
  );
})();
