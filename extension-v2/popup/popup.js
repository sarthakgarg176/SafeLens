document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('useNewAgentToggle');
  const statusText = document.getElementById('statusText');
  const statusDot = document.getElementById('statusDot');
  const durationSelect = document.getElementById('pauseDurationSelect');
  const pauseBtn = document.getElementById('pauseActionBtn');
  const countdownDisplay = document.getElementById('countdownDisplay');

  let timerInterval = null;

  function formatTimeRemaining(ms) {
    if (ms <= 0) return 'Resuming now...';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    parts.push(`${seconds.toString().padStart(2, '0')}s`);

    return `SafeLens Paused: Resuming in ${parts.join(' ')}`;
  }

  async function updateUI() {
    const stored = await chrome.storage.local.get(['USE_NEW_AGENT', 'extensionPaused', 'pauseUntilTimestamp']);
    
    toggle.checked = !!stored.USE_NEW_AGENT;

    let isPaused = !!stored.extensionPaused;
    const pauseUntil = stored.pauseUntilTimestamp || null;

    if (isPaused && pauseUntil && Date.now() >= pauseUntil) {
      // Auto expired
      await chrome.storage.local.set({ extensionPaused: false, pauseUntilTimestamp: null });
      if (typeof chrome !== 'undefined' && chrome.alarms) {
        chrome.alarms.clear('safelens_auto_reactivate');
      }
      isPaused = false;
    }

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    if (isPaused) {
      statusDot.className = 'safelens-status-dot safelens-status-dot--warning';
      statusText.textContent = 'SafeLens Protection Paused';
      pauseBtn.textContent = 'Resume Protection Now';
      pauseBtn.classList.add('active-resume');
      durationSelect.disabled = true;

      countdownDisplay.style.display = 'block';

      if (pauseUntil) {
        countdownDisplay.textContent = formatTimeRemaining(pauseUntil - Date.now());
        timerInterval = setInterval(() => {
          const remaining = pauseUntil - Date.now();
          if (remaining <= 0) {
            updateUI();
          } else {
            countdownDisplay.textContent = formatTimeRemaining(remaining);
          }
        }, 1000);
      } else {
        countdownDisplay.textContent = 'SafeLens Paused Indefinitely';
      }
    } else {
      statusDot.className = 'safelens-status-dot';
      statusText.textContent = stored.USE_NEW_AGENT
        ? 'Agentic Engine Enabled'
        : 'Protection Active';
      pauseBtn.textContent = 'Pause Protection';
      pauseBtn.classList.remove('active-resume');
      durationSelect.disabled = false;
      countdownDisplay.style.display = 'none';
    }
  }

  // Toggle handler
  toggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ USE_NEW_AGENT: toggle.checked });
    updateUI();
  });

  // Pause / Resume Button handler
  pauseBtn.addEventListener('click', async () => {
    const stored = await chrome.storage.local.get(['extensionPaused', 'pauseUntilTimestamp']);
    let isPaused = !!stored.extensionPaused;
    const pauseUntil = stored.pauseUntilTimestamp || null;

    if (isPaused && (!pauseUntil || Date.now() < pauseUntil)) {
      // User clicked Resume
      await chrome.storage.local.set({ extensionPaused: false, pauseUntilTimestamp: null });
      if (typeof chrome !== 'undefined' && chrome.alarms) {
        chrome.alarms.clear('safelens_auto_reactivate');
      }
    } else {
      // User clicked Pause
      const selVal = durationSelect.value;
      let durationMs = null;

      if (selVal === '30m') durationMs = 30 * 60 * 1000;
      else if (selVal === '1h') durationMs = 60 * 60 * 1000;
      else if (selVal === '1d') durationMs = 24 * 60 * 60 * 1000;

      const targetTimestamp = durationMs ? Date.now() + durationMs : null;

      await chrome.storage.local.set({
        extensionPaused: true,
        pauseUntilTimestamp: targetTimestamp
      });

      if (typeof chrome !== 'undefined' && chrome.alarms) {
        chrome.alarms.clear('safelens_auto_reactivate');
        if (targetTimestamp) {
          chrome.alarms.create('safelens_auto_reactivate', { when: targetTimestamp });
        }
      }
    }

    updateUI();
  });

  // Listen for storage changes from background or other tabs
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.extensionPaused !== undefined || changes.pauseUntilTimestamp !== undefined || changes.USE_NEW_AGENT !== undefined) {
        updateUI();
      }
    }
  });

  // Initial load
  updateUI();
});