const t = {
  protectionEnabled: !0,
  riskLevelThreshold: "medium",
  // low, medium, high
  autoRedact: !1,
  autoProtect: !1,
  watermarkEnabled: !1,
  aiCloakEnabled: !1,
  allowedDomains: [],
  blurMode: "redact"
};
self.Module = {
  onRuntimeInitialized: () => {
    console.log("[ServiceWorker] OpenCV.js (WASM) initialized successfully.");
  }
};
try {
  importScripts("/opencv.js");
} catch (e) {
  console.error("[ServiceWorker] Failed to load OpenCV.js:", e);
}
const { routeMessage: i } = await import("./messageRouter-GIxH8I4E.js");
chrome.runtime.onInstalled.addListener(async (e) => {
  if (console.log(`[ServiceWorker] Extension installation event: ${e.reason}`), e.reason === "install")
    try {
      (await chrome.storage.local.get("settings")).settings || (await chrome.storage.local.set({
        settings: t,
        scans: []
        // Initialize scan log history
      }), console.log("[ServiceWorker] Default settings storage initialized."));
    } catch (o) {
      console.error("[ServiceWorker] Error initializing storage settings:", o);
    }
  else e.reason === "update" && console.log("[ServiceWorker] SafeLens successfully updated to new version.");
});
chrome.runtime.onMessage.addListener((e, o, s) => (i(e, o).then((r) => {
  s(r);
}).catch((r) => {
  console.error("[ServiceWorker] Message routing failure:", r), s({
    success: !1,
    error: r instanceof Error ? r.message : "Async processing exception"
  });
}), !0));
