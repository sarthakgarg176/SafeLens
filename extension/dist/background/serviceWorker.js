async function E(e, o = 1920, t = 1080) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let n = null, s = null;
  try {
    let { width: r, height: a } = e, g = !1;
    if (r > o && (a = Math.round(a * o / r), r = o, g = !0), a > t && (r = Math.round(r * t / a), a = t, g = !0), !g)
      return e;
    if (console.log(`[Resize] Scaling image down to ${r}x${a} using cv.resize`), typeof cv > "u" || !cv.matFromImageData)
      throw new Error("OpenCV.js runtime is not loaded");
    const c = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    n = cv.matFromImageData(c), s = new cv.Mat();
    const d = new cv.Size(r, a);
    cv.resize(n, s, d, 0, 0, cv.INTER_AREA);
    const l = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(r, a) : document.createElement("canvas");
    l.width = r, l.height = a;
    const h = l.getContext("2d"), u = new ImageData(new Uint8ClampedArray(s.data), s.cols, s.rows);
    return h.putImageData(u, 0, 0), l;
  } catch (r) {
    console.warn("[Resize] OpenCV resizing failed. Falling back to native canvas context scaling:", r);
    try {
      const { width: a, height: g } = e;
      let i = a, c = g;
      i > o && (c = Math.round(c * o / i), i = o), c > t && (i = Math.round(i * t / c), c = t);
      const d = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(i, c) : document.createElement("canvas");
      d.width = i, d.height = c;
      const l = d.getContext("2d");
      return l.imageSmoothingEnabled = !0, l.imageSmoothingQuality = "high", l.drawImage(e, 0, 0, i, c), d;
    } catch (a) {
      return console.error("[Resize] Native canvas resizing fallback failed. Returning original image.", a), e;
    }
  } finally {
    n && n.delete(), s && s.delete();
  }
}
async function k(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let o = null, t = null, n = null;
  try {
    if (typeof cv > "u" || !cv.cvtColor)
      throw new Error("OpenCV.js runtime is not loaded");
    const r = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    o = cv.matFromImageData(r), t = new cv.Mat(), cv.cvtColor(o, t, cv.COLOR_RGBA2GRAY), n = new cv.Mat(), cv.cvtColor(t, n, cv.COLOR_GRAY2RGBA);
    const a = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    a.width = e.width, a.height = e.height;
    const g = a.getContext("2d"), i = new ImageData(new Uint8ClampedArray(n.data), n.cols, n.rows);
    return g.putImageData(i, 0, 0), a;
  } catch (s) {
    console.warn("[Grayscale] OpenCV conversion failed. Falling back to native JS luminosity conversions:", s);
    try {
      const a = e.getContext("2d").getImageData(0, 0, e.width, e.height), g = a.data;
      for (let c = 0; c < g.length; c += 4) {
        const d = g[c], l = g[c + 1], h = g[c + 2], u = Math.round(0.299 * d + 0.587 * l + 0.114 * h);
        g[c] = u, g[c + 1] = u, g[c + 2] = u;
      }
      const i = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
      return i.width = e.width, i.height = e.height, i.getContext("2d").putImageData(a, 0, 0), i;
    } catch (r) {
      return console.error("[Grayscale] JS grayscale fallback failed. Returning original image.", r), e;
    }
  } finally {
    o && o.delete(), t && t.delete(), n && n.delete();
  }
}
async function O(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let o = null, t = null;
  try {
    if (typeof cv > "u" || !cv.GaussianBlur)
      throw new Error("OpenCV.js runtime is not loaded");
    const s = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    o = cv.matFromImageData(s), t = new cv.Mat();
    const r = new cv.Size(3, 3);
    cv.GaussianBlur(o, t, r, 0, 0, cv.BORDER_DEFAULT);
    const a = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    a.width = e.width, a.height = e.height;
    const g = a.getContext("2d"), i = new ImageData(new Uint8ClampedArray(t.data), t.cols, t.rows);
    return g.putImageData(i, 0, 0), a;
  } catch (n) {
    return console.warn("[Denoise] Denoising failed. Skipping this stage and returning original canvas:", n), e;
  } finally {
    o && o.delete(), t && t.delete();
  }
}
async function R(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let o = null, t = null, n = null, s = null, r = null, a = null;
  try {
    if (typeof cv > "u" || !cv.HoughLinesP)
      throw new Error("OpenCV.js runtime is not loaded");
    const i = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    o = cv.matFromImageData(i), t = new cv.Mat(), n = new cv.Mat(), s = new cv.Mat(), cv.cvtColor(o, t, cv.COLOR_RGBA2GRAY), cv.Canny(t, n, 50, 200, 3), cv.HoughLinesP(n, s, 1, Math.PI / 180, 100, 50, 10);
    let c = 0, d = 0;
    for (let f = 0; f < s.rows; ++f) {
      const y = s.data32S[f * 4], v = s.data32S[f * 4 + 1], I = s.data32S[f * 4 + 2], D = s.data32S[f * 4 + 3], m = Math.atan2(D - v, I - y) * (180 / Math.PI);
      m > -45 && m < 45 && (c += m, d++);
    }
    if (d < 3)
      return console.log("[Deskew] Insufficient line segments detected. Skipping deskew."), { canvas: e, angle: 0 };
    const l = c / d;
    if (Math.abs(l) < 0.5)
      return console.log(`[Deskew] Skew angle is negligible (${l.toFixed(2)} deg). Skipping rotation.`), { canvas: e, angle: 0 };
    console.log(`[Deskew] Correcting skew angle: ${l.toFixed(2)} degrees`);
    const h = new cv.Point(e.width / 2, e.height / 2);
    a = cv.getRotationMatrix2D(h, l, 1), r = new cv.Mat();
    const u = new cv.Size(e.width, e.height);
    cv.warpAffine(o, r, a, u, cv.INTER_CUBIC, cv.BORDER_REPLICATE);
    const w = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    w.width = e.width, w.height = e.height;
    const p = w.getContext("2d"), C = new ImageData(new Uint8ClampedArray(r.data), r.cols, r.rows);
    return p.putImageData(C, 0, 0), { canvas: w, angle: l };
  } catch (g) {
    return console.warn("[Deskew] Hough deskewing failed. Skipping this stage and returning original canvas:", g), { canvas: e, angle: 0 };
  } finally {
    o && o.delete(), t && t.delete(), n && n.delete(), s && s.delete(), r && r.delete(), a && a.delete();
  }
}
async function S(e, o = 127) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let t = null, n = null, s = null, r = null;
  try {
    if (typeof cv > "u" || !cv.adaptiveThreshold)
      throw new Error("OpenCV.js runtime is not loaded");
    const g = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(g), n = new cv.Mat(), cv.cvtColor(t, n, cv.COLOR_RGBA2GRAY), s = new cv.Mat(), cv.adaptiveThreshold(
      n,
      s,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      11,
      2
    ), r = new cv.Mat(), cv.cvtColor(s, r, cv.COLOR_GRAY2RGBA);
    const i = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    i.width = e.width, i.height = e.height;
    const c = i.getContext("2d"), d = new ImageData(new Uint8ClampedArray(r.data), r.cols, r.rows);
    return c.putImageData(d, 0, 0), i;
  } catch (a) {
    console.warn("[Threshold] OpenCV adaptive thresholding failed. Falling back to grayscale image:", a);
    try {
      return await x(e);
    } catch (g) {
      return console.error("[Threshold] Grayscale fallback failed. Returning original canvas.", g), e;
    }
  } finally {
    t && t.delete(), n && n.delete(), s && s.delete(), r && r.delete();
  }
}
async function x(e) {
  const t = e.getContext("2d").getImageData(0, 0, e.width, e.height), n = t.data;
  for (let r = 0; r < n.length; r += 4) {
    const a = Math.round(0.299 * n[r] + 0.587 * n[r + 1] + 0.114 * n[r + 2]);
    n[r] = a, n[r + 1] = a, n[r + 2] = a;
  }
  const s = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
  return s.width = e.width, s.height = e.height, s.getContext("2d").putImageData(t, 0, 0), s;
}
async function b(e, o = {}) {
  const {
    enableDenoise: t = !0,
    enableDeskew: n = !0,
    thresholdValue: s = 127,
    maxWidth: r = 1920,
    maxHeight: a = 1080
  } = o;
  console.log("[Preprocessor] Beginning OpenCV.js image preprocessing pipeline...");
  const g = Date.now();
  let i = e;
  try {
    try {
      i = await E(i, r, a);
    } catch (l) {
      console.warn("[Preprocessor] Resize stage failed. Continuing...", l);
    }
    try {
      i = await k(i);
    } catch (l) {
      console.warn("[Preprocessor] Grayscale stage failed. Continuing...", l);
    }
    if (t)
      try {
        i = await O(i);
      } catch (l) {
        console.warn("[Preprocessor] Denoise stage failed. Continuing...", l);
      }
    let c = 0;
    if (n)
      try {
        const l = await R(i);
        i = l.canvas, c = l.angle;
      } catch (l) {
        console.warn("[Preprocessor] Deskew stage failed. Continuing...", l);
      }
    try {
      i = await S(i, s);
    } catch (l) {
      console.warn("[Preprocessor] Threshold binarization stage failed. Continuing...", l);
    }
    const d = Date.now() - g;
    return console.log(`[Preprocessor] Pipeline resolved successfully in ${d}ms. Skew Angle: ${c.toFixed(2)} deg.`), i;
  } catch (c) {
    return console.error("[Preprocessor] Critical pipeline failure. Returning original image.", c), e;
  }
}
const M = {
  /**
   * Preprocesses intercepted image files using local OpenCV.js (WASM) inside the Service Worker.
   * Runs OffscreenCanvas operations completely isolated from host webpage scopes.
   */
  PREPROCESS_IMAGE: async (e) => {
    if (!e || !e.arrayBuffer)
      throw new Error("Invalid payload: arrayBuffer is required");
    await A();
    const { arrayBuffer: o, type: t, settings: n } = e, s = new Blob([o], { type: t || "image/png" }), r = await createImageBitmap(s), a = new OffscreenCanvas(r.width, r.height);
    a.getContext("2d").drawImage(r, 0, 0);
    const i = await b(a, n);
    return {
      arrayBuffer: await (await i.convertToBlob({ type: t || "image/png" })).arrayBuffer(),
      width: i.width,
      height: i.height
    };
  },
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
    const { scans: o = [] } = await chrome.storage.local.get("scans"), t = [e, ...o].slice(0, 100);
    return await chrome.storage.local.set({ scans: t }), { success: !0 };
  }
};
async function A() {
  if (!(typeof cv < "u" && cv.matFromImageData))
    return new Promise((e, o) => {
      let t = 0;
      const n = setInterval(() => {
        t++, typeof cv < "u" && cv.matFromImageData ? (clearInterval(n), e()) : t > 50 && (clearInterval(n), o(new Error("OpenCV.js WASM compilation timed out (5s)")));
      }, 100);
    });
}
async function T(e, o) {
  try {
    if (!e || typeof e != "object")
      return { success: !1, error: "Malformed message: Message must be an object" };
    const { type: t, payload: n } = e;
    if (!t || typeof t != "string")
      return { success: !1, error: "Malformed message: Missing type property" };
    console.log(`[MessageRouter] Routing message type: ${t}`, { senderId: o.id, origin: o.origin });
    const s = M[t];
    return s ? { success: !0, data: await s(n, o) } : (console.warn(`[MessageRouter] Unknown message type: ${t}`), { success: !1, error: `Unknown message type: '${t}'` });
  } catch (t) {
    return console.error("[MessageRouter] Error routing message:", t), {
      success: !1,
      error: t instanceof Error ? t.message : "Internal background processing error"
    };
  }
}
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
const B = {
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
        settings: B,
        scans: []
        // Initialize scan log history
      }), console.log("[ServiceWorker] Default settings storage initialized."));
    } catch (o) {
      console.error("[ServiceWorker] Error initializing storage settings:", o);
    }
  else e.reason === "update" && console.log("[ServiceWorker] SafeLens successfully updated to new version.");
});
chrome.runtime.onMessage.addListener((e, o, t) => (T(e, o).then((n) => {
  t(n);
}).catch((n) => {
  console.error("[ServiceWorker] Message routing failure:", n), t({
    success: !1,
    error: n instanceof Error ? n.message : "Async processing exception"
  });
}), !0));
