const n = {
  /**
   * Toggle or set extension settings in storage.
   */
  SET_SETTINGS: async (e) => {
    if (!e || typeof e != "object")
      throw new Error("Invalid settings payload");
    return await chrome.storage.local.set({ settings: e }), { success: !0 };
  },
  /**
   * Retrieve active extension settings from storage.
   */
  GET_SETTINGS: async () => (await chrome.storage.local.get("settings")).settings || {},
  /**
   * Log an intercepted upload scan result to session storage.
   */
  LOG_SCAN: async (e) => {
    if (!e || !e.scanId)
      throw new Error("Invalid scan log payload");
    const { scans: r = [] } = await chrome.storage.local.get("scans"), s = [e, ...r].slice(0, 100);
    return await chrome.storage.local.set({ scans: s }), { success: !0 };
  }
};
async function a(e, r) {
  try {
    if (!e || typeof e != "object")
      return { success: !1, error: "Malformed message: Message must be an object" };
    const { type: s, payload: t } = e;
    if (!s || typeof s != "string")
      return { success: !1, error: "Malformed message: Missing type property" };
    console.log(`[MessageRouter] Routing message type: ${s}`, { senderId: r.id, origin: r.origin });
    const o = n[s];
    return o ? { success: !0, data: await o(t, r) } : (console.warn(`[MessageRouter] Unknown message type: ${s}`), { success: !1, error: `Unknown message type: '${s}'` });
  } catch (s) {
    return console.error("[MessageRouter] Error routing message:", s), {
      success: !1,
      error: s instanceof Error ? s.message : "Internal background processing error"
    };
  }
}
const c = {
  protectionEnabled: !0,
  riskLevelThreshold: "medium",
  // low, medium, high
  autoRedact: !1,
  watermarkEnabled: !1,
  aiCloakEnabled: !1,
  allowedDomains: []
};
chrome.runtime.onInstalled.addListener(async (e) => {
  if (console.log(`[ServiceWorker] Extension installation event: ${e.reason}`), e.reason === "install")
    try {
      (await chrome.storage.local.get("settings")).settings || (await chrome.storage.local.set({
        settings: c,
        scans: []
        // Initialize scan log history
      }), console.log("[ServiceWorker] Default settings storage initialized."));
    } catch (r) {
      console.error("[ServiceWorker] Error initializing storage settings:", r);
    }
  else e.reason === "update" && console.log("[ServiceWorker] SafeLens successfully updated to new version.");
});
chrome.runtime.onMessage.addListener((e, r, s) => (a(e, r).then((t) => {
  s(t);
}).catch((t) => {
  console.error("[ServiceWorker] Message routing failure:", t), s({
    success: !1,
    error: t instanceof Error ? t.message : "Async processing exception"
  });
}), !0));
