/**
 * toast-injector.js
 * Renders a passive, semi-transparent glassmorphism toast notification
 * inside a shadow DOM (so host page CSS cannot break its styling).
 * Auto-fades after 3-4 seconds. No user interaction required.
 */

(function () {
  let shadowHost = null;
  let shadowRoot = null;

  function ensureShadowHost() {
    if (shadowHost) return shadowRoot;

    shadowHost = document.createElement('div');
    shadowHost.id = 'safelens-toast-host';
    shadowHost.style.position = 'fixed';
    shadowHost.style.top = '0';
    shadowHost.style.left = '0';
    shadowHost.style.width = '0';
    shadowHost.style.height = '0';
    shadowHost.style.zIndex = '2147483647'; // max z-index

    document.documentElement.appendChild(shadowHost);
    shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('styles/toast.css');
    shadowRoot.appendChild(styleLink);

    return shadowRoot;
  }

  function showToast({ status = 'success', message = 'Data auto-protected & uploaded securely.' }) {
    const root = ensureShadowHost();

    const iconMap = {
      success: 'shield-protected.svg',
      warning: 'shield-warning.svg',
      error: 'shield-error.svg'
    };

    const toast = document.createElement('div');
    toast.className = `safelens-toast safelens-toast--${status} safelens-toast--slide-in`;
    toast.innerHTML = `
      <img class="safelens-toast__icon" src="${chrome.runtime.getURL(
        'assets/icons/' + (iconMap[status] || iconMap.success)
      )}" alt="" />
      <span class="safelens-toast__text">${message}</span>
    `;

    root.appendChild(toast);

    // Auto fade-out after 3.5s, then remove from DOM
    setTimeout(() => {
      toast.classList.remove('safelens-toast--slide-in');
      toast.classList.add('safelens-toast--fade-out');
      setTimeout(() => toast.remove(), 500);
    }, 3500);
  }

  window.addEventListener('safelens:notify', (e) => {
    showToast(e.detail);
  });
})();