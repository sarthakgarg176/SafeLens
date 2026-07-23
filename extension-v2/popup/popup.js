document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('useNewAgentToggle');
  const statusText = document.getElementById('statusText');

  const stored = await chrome.storage.local.get('USE_NEW_AGENT');
  toggle.checked = !!stored.USE_NEW_AGENT;

  toggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ USE_NEW_AGENT: toggle.checked });
    statusText.textContent = toggle.checked
      ? 'Agentic Engine Enabled'
      : 'Legacy Rules Engine Active';
  });
});