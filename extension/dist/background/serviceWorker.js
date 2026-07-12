const ke = {
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
async function Me(e, t = 1920, n = 1080) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let r = null, o = null;
  try {
    let { width: a, height: s } = e, l = !1;
    if (a > t && (s = Math.round(s * t / a), a = t, l = !0), s > n && (a = Math.round(a * n / s), s = n, l = !0), !l)
      return e;
    if (console.log(`[Resize] Scaling image down to ${a}x${s} using cv.resize`), typeof cv > "u" || !cv.matFromImageData)
      throw new Error("OpenCV.js runtime is not loaded");
    const h = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    r = cv.matFromImageData(h), o = new cv.Mat();
    const m = new cv.Size(a, s);
    cv.resize(r, o, m, 0, 0, cv.INTER_AREA);
    const i = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(a, s) : document.createElement("canvas");
    i.width = a, i.height = s;
    const f = i.getContext("2d"), p = new ImageData(new Uint8ClampedArray(o.data), o.cols, o.rows);
    return f.putImageData(p, 0, 0), i;
  } catch (a) {
    console.warn("[Resize] OpenCV resizing failed. Falling back to native canvas context scaling:", a);
    try {
      const { width: s, height: l } = e;
      let c = s, h = l;
      c > t && (h = Math.round(h * t / c), c = t), h > n && (c = Math.round(c * n / h), h = n);
      const m = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(c, h) : document.createElement("canvas");
      m.width = c, m.height = h;
      const i = m.getContext("2d");
      return i.imageSmoothingEnabled = !0, i.imageSmoothingQuality = "high", i.drawImage(e, 0, 0, c, h), m;
    } catch (s) {
      return console.error("[Resize] Native canvas resizing fallback failed. Returning original image.", s), e;
    }
  } finally {
    r && r.delete(), o && o.delete();
  }
}
async function Te(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let t = null, n = null, r = null;
  try {
    if (typeof cv > "u" || !cv.cvtColor)
      throw new Error("OpenCV.js runtime is not loaded");
    const a = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(a), n = new cv.Mat(), cv.cvtColor(t, n, cv.COLOR_RGBA2GRAY), r = new cv.Mat(), cv.cvtColor(n, r, cv.COLOR_GRAY2RGBA);
    const s = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    s.width = e.width, s.height = e.height;
    const l = s.getContext("2d"), c = new ImageData(new Uint8ClampedArray(r.data), r.cols, r.rows);
    return l.putImageData(c, 0, 0), s;
  } catch (o) {
    console.warn("[Grayscale] OpenCV conversion failed. Falling back to native JS luminosity conversions:", o);
    try {
      const s = e.getContext("2d").getImageData(0, 0, e.width, e.height), l = s.data;
      for (let h = 0; h < l.length; h += 4) {
        const m = l[h], i = l[h + 1], f = l[h + 2], p = Math.round(0.299 * m + 0.587 * i + 0.114 * f);
        l[h] = p, l[h + 1] = p, l[h + 2] = p;
      }
      const c = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
      return c.width = e.width, c.height = e.height, c.getContext("2d").putImageData(s, 0, 0), c;
    } catch (a) {
      return console.error("[Grayscale] JS grayscale fallback failed. Returning original image.", a), e;
    }
  } finally {
    t && t.delete(), n && n.delete(), r && r.delete();
  }
}
async function De(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let t = null, n = null;
  try {
    if (typeof cv > "u" || !cv.GaussianBlur)
      throw new Error("OpenCV.js runtime is not loaded");
    const o = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(o), n = new cv.Mat();
    const a = new cv.Size(3, 3);
    cv.GaussianBlur(t, n, a, 0, 0, cv.BORDER_DEFAULT);
    const s = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    s.width = e.width, s.height = e.height;
    const l = s.getContext("2d"), c = new ImageData(new Uint8ClampedArray(n.data), n.cols, n.rows);
    return l.putImageData(c, 0, 0), s;
  } catch (r) {
    return console.warn("[Denoise] Denoising failed. Skipping this stage and returning original canvas:", r), e;
  } finally {
    t && t.delete(), n && n.delete();
  }
}
async function Oe(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let t = null, n = null, r = null, o = null, a = null, s = null;
  try {
    if (typeof cv > "u" || !cv.HoughLinesP)
      throw new Error("OpenCV.js runtime is not loaded");
    const c = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(c), n = new cv.Mat(), r = new cv.Mat(), o = new cv.Mat(), cv.cvtColor(t, n, cv.COLOR_RGBA2GRAY), cv.Canny(n, r, 50, 200, 3), cv.HoughLinesP(r, o, 1, Math.PI / 180, 100, 50, 10);
    let h = 0, m = 0;
    for (let C = 0; C < o.rows; ++C) {
      const v = o.data32S[C * 4], k = o.data32S[C * 4 + 1], T = o.data32S[C * 4 + 2], D = o.data32S[C * 4 + 3], R = Math.atan2(D - k, T - v) * (180 / Math.PI);
      R > -45 && R < 45 && (h += R, m++);
    }
    if (m < 3)
      return console.log("[Deskew] Insufficient line segments detected. Skipping deskew."), { canvas: e, angle: 0 };
    const i = h / m;
    if (Math.abs(i) < 0.5)
      return console.log(`[Deskew] Skew angle is negligible (${i.toFixed(2)} deg). Skipping rotation.`), { canvas: e, angle: 0 };
    console.log(`[Deskew] Correcting skew angle: ${i.toFixed(2)} degrees`);
    const f = new cv.Point(e.width / 2, e.height / 2);
    s = cv.getRotationMatrix2D(f, i, 1), a = new cv.Mat();
    const p = new cv.Size(e.width, e.height);
    cv.warpAffine(t, a, s, p, cv.INTER_CUBIC, cv.BORDER_REPLICATE);
    const I = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    I.width = e.width, I.height = e.height;
    const A = I.getContext("2d"), S = new ImageData(new Uint8ClampedArray(a.data), a.cols, a.rows);
    return A.putImageData(S, 0, 0), { canvas: I, angle: i };
  } catch (l) {
    return console.warn("[Deskew] Hough deskewing failed. Skipping this stage and returning original canvas:", l), { canvas: e, angle: 0 };
  } finally {
    t && t.delete(), n && n.delete(), r && r.delete(), o && o.delete(), a && a.delete(), s && s.delete();
  }
}
async function Re(e, t = 127) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let n = null, r = null, o = null, a = null;
  try {
    if (typeof cv > "u" || !cv.adaptiveThreshold)
      throw new Error("OpenCV.js runtime is not loaded");
    const l = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    n = cv.matFromImageData(l), r = new cv.Mat(), cv.cvtColor(n, r, cv.COLOR_RGBA2GRAY), o = new cv.Mat(), cv.adaptiveThreshold(
      r,
      o,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      11,
      2
    ), a = new cv.Mat(), cv.cvtColor(o, a, cv.COLOR_GRAY2RGBA);
    const c = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    c.width = e.width, c.height = e.height;
    const h = c.getContext("2d"), m = new ImageData(new Uint8ClampedArray(a.data), a.cols, a.rows);
    return h.putImageData(m, 0, 0), c;
  } catch (s) {
    console.warn("[Threshold] OpenCV adaptive thresholding failed. Falling back to grayscale image:", s);
    try {
      return await Pe(e);
    } catch (l) {
      return console.error("[Threshold] Grayscale fallback failed. Returning original canvas.", l), e;
    }
  } finally {
    n && n.delete(), r && r.delete(), o && o.delete(), a && a.delete();
  }
}
async function Pe(e) {
  const n = e.getContext("2d").getImageData(0, 0, e.width, e.height), r = n.data;
  for (let a = 0; a < r.length; a += 4) {
    const s = Math.round(0.299 * r[a] + 0.587 * r[a + 1] + 0.114 * r[a + 2]);
    r[a] = s, r[a + 1] = s, r[a + 2] = s;
  }
  const o = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
  return o.width = e.width, o.height = e.height, o.getContext("2d").putImageData(n, 0, 0), o;
}
let J = null;
async function _e() {
  if (typeof chrome > "u" || !chrome.offscreen)
    return;
  const e = "public/offscreen.html";
  if (!(chrome.runtime.getContexts && (await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(e)]
  })).length > 0)) {
    if (J) {
      await J;
      return;
    }
    J = chrome.offscreen.createDocument({
      url: e,
      reasons: ["DOM_SCRAPING"],
      justification: "OpenCV image preprocessing requires canvas DOM context"
    });
    try {
      await J;
    } catch (t) {
      if (!t.message.includes("Only a single offscreen"))
        throw t;
    } finally {
      J = null;
    }
  }
}
async function ve(e, t, n = 15e3) {
  await _e();
  const r = (o = 3) => new Promise((a, s) => {
    let l = setTimeout(() => {
      s(new Error(`Offscreen execution timed out after ${n}ms`));
    }, n);
    console.log("========= BEFORE SENDMESSAGE ========="), console.log(t), console.log(t.data?.constructor?.name), console.log(t.data?.byteLength), console.log("======================================"), chrome.runtime.sendMessage({
      target: "offscreen",
      type: e,
      payload: t
    }, (c) => {
      if (clearTimeout(l), chrome.runtime.lastError) {
        const h = chrome.runtime.lastError.message;
        if (h.includes("Could not establish connection") && o > 0) {
          console.warn(`[OffscreenManager] Connection failed (${h}). Retrying in 100ms... (${o} retries left)`), setTimeout(() => {
            r(o - 1).then(a, s);
          }, 100);
          return;
        }
        return s(new Error(h));
      }
      if (!c)
        return s(new Error("No response received from offscreen document"));
      if (!c.success)
        return s(new Error(c.error || "Offscreen processing failed"));
      a(c.payload);
    });
  });
  return r();
}
async function xe(e, t = {}) {
  if (typeof document > "u" && typeof chrome < "u" && chrome.offscreen) {
    console.log("[Preprocessor] Running in Service Worker. Delegating OpenCV to Offscreen Document...");
    try {
      const m = e.getContext("2d").getImageData(0, 0, e.width, e.height);
      console.log({
        width: e.width,
        height: e.height,
        imageDataLength: m.data.length,
        byteLength: m.data.buffer.byteLength
      });
      const i = Array.from(m.data), f = await ve("PREPROCESS_IMAGE", {
        width: e.width,
        height: e.height,
        data: i,
        options: t
      });
      console.log("===== RESULT FROM OFFSCREEN ====="), console.log(f), console.log("data =", f?.data), console.log("constructor =", f?.data?.constructor?.name), console.log("length =", f?.data?.length);
      const p = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(f.width, f.height) : document.createElement("canvas");
      p.width = f.width, p.height = f.height;
      const I = p.getContext("2d"), A = new ImageData(new Uint8ClampedArray(f.data), f.width, f.height);
      return I.putImageData(A, 0, 0), p;
    } catch (h) {
      return console.error("[Preprocessor] Offscreen delegation failed. Returning original imageSource.", h), e;
    }
  }
  const {
    enableDenoise: n = !0,
    enableDeskew: r = !0,
    thresholdValue: o = 127,
    maxWidth: a = 1920,
    maxHeight: s = 1080
  } = t;
  console.log("[Preprocessor] Beginning OpenCV.js image preprocessing pipeline...");
  const l = Date.now();
  let c = e;
  try {
    try {
      c = await Me(c, a, s);
    } catch (i) {
      console.warn("[Preprocessor] Resize stage failed. Continuing...", i);
    }
    try {
      c = await Te(c);
    } catch (i) {
      console.warn("[Preprocessor] Grayscale stage failed. Continuing...", i);
    }
    if (n)
      try {
        c = await De(c);
      } catch (i) {
        console.warn("[Preprocessor] Denoise stage failed. Continuing...", i);
      }
    let h = 0;
    if (r)
      try {
        const i = await Oe(c);
        c = i.canvas, h = i.angle;
      } catch (i) {
        console.warn("[Preprocessor] Deskew stage failed. Continuing...", i);
      }
    try {
      c = await Re(c, o);
    } catch (i) {
      console.warn("[Preprocessor] Threshold binarization stage failed. Continuing...", i);
    }
    const m = Date.now() - l;
    return console.log(`[Preprocessor] Pipeline resolved successfully in ${m}ms. Skew Angle: ${h.toFixed(2)} deg.`), c;
  } catch (h) {
    return console.error("[Preprocessor] Critical pipeline failure. Returning original image.", h), e;
  }
}
var Le = { exports: {} };
(function(e) {
  var t = function(n) {
    var r = Object.prototype, o = r.hasOwnProperty, a = Object.defineProperty || function(d, u, g) {
      d[u] = g.value;
    }, s, l = typeof Symbol == "function" ? Symbol : {}, c = l.iterator || "@@iterator", h = l.asyncIterator || "@@asyncIterator", m = l.toStringTag || "@@toStringTag";
    function i(d, u, g) {
      return Object.defineProperty(d, u, {
        value: g,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }), d[u];
    }
    try {
      i({}, "");
    } catch {
      i = function(u, g, y) {
        return u[g] = y;
      };
    }
    function f(d, u, g, y) {
      var w = u && u.prototype instanceof k ? u : k, E = Object.create(w.prototype), L = new V(y || []);
      return a(E, "_invoke", { value: oe(d, g, L) }), E;
    }
    n.wrap = f;
    function p(d, u, g) {
      try {
        return { type: "normal", arg: d.call(u, g) };
      } catch (y) {
        return { type: "throw", arg: y };
      }
    }
    var I = "suspendedStart", A = "suspendedYield", S = "executing", C = "completed", v = {};
    function k() {
    }
    function T() {
    }
    function D() {
    }
    var R = {};
    i(R, c, function() {
      return this;
    });
    var N = Object.getPrototypeOf, P = N && N(N(x([])));
    P && P !== r && o.call(P, c) && (R = P);
    var O = D.prototype = k.prototype = Object.create(R);
    T.prototype = D, a(O, "constructor", { value: D, configurable: !0 }), a(
      D,
      "constructor",
      { value: T, configurable: !0 }
    ), T.displayName = i(
      D,
      m,
      "GeneratorFunction"
    );
    function _(d) {
      ["next", "throw", "return"].forEach(function(u) {
        i(d, u, function(g) {
          return this._invoke(u, g);
        });
      });
    }
    n.isGeneratorFunction = function(d) {
      var u = typeof d == "function" && d.constructor;
      return u ? u === T || // For the native GeneratorFunction constructor, the best we can
      // do is to check its .name property.
      (u.displayName || u.name) === "GeneratorFunction" : !1;
    }, n.mark = function(d) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(d, D) : (d.__proto__ = D, i(d, m, "GeneratorFunction")), d.prototype = Object.create(O), d;
    }, n.awrap = function(d) {
      return { __await: d };
    };
    function j(d, u) {
      function g(E, L, F, G) {
        var z = p(d[E], d, L);
        if (z.type === "throw")
          G(z.arg);
        else {
          var se = z.arg, K = se.value;
          return K && typeof K == "object" && o.call(K, "__await") ? u.resolve(K.__await).then(function(H) {
            g("next", H, F, G);
          }, function(H) {
            g("throw", H, F, G);
          }) : u.resolve(K).then(function(H) {
            se.value = H, F(se);
          }, function(H) {
            return g("throw", H, F, G);
          });
        }
      }
      var y;
      function w(E, L) {
        function F() {
          return new u(function(G, z) {
            g(E, L, G, z);
          });
        }
        return y = // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        y ? y.then(
          F,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          F
        ) : F();
      }
      a(this, "_invoke", { value: w });
    }
    _(j.prototype), i(j.prototype, h, function() {
      return this;
    }), n.AsyncIterator = j, n.async = function(d, u, g, y, w) {
      w === void 0 && (w = Promise);
      var E = new j(
        f(d, u, g, y),
        w
      );
      return n.isGeneratorFunction(u) ? E : E.next().then(function(L) {
        return L.done ? L.value : E.next();
      });
    };
    function oe(d, u, g) {
      var y = I;
      return function(E, L) {
        if (y === S)
          throw new Error("Generator is already running");
        if (y === C) {
          if (E === "throw")
            throw L;
          return b();
        }
        for (g.method = E, g.arg = L; ; ) {
          var F = g.delegate;
          if (F) {
            var G = Q(F, g);
            if (G) {
              if (G === v) continue;
              return G;
            }
          }
          if (g.method === "next")
            g.sent = g._sent = g.arg;
          else if (g.method === "throw") {
            if (y === I)
              throw y = C, g.arg;
            g.dispatchException(g.arg);
          } else g.method === "return" && g.abrupt("return", g.arg);
          y = S;
          var z = p(d, u, g);
          if (z.type === "normal") {
            if (y = g.done ? C : A, z.arg === v)
              continue;
            return {
              value: z.arg,
              done: g.done
            };
          } else z.type === "throw" && (y = C, g.method = "throw", g.arg = z.arg);
        }
      };
    }
    function Q(d, u) {
      var g = u.method, y = d.iterator[g];
      if (y === s)
        return u.delegate = null, g === "throw" && d.iterator.return && (u.method = "return", u.arg = s, Q(d, u), u.method === "throw") || g !== "return" && (u.method = "throw", u.arg = new TypeError(
          "The iterator does not provide a '" + g + "' method"
        )), v;
      var w = p(y, d.iterator, u.arg);
      if (w.type === "throw")
        return u.method = "throw", u.arg = w.arg, u.delegate = null, v;
      var E = w.arg;
      if (!E)
        return u.method = "throw", u.arg = new TypeError("iterator result is not an object"), u.delegate = null, v;
      if (E.done)
        u[d.resultName] = E.value, u.next = d.nextLoc, u.method !== "return" && (u.method = "next", u.arg = s);
      else
        return E;
      return u.delegate = null, v;
    }
    _(O), i(O, m, "Generator"), i(O, c, function() {
      return this;
    }), i(O, "toString", function() {
      return "[object Generator]";
    });
    function ae(d) {
      var u = { tryLoc: d[0] };
      1 in d && (u.catchLoc = d[1]), 2 in d && (u.finallyLoc = d[2], u.afterLoc = d[3]), this.tryEntries.push(u);
    }
    function Z(d) {
      var u = d.completion || {};
      u.type = "normal", delete u.arg, d.completion = u;
    }
    function V(d) {
      this.tryEntries = [{ tryLoc: "root" }], d.forEach(ae, this), this.reset(!0);
    }
    n.keys = function(d) {
      var u = Object(d), g = [];
      for (var y in u)
        g.push(y);
      return g.reverse(), function w() {
        for (; g.length; ) {
          var E = g.pop();
          if (E in u)
            return w.value = E, w.done = !1, w;
        }
        return w.done = !0, w;
      };
    };
    function x(d) {
      if (d) {
        var u = d[c];
        if (u)
          return u.call(d);
        if (typeof d.next == "function")
          return d;
        if (!isNaN(d.length)) {
          var g = -1, y = function w() {
            for (; ++g < d.length; )
              if (o.call(d, g))
                return w.value = d[g], w.done = !1, w;
            return w.value = s, w.done = !0, w;
          };
          return y.next = y;
        }
      }
      return { next: b };
    }
    n.values = x;
    function b() {
      return { value: s, done: !0 };
    }
    return V.prototype = {
      constructor: V,
      reset: function(d) {
        if (this.prev = 0, this.next = 0, this.sent = this._sent = s, this.done = !1, this.delegate = null, this.method = "next", this.arg = s, this.tryEntries.forEach(Z), !d)
          for (var u in this)
            u.charAt(0) === "t" && o.call(this, u) && !isNaN(+u.slice(1)) && (this[u] = s);
      },
      stop: function() {
        this.done = !0;
        var d = this.tryEntries[0], u = d.completion;
        if (u.type === "throw")
          throw u.arg;
        return this.rval;
      },
      dispatchException: function(d) {
        if (this.done)
          throw d;
        var u = this;
        function g(G, z) {
          return E.type = "throw", E.arg = d, u.next = G, z && (u.method = "next", u.arg = s), !!z;
        }
        for (var y = this.tryEntries.length - 1; y >= 0; --y) {
          var w = this.tryEntries[y], E = w.completion;
          if (w.tryLoc === "root")
            return g("end");
          if (w.tryLoc <= this.prev) {
            var L = o.call(w, "catchLoc"), F = o.call(w, "finallyLoc");
            if (L && F) {
              if (this.prev < w.catchLoc)
                return g(w.catchLoc, !0);
              if (this.prev < w.finallyLoc)
                return g(w.finallyLoc);
            } else if (L) {
              if (this.prev < w.catchLoc)
                return g(w.catchLoc, !0);
            } else if (F) {
              if (this.prev < w.finallyLoc)
                return g(w.finallyLoc);
            } else
              throw new Error("try statement without catch or finally");
          }
        }
      },
      abrupt: function(d, u) {
        for (var g = this.tryEntries.length - 1; g >= 0; --g) {
          var y = this.tryEntries[g];
          if (y.tryLoc <= this.prev && o.call(y, "finallyLoc") && this.prev < y.finallyLoc) {
            var w = y;
            break;
          }
        }
        w && (d === "break" || d === "continue") && w.tryLoc <= u && u <= w.finallyLoc && (w = null);
        var E = w ? w.completion : {};
        return E.type = d, E.arg = u, w ? (this.method = "next", this.next = w.finallyLoc, v) : this.complete(E);
      },
      complete: function(d, u) {
        if (d.type === "throw")
          throw d.arg;
        return d.type === "break" || d.type === "continue" ? this.next = d.arg : d.type === "return" ? (this.rval = this.arg = d.arg, this.method = "return", this.next = "end") : d.type === "normal" && u && (this.next = u), v;
      },
      finish: function(d) {
        for (var u = this.tryEntries.length - 1; u >= 0; --u) {
          var g = this.tryEntries[u];
          if (g.finallyLoc === d)
            return this.complete(g.completion, g.afterLoc), Z(g), v;
        }
      },
      catch: function(d) {
        for (var u = this.tryEntries.length - 1; u >= 0; --u) {
          var g = this.tryEntries[u];
          if (g.tryLoc === d) {
            var y = g.completion;
            if (y.type === "throw") {
              var w = y.arg;
              Z(g);
            }
            return w;
          }
        }
        throw new Error("illegal catch attempt");
      },
      delegateYield: function(d, u, g) {
        return this.delegate = {
          iterator: x(d),
          resultName: u,
          nextLoc: g
        }, this.method === "next" && (this.arg = s), v;
      }
    }, n;
  }(
    // If this script is executing as a CommonJS module, use module.exports
    // as the regeneratorRuntime namespace. Otherwise create a new empty
    // object. Either way, the resulting object will be used to initialize
    // the regeneratorRuntime variable at the top of this file.
    e.exports
  );
  try {
    regeneratorRuntime = t;
  } catch {
    typeof globalThis == "object" ? globalThis.regeneratorRuntime = t : Function("r", "regeneratorRuntime = r")(t);
  }
})(Le);
var Ce = (e, t) => `${e}-${t}-${Math.random().toString(16).slice(3, 8)}`;
const $e = Ce;
let de = 0;
var Be = ({
  id: e,
  action: t,
  payload: n = {}
}) => {
  let r = e;
  return typeof r > "u" && (r = $e("Job", de), de += 1), {
    id: r,
    action: t,
    payload: n
  };
}, ne = {};
let ue = !1;
ne.logging = ue;
ne.setLogging = (e) => {
  ue = e;
};
ne.log = (...e) => ue ? console.log.apply(void 0, e) : null;
function Ne(e) {
  throw new Error('Could not dynamically require "' + e + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var Fe = (e) => {
  const t = {};
  return typeof WorkerGlobalScope < "u" ? t.type = "webworker" : typeof document == "object" ? t.type = "browser" : typeof process == "object" && typeof Ne == "function" && (t.type = "node"), typeof e > "u" ? t : t[e];
};
const ze = Fe("type") === "browser", Ge = ze ? (e) => new URL(e, window.location.href).href : (e) => e;
var We = (e) => {
  const t = { ...e };
  return ["corePath", "workerPath", "langPath"].forEach((n) => {
    e[n] && (t[n] = Ge(t[n]));
  }), t;
}, Ue = {
  TESSERACT_ONLY: 0,
  LSTM_ONLY: 1,
  TESSERACT_LSTM_COMBINED: 2,
  DEFAULT: 3
};
const qe = "7.0.0", He = {
  version: qe
};
var Ye = {
  /*
   * Use BlobURL for worker script by default
   * TODO: remove this option
   *
   */
  workerBlobURL: !0,
  logger: () => {
  }
};
const je = He.version, Ze = Ye;
var Ve = {
  ...Ze,
  workerPath: `https://cdn.jsdelivr.net/npm/tesseract.js@v${je}/dist/worker.min.js`
}, Ke = ({ workerPath: e, workerBlobURL: t }) => {
  let n;
  if (Blob && URL && t) {
    const r = new Blob([`importScripts("${e}");`], {
      type: "application/javascript"
    });
    n = new Worker(URL.createObjectURL(r));
  } else
    n = new Worker(e);
  return n;
}, Je = (e) => {
  e.terminate();
}, Xe = (e, t) => {
  e.onmessage = ({ data: n }) => {
    t(n);
  };
}, Qe = async (e, t) => {
  e.postMessage(t);
};
const ie = (e) => new Promise((t, n) => {
  const r = new FileReader();
  r.onload = () => {
    t(r.result);
  }, r.onerror = ({ target: { error: { code: o } } }) => {
    n(Error(`File could not be read! Code=${o}`));
  }, r.readAsArrayBuffer(e);
}), le = async (e) => {
  let t = e;
  if (typeof e > "u")
    return "undefined";
  if (typeof e == "string")
    /data:image\/([a-zA-Z]*);base64,([^"]*)/.test(e) ? t = atob(e.split(",")[1]).split("").map((n) => n.charCodeAt(0)) : t = await (await fetch(e)).arrayBuffer();
  else if (typeof HTMLElement < "u" && e instanceof HTMLElement)
    e.tagName === "IMG" && (t = await le(e.src)), e.tagName === "VIDEO" && (t = await le(e.poster)), e.tagName === "CANVAS" && await new Promise((n) => {
      e.toBlob(async (r) => {
        t = await ie(r), n();
      });
    });
  else if (typeof OffscreenCanvas < "u" && e instanceof OffscreenCanvas) {
    const n = await e.convertToBlob();
    t = await ie(n);
  } else (e instanceof File || e instanceof Blob) && (t = await ie(e));
  return new Uint8Array(t);
};
var et = le;
const tt = Ve, rt = Ke, nt = Je, ot = Xe, at = Qe, st = et;
var it = {
  defaultOptions: tt,
  spawnWorker: rt,
  terminateWorker: nt,
  onMessage: ot,
  send: at,
  loadImage: st
};
const ct = We, W = Be, { log: fe } = ne, lt = Ce, Y = Ue, {
  defaultOptions: ut,
  spawnWorker: dt,
  terminateWorker: ft,
  onMessage: ht,
  loadImage: he,
  send: gt
} = it;
let ge = 0;
var be = async (e = "eng", t = Y.LSTM_ONLY, n = {}, r = {}) => {
  const o = lt("Worker", ge), {
    logger: a,
    errorHandler: s,
    ...l
  } = ct({
    ...ut,
    ...n
  }), c = {}, h = typeof e == "string" ? e.split("+") : e;
  let m = t, i = r;
  const f = [Y.DEFAULT, Y.LSTM_ONLY].includes(t) && !l.legacyCore;
  let p, I;
  const A = new Promise((x, b) => {
    I = x, p = b;
  }), S = (x) => {
    p(x.message);
  };
  let C = dt(l);
  C.onerror = S, ge += 1;
  const v = ({ id: x, action: b, payload: d }) => new Promise((u, g) => {
    fe(`[${o}]: Start ${x}, action=${b}`);
    const y = `${b}-${x}`;
    c[y] = { resolve: u, reject: g }, gt(C, {
      workerId: o,
      jobId: x,
      action: b,
      payload: d
    });
  }), k = () => console.warn("`load` is depreciated and should be removed from code (workers now come pre-loaded)"), T = (x) => v(W({
    id: x,
    action: "load",
    payload: { options: { lstmOnly: f, corePath: l.corePath, logging: l.logging } }
  })), D = (x, b, d) => v(W({
    id: d,
    action: "FS",
    payload: { method: "writeFile", args: [x, b] }
  })), R = (x, b) => v(W({
    id: b,
    action: "FS",
    payload: { method: "readFile", args: [x, { encoding: "utf8" }] }
  })), N = (x, b) => v(W({
    id: b,
    action: "FS",
    payload: { method: "unlink", args: [x] }
  })), P = (x, b, d) => v(W({
    id: d,
    action: "FS",
    payload: { method: x, args: b }
  })), O = (x, b) => v(W({
    id: b,
    action: "loadLanguage",
    payload: {
      langs: x,
      options: {
        langPath: l.langPath,
        dataPath: l.dataPath,
        cachePath: l.cachePath,
        cacheMethod: l.cacheMethod,
        gzip: l.gzip,
        lstmOnly: [Y.DEFAULT, Y.LSTM_ONLY].includes(m) && !l.legacyLang
      }
    }
  })), _ = (x, b, d, u) => v(W({
    id: u,
    action: "initialize",
    payload: { langs: x, oem: b, config: d }
  })), j = (x = "eng", b, d, u) => {
    if (f && [Y.TESSERACT_ONLY, Y.TESSERACT_LSTM_COMBINED].includes(b)) throw Error("Legacy model requested but code missing.");
    const g = b || m;
    m = g;
    const y = d || i;
    i = y;
    const E = (typeof x == "string" ? x.split("+") : x).filter((L) => !h.includes(L));
    return h.push(...E), E.length > 0 ? O(E, u).then(() => _(x, g, y, u)) : _(x, g, y, u);
  }, oe = (x = {}, b) => v(W({
    id: b,
    action: "setParameters",
    payload: { params: x }
  })), Q = async (x, b = {}, d = {
    text: !0
  }, u) => v(W({
    id: u,
    action: "recognize",
    payload: { image: await he(x), options: b, output: d }
  })), ae = async (x, b) => {
    if (f) throw Error("`worker.detect` requires Legacy model, which was not loaded.");
    return v(W({
      id: b,
      action: "detect",
      payload: { image: await he(x) }
    }));
  }, Z = async () => (C !== null && (ft(C), C = null), Promise.resolve());
  ht(C, ({
    workerId: x,
    jobId: b,
    status: d,
    action: u,
    data: g
  }) => {
    const y = `${u}-${b}`;
    if (d === "resolve")
      fe(`[${x}]: Complete ${b}`), c[y].resolve({ jobId: b, data: g }), delete c[y];
    else if (d === "reject")
      if (c[y].reject(g), delete c[y], u === "load" && p(g), s)
        s(g);
      else
        throw Error(g);
    else d === "progress" && a({ ...g, userJobId: b });
  });
  const V = {
    id: o,
    worker: C,
    load: k,
    writeText: D,
    readText: R,
    removeFile: N,
    FS: P,
    reinitialize: j,
    setParameters: oe,
    recognize: Q,
    detect: ae,
    terminate: Z
  };
  return T().then(() => O(e)).then(() => _(e, t, r)).then(() => I(V)).catch(() => {
  }), A;
};
const Ie = be, mt = async (e, t, n) => {
  const r = await Ie(t, 1, n);
  return r.recognize(e).finally(async () => {
    await r.terminate();
  });
}, pt = async (e, t) => {
  const n = await Ie("osd", 0, t);
  return n.detect(e).finally(async () => {
    await n.terminate();
  });
};
var wt = {
  recognize: mt,
  detect: pt
};
const yt = be, vt = wt;
var xt = {
  createWorker: yt,
  ...vt
};
let ce = null, X = null, me = Promise.resolve();
async function Ct(e = "eng") {
  return ce || X || (X = (async () => {
    try {
      console.log(`[TesseractWorker] Spawning local OCR worker for language: ${e}...`);
      const t = chrome.runtime.getURL("tesseract/worker.min.js"), n = chrome.runtime.getURL("tesseract/tesseract-core.wasm.js"), r = chrome.runtime.getURL("tesseract/");
      console.log("[TesseractWorker] Configuring local sandboxed paths:", { workerPath: t, corePath: n, langPath: r });
      const o = await xt.createWorker(e, 1, {
        workerPath: t,
        corePath: n,
        langPath: r,
        workerBlobURL: !1,
        // <-- CRITICAL MV3 FIX: Disables Blob workers to bypass importScripts CSP
        cacheMethod: "none",
        // Prevent trying to write to browser IndexedDB caches
        gzip: !0,
        // eng.traineddata.gz is compressed
        logger: (a) => {
          a.status === "recognizing text" && console.log(`[TesseractWorker] OCR Progress: ${Math.round(a.progress * 100)}%`);
        }
      });
      return ce = o, o;
    } catch (t) {
      throw console.error("[TesseractWorker] Failed to create or load worker:", t), X = null, t;
    }
  })(), X);
}
async function bt(e) {
  let t;
  const n = new Promise((r) => {
    me.then(() => r());
  });
  me = new Promise((r) => {
    t = r;
  }), await n;
  try {
    const r = await Ct();
    return console.log("[TesseractWorker] Invoking worker.recognize directly with canvas context object..."), await r.recognize(e);
  } finally {
    t();
  }
}
function It(e) {
  return !e || !Array.isArray(e.words) ? [] : (console.log(`[ExtractWords] Extracting word structures. Found count: ${e.words.length}`), e.words.map((t) => ({
    text: t.text || "",
    confidence: typeof t.confidence == "number" ? t.confidence : 0,
    bbox: {
      x0: t.bbox ? t.bbox.x0 : 0,
      y0: t.bbox ? t.bbox.y0 : 0,
      x1: t.bbox ? t.bbox.x1 : 0,
      y1: t.bbox ? t.bbox.y1 : 0
    }
  })));
}
function Et(e) {
  return !e || !Array.isArray(e.lines) ? [] : (console.log(`[ExtractLines] Organizing horizontal line blocks. Found count: ${e.lines.length}`), e.lines.map((t) => ({
    text: t.text ? t.text.trim() : "",
    bbox: {
      x0: t.bbox ? t.bbox.x0 : 0,
      y0: t.bbox ? t.bbox.y0 : 0,
      x1: t.bbox ? t.bbox.x1 : 0,
      y1: t.bbox ? t.bbox.y1 : 0
    }
  })));
}
function Ee(e) {
  return !e || !Array.isArray(e.words) ? [] : (console.log("[ExtractBoundingBoxes] Compiling spatial coordinate box records..."), e.words.map((t) => {
    const n = t.bbox ? t.bbox.x0 : 0, r = t.bbox ? t.bbox.y0 : 0, o = t.bbox ? t.bbox.x1 : 0, a = t.bbox ? t.bbox.y1 : 0;
    return {
      x: n,
      y: r,
      width: o - n,
      height: a - r,
      confidence: typeof t.confidence == "number" ? t.confidence : 0,
      text: t.text || ""
    };
  }));
}
async function St(e) {
  if (typeof document > "u" && typeof chrome < "u" && chrome.offscreen) {
    console.log("[RecognizeImage] Running in Service Worker. Delegating OCR to Offscreen Document...");
    try {
      const r = e.getContext("2d").getImageData(0, 0, e.width, e.height), o = Array.from(r.data);
      return await ve("RECOGNIZE_IMAGE", {
        width: e.width,
        height: e.height,
        data: o
      });
    } catch (n) {
      return console.error("[RecognizeImage] Offscreen OCR delegation failed.", n), {
        text: "",
        confidence: 0,
        words: [],
        lines: [],
        boundingBoxes: [],
        processingTime: 0,
        error: n.message
      };
    }
  }
  const t = Date.now();
  console.log("[RecognizeImage] Triggering character recognition loop...");
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    if (e.width === 0 || e.height === 0)
      throw new Error("Canvas dimensions cannot be zero");
    const n = await bt(e);
    if (!n || !n.data)
      throw new Error("Tesseract returned an empty or malformed result payload");
    const { data: r } = n, o = It(r), a = Et(r), s = Ee(r), l = Date.now() - t;
    return console.log(`[RecognizeImage] OCR successful. Latency: ${l}ms. Text length: ${r.text ? r.text.length : 0}`), {
      text: r.text || "",
      confidence: typeof r.confidence == "number" ? r.confidence : 0,
      words: o,
      lines: a,
      boundingBoxes: s,
      processingTime: l
    };
  } catch (n) {
    return console.error("[RecognizeImage] OCR processing failed:", n), {
      text: "",
      confidence: 0,
      words: [],
      lines: [],
      boundingBoxes: [],
      processingTime: Date.now() - t,
      error: n instanceof Error ? n.message : "Unknown OCR processing exception"
    };
  }
}
const At = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  AADHAAR: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  PAN: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
  PASSPORT: /\b[A-Z][0-9]{7}\b/g,
  DRIVING_LICENSE: /\b[A-Z]{2}[0-9]{2}[-\s]?[0-9]{11}\b/g,
  IFSC: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
  CREDIT_CARD: /\b(?:\d[ -]*?){13,19}\b/g,
  UPI_ID: /\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b/g,
  AWS_ACCESS_KEY: /\bAKIA[A-Z0-9]{16}\b/g,
  GOOGLE_API_KEY: /\bAIza[Sy][a-zA-Z0-9\-_]{35}\b/g,
  GITHUB_PAT: /\bghp_[a-zA-Z0-9]{36}\b/g,
  JWT_TOKEN: /\beyJ[a-zA-Z0-9\-_]+\.eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\b/g,
  PASSWORD_PATTERNS: /\b(?:password|passwd|secret|passphrase)\s*[:=]\s*([a-zA-Z0-9!@#$%^&*()_+=-]{6,30})\b/gi
}, kt = {
  EMAIL: 0.95,
  PHONE: 0.85,
  AADHAAR: 0.9,
  PAN: 0.95,
  PASSPORT: 0.9,
  DRIVING_LICENSE: 0.9,
  IFSC: 0.95,
  CREDIT_CARD: 0.8,
  // Needs Luhn check to boost
  UPI_ID: 0.9,
  AWS_ACCESS_KEY: 0.99,
  GOOGLE_API_KEY: 0.99,
  GITHUB_PAT: 0.99,
  JWT_TOKEN: 0.95,
  PASSWORD_PATTERNS: 0.85
};
function Mt(e, t = []) {
  if (!e)
    return [];
  console.log("[RegexDetector] Running sensitivity patterns scanning...");
  const n = [], r = Tt(e, t);
  for (const [o, a] of Object.entries(At)) {
    a.lastIndex = 0;
    let s;
    for (; (s = a.exec(e)) !== null; ) {
      const l = s[0], c = s.index, h = c + l.length, m = r.filter((f) => f.startIndex < h && f.endIndex > c).map((f) => ({
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        confidence: f.confidence
      })), i = m.length > 0 ? m.reduce((f, p) => f + p.confidence, 0) / m.length : 0;
      n.push({
        type: o,
        value: l,
        regexConfidence: kt[o] || 0.8,
        ocrConfidence: i / 100,
        // Normalize to 0.0 - 1.0
        startIndex: c,
        endIndex: h,
        bboxes: m,
        source: "regex"
      });
    }
  }
  return n;
}
function Tt(e, t) {
  let n = 0;
  return t.map((r) => {
    if (!r.text)
      return { ...r, startIndex: -1, endIndex: -1 };
    const o = r.text.trim(), a = e.indexOf(o, n);
    return a !== -1 ? (n = a + o.length, {
      ...r,
      startIndex: a,
      endIndex: n
    }) : { ...r, startIndex: -1, endIndex: -1 };
  });
}
async function Dt(e) {
  try {
    return e ? (console.log("[MiniLMClassifier] Classifying text semantic structure..."), [
      { topic: "Financial Statement", score: 0.94 },
      { topic: "Personal Identifiable Information", score: 0.88 }
    ]) : [];
  } catch (t) {
    throw console.error("[MiniLMClassifier] Semantic classification failed:", t), t;
  }
}
const Ot = {
  EMAIL: "medium",
  PHONE: "low",
  AADHAAR: "high",
  PAN: "high",
  PASSPORT: "high",
  DRIVING_LICENSE: "high",
  IFSC: "medium",
  CREDIT_CARD: "critical",
  UPI_ID: "medium",
  AWS_ACCESS_KEY: "critical",
  GOOGLE_API_KEY: "critical",
  GITHUB_PAT: "critical",
  JWT_TOKEN: "critical",
  PASSWORD_PATTERNS: "critical"
};
function Rt(e) {
  return Array.isArray(e) ? e.filter((t) => t.rulePassed === !1 ? (console.log(`[ConfidenceFusion] Dropping false positive: [${t.type}] "${t.value}" (failed checksum validation).`), !1) : !0).map((t) => {
    const n = typeof t.ocrConfidence == "number" ? t.ocrConfidence : 0.5, r = typeof t.regexConfidence == "number" ? t.regexConfidence : 0.8;
    let o = 0.7 * r + 0.3 * n;
    return o = Math.min(1, Math.max(0, o)), {
      type: t.type,
      value: t.value,
      ocrConfidence: n,
      regexConfidence: r,
      fusedConfidence: parseFloat(o.toFixed(4)),
      severity: Ot[t.type] || "medium",
      startIndex: t.startIndex,
      endIndex: t.endIndex,
      bboxes: t.bboxes || [],
      source: t.source || "regex"
    };
  }) : [];
}
const Pt = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
], _t = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 1, 4, 6, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];
function Lt(e) {
  const t = e.replace(/[-\s]/g, "");
  if (t.length !== 12 || !/^\d{12}$/.test(t) || t[0] === "0" || t[0] === "1")
    return !1;
  let n = 0;
  const r = t.split("").map(Number).reverse();
  for (let o = 0; o < r.length; o++)
    n = Pt[n][_t[o % 8][r[o]]];
  return n === 0;
}
function $t(e) {
  const t = e.replace(/[-\s]/g, "");
  if (!/^\d{13,19}$/.test(t))
    return !1;
  let n = 0, r = !1;
  for (let o = t.length - 1; o >= 0; o--) {
    let a = parseInt(t.charAt(o), 10);
    r && (a *= 2, a > 9 && (a -= 9)), n += a, r = !r;
  }
  return n % 10 === 0;
}
function Bt(e) {
  const t = /^[A-Z]{5}[0-9]{4}[A-Z]$/, n = e.trim().toUpperCase();
  return t.test(n) ? ["P", "C", "H", "F", "A", "T", "B", "L", "J", "G"].includes(n[3]) : !1;
}
function Nt(e) {
  const t = e.trim().toUpperCase();
  return /^[A-PR-WYZ][0-9]{7}$/.test(t);
}
function Ft(e) {
  const t = e.replace(/[-\s]/g, "").toUpperCase();
  return /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/.test(t);
}
function zt(e) {
  return Array.isArray(e) ? e.map((t) => {
    let n = !0;
    try {
      switch (t.type) {
        case "AADHAAR":
          n = Lt(t.value);
          break;
        case "CREDIT_CARD":
          n = $t(t.value);
          break;
        case "PAN":
          n = Bt(t.value);
          break;
        case "PASSPORT":
          n = Nt(t.value);
          break;
        case "DRIVING_LICENSE":
          n = Ft(t.value);
          break;
        case "IFSC":
          n = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(t.value.trim().toUpperCase());
          break;
        default:
          n = !0;
          break;
      }
    } catch (r) {
      console.warn(`[RuleEngine] Check execution exception for type ${t.type}:`, r), n = !1;
    }
    return {
      ...t,
      rulePassed: n
    };
  }) : [];
}
function ee(e) {
  if (!Array.isArray(e) || e.length <= 1)
    return e;
  const t = [...e].sort((o, a) => o.x - a.x), n = [];
  let r = t[0];
  for (let o = 1; o < t.length; o++) {
    const a = t[o], s = r.y + r.height, l = a.y + a.height, c = Math.min(s, l) - Math.max(r.y, a.y), h = a.x - (r.x + r.width);
    if (c > 0 && h <= 15) {
      const m = Math.min(r.x, a.x), i = Math.min(r.y, a.y), f = Math.max(r.x + r.width, a.x + a.width), p = Math.max(s, l);
      r = {
        x: m,
        y: i,
        width: f - m,
        height: p - i,
        confidence: Math.max(r.confidence, a.confidence)
      };
    } else
      n.push(r), r = a;
  }
  return n.push(r), n;
}
function Gt(e) {
  if (!Array.isArray(e) || e.length <= 1)
    return e || [];
  const t = [...e].sort((a, s) => a.startIndex - s.startIndex), n = [];
  let r = t[0];
  for (let a = 1; a < t.length; a++) {
    const s = t[a];
    s.startIndex <= r.endIndex ? s.rulePassed && !r.rulePassed || s.rulePassed === r.rulePassed && s.regexConfidence > r.regexConfidence ? r = {
      ...s,
      startIndex: r.startIndex,
      endIndex: Math.max(r.endIndex, s.endIndex),
      value: r.value + s.value.substring(Math.max(0, r.endIndex - s.startIndex)),
      bboxes: ee([...r.bboxes, ...s.bboxes])
    } : r = {
      ...r,
      endIndex: Math.max(r.endIndex, s.endIndex),
      value: r.value + s.value.substring(Math.max(0, r.endIndex - s.startIndex)),
      bboxes: ee([...r.bboxes, ...s.bboxes])
    } : (r.bboxes = ee(r.bboxes), n.push(r), r = s);
  }
  r.bboxes = ee(r.bboxes), n.push(r);
  const o = /* @__PURE__ */ new Set();
  return n.filter((a) => {
    const s = `${a.type}_${a.startIndex}_${a.value}`;
    return o.has(s) ? !1 : (o.add(s), !0);
  });
}
const Wt = {
  critical: 10,
  high: 5,
  medium: 2,
  low: 1
};
function Ut(e) {
  if (!Array.isArray(e) || e.length === 0)
    return {
      riskLevel: "low",
      score: 0,
      detections: []
    };
  let t = 0, n = !1;
  e.forEach((o) => {
    const a = Wt[o.severity] || 2, s = typeof o.fusedConfidence == "number" ? o.fusedConfidence : 0.8;
    t += a * s, o.severity === "critical" && s >= 0.7 && (n = !0);
  });
  let r = "low";
  return n || t >= 15 ? r = "critical" : t >= 5 ? r = "high" : t >= 2 && (r = "medium"), console.log(`[RiskAnalyzer] Calculated document risk score: ${t.toFixed(2)} -> Level: ${r.toUpperCase()}`), {
    riskLevel: r,
    score: parseFloat(t.toFixed(2)),
    detections: e
  };
}
async function Se(e) {
  if (!e)
    throw new TypeError("File parameter is required");
  if (typeof document > "u") {
    const t = await e.arrayBuffer(), n = new Blob([t], { type: e.type || "image/png" }), r = await createImageBitmap(n);
    console.log("[ScanService] createImageBitmap succeeded");
    const o = new OffscreenCanvas(r.width, r.height);
    return o.getContext("2d").drawImage(r, 0, 0), o;
  } else
    return new Promise((t, n) => {
      const r = new FileReader();
      r.onload = (o) => {
        const a = new Image();
        a.onload = () => {
          const s = document.createElement("canvas");
          s.width = a.width, s.height = a.height, s.getContext("2d").drawImage(a, 0, 0), t(s);
        }, a.onerror = (s) => n(new Error(`Failed to decode image pixels: ${s}`)), a.src = o.target.result;
      }, r.onerror = (o) => n(new Error(`Failed to read file buffer: ${o}`)), r.readAsDataURL(e);
    });
}
async function qt(e, t = {}) {
  const n = Date.now();
  console.log(`[ScanService] Initiating scan pipeline for file: ${e.name} (${e.size} bytes)`);
  try {
    const r = await Se(e), o = await xe(r, t.preprocess), a = await St(o), s = Ee(a), l = Mt(a.text, s), c = zt(l), h = await Dt(a.text), m = Rt(c, h), i = Gt(m), f = Ut(i), p = Date.now() - n;
    return console.log(`[ScanService] Scan pipeline resolved in ${p}ms. Risk: ${f.riskLevel.toUpperCase()}`), {
      success: !0,
      riskLevel: f.riskLevel,
      score: f.score,
      piiCount: i.length,
      detections: i,
      processingTime: p,
      metadata: {
        name: e.name,
        size: e.size,
        type: e.type
      }
    };
  } catch (r) {
    return console.error("[ScanService] Scan pipeline failed:", r), {
      success: !1,
      riskLevel: "low",
      score: 0,
      piiCount: 0,
      detections: [],
      processingTime: Date.now() - n,
      metadata: {
        name: e.name,
        size: e.size,
        type: e.type
      },
      error: r instanceof Error ? r.message : "Unknown scan pipeline failure"
    };
  }
}
async function Ht(e, t) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    const n = e.getContext("2d"), r = e.width, o = e.height, a = n.getImageData(0, 0, r, o), s = a.data, l = t * 0.8;
    for (let m = 0; m < s.length; m += 4) {
      const i = m / 4, f = i % r, p = Math.floor(i / r), I = Math.sin(f * 0.8) * Math.cos(p * 0.8) * l, A = Math.cos(f * 0.8) * Math.sin(p * 0.8) * l, S = Math.sin((f + p) * 0.5) * l;
      s[m] = Math.min(255, Math.max(0, s[m] + I)), s[m + 1] = Math.min(255, Math.max(0, s[m + 1] + A)), s[m + 2] = Math.min(255, Math.max(0, s[m + 2] + S));
    }
    const c = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(r, o) : document.createElement("canvas");
    return c.width = r, c.height = o, c.getContext("2d").putImageData(a, 0, 0), c;
  } catch (n) {
    throw console.error("[Perturbation] Error applying pixel alterations:", n), n;
  }
}
async function Yt(e, t = {}) {
  const { strength: n = 5 } = t;
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    console.log(`[AICloak] Injecting adversarial cloak (intensity: ${n})...`);
    const r = await Ht(e, n);
    return console.log("[AICloak] Adversarial noise mapping completed."), r;
  } catch (r) {
    throw console.error("[AICloak] Failed to apply adversarial cloaking:", r), r;
  }
}
function jt(e) {
  const n = Array.from({ length: 8 }, () => new Array(8).fill(0));
  for (let r = 0; r < 8; r++)
    for (let o = 0; o < 8; o++) {
      let a = 0;
      for (let c = 0; c < 8; c++)
        for (let h = 0; h < 8; h++)
          a += e[c][h] * Math.cos((2 * c + 1) * r * Math.PI / 16) * Math.cos((2 * h + 1) * o * Math.PI / 16);
      const s = r === 0 ? 1 / Math.sqrt(2) : 1, l = o === 0 ? 1 / Math.sqrt(2) : 1;
      n[r][o] = 0.25 * s * l * a;
    }
  return n;
}
function Zt(e) {
  const n = Array.from({ length: 8 }, () => new Array(8).fill(0));
  for (let r = 0; r < 8; r++)
    for (let o = 0; o < 8; o++) {
      let a = 0;
      for (let s = 0; s < 8; s++)
        for (let l = 0; l < 8; l++) {
          const c = s === 0 ? 1 / Math.sqrt(2) : 1, h = l === 0 ? 1 / Math.sqrt(2) : 1;
          a += c * h * e[s][l] * Math.cos((2 * r + 1) * s * Math.PI / 16) * Math.cos((2 * o + 1) * l * Math.PI / 16);
        }
      n[r][o] = 0.25 * a;
    }
  return n;
}
const $ = 8, te = 20;
function Vt(e) {
  const t = [];
  for (let n = 0; n < e.length; n++) {
    const r = e.charCodeAt(n);
    for (let o = 7; o >= 0; o--)
      t.push(r >> o & 1);
  }
  return t;
}
async function Kt(e, t) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    console.log(`[WatermarkEngine] Embedding invisible DCT watermark: "${t}"`);
    const n = e.getContext("2d"), r = e.width, o = e.height, a = n.getImageData(0, 0, r, o), s = a.data, l = Vt(t + "\0");
    let c = 0;
    const h = Math.floor(r / $) * $, m = Math.floor(o / $) * $;
    for (let i = 0; i < m; i += $)
      for (let f = 0; f < h; f += $) {
        const p = Array.from({ length: $ }, () => new Array($).fill(0)), I = Array.from({ length: $ }, () => new Array($).fill(0)), A = Array.from({ length: $ }, () => new Array($).fill(0));
        for (let v = 0; v < $; v++)
          for (let k = 0; k < $; k++) {
            const T = ((i + v) * r + (f + k)) * 4, D = s[T], R = s[T + 1], N = s[T + 2];
            p[v][k] = 0.299 * D + 0.587 * R + 0.114 * N, I[v][k] = 128 - 0.1687 * D - 0.3313 * R + 0.5 * N, A[v][k] = 128 + 0.5 * D - 0.4187 * R - 0.0813 * N;
          }
        const S = jt(p);
        if (c < l.length) {
          const v = l[c], k = S[4][4], T = Math.round(k / te) * te;
          S[4][4] = v === 1 ? T + te / 4 : T - te / 4, c++;
        }
        const C = Zt(S);
        for (let v = 0; v < $; v++)
          for (let k = 0; k < $; k++) {
            const T = ((i + v) * r + (f + k)) * 4, D = C[v][k], R = I[v][k], N = A[v][k];
            let P = Math.round(D + 1.402 * (N - 128)), O = Math.round(D - 0.3441 * (R - 128) - 0.7141 * (N - 128)), _ = Math.round(D + 1.772 * (R - 128));
            s[T] = Math.max(0, Math.min(255, P)), s[T + 1] = Math.max(0, Math.min(255, O)), s[T + 2] = Math.max(0, Math.min(255, _));
          }
      }
    return n.putImageData(a, 0, 0), e;
  } catch (n) {
    throw console.error("[WatermarkEngine] Failed to embed watermark:", n), n;
  }
}
function Jt(e, t = 8, n = 6, r = 99999, o = 99999) {
  if (!e)
    throw new TypeError("Box object is required");
  const a = Math.max(0, e.x - t), s = Math.max(0, e.y - n), l = Math.min(r, e.x + e.width + t), c = Math.min(o, e.y + e.height + n), h = l - a, m = c - s;
  return { x: a, y: s, width: h, height: m };
}
function Xt(e) {
  if (!Array.isArray(e) || e.length === 0)
    return [];
  if (e.length === 1) {
    const o = e[0];
    return [{
      x: o.x,
      y: o.y,
      width: o.width,
      height: o.height,
      detections: o.detection ? [o.detection] : []
    }];
  }
  console.log(`[MergeBoundingBoxes] Consolidating ${e.length} bounding boxes...`);
  const t = [...e].sort((o, a) => o.x - a.x), n = [];
  let r = {
    x: t[0].x,
    y: t[0].y,
    width: t[0].width,
    height: t[0].height,
    detections: t[0].detection ? [t[0].detection] : []
  };
  for (let o = 1; o < t.length; o++) {
    const a = t[o], s = r.x + r.width, l = r.y + r.height, c = a.x + a.width, h = a.y + a.height, m = a.x <= s + 15, i = Math.min(l, h) - Math.max(r.y, a.y) > 0;
    if (m && i) {
      const f = Math.min(r.x, a.x), p = Math.max(s, c), I = Math.min(r.y, a.y), A = Math.max(l, h);
      r.x = f, r.width = p - f, r.y = I, r.height = A - I, a.detection && (r.detections.some(
        (C) => C.type === a.detection.type && C.value === a.detection.value
      ) || r.detections.push(a.detection));
    } else
      n.push(r), r = {
        x: a.x,
        y: a.y,
        width: a.width,
        height: a.height,
        detections: a.detection ? [a.detection] : []
      };
  }
  return n.push(r), console.log(`[MergeBoundingBoxes] Consolidated into ${n.length} final bounding rectangles.`), n;
}
async function Ae(e, t, n = 15) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  if (!Array.isArray(t) || t.length === 0)
    return e;
  const r = e.getContext("2d");
  r.save();
  try {
    t.forEach((o) => {
      const { x: a, y: s, width: l, height: c } = o, h = Math.max(0, a), m = Math.max(0, s), i = Math.min(e.width - h, l), f = Math.min(e.height - m, c);
      if (i <= 0 || f <= 0)
        return;
      const p = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(i, f) : document.createElement("canvas");
      p.width = i, p.height = f, p.getContext("2d").drawImage(e, h, m, i, f, 0, 0, i, f), r.save();
      try {
        r.beginPath(), r.rect(h, m, i, f), r.clip(), r.filter = `blur(${n}px)`, r.drawImage(p, h, m);
      } finally {
        r.restore();
      }
    });
  } catch (o) {
    throw console.error("[BlurCanvas] Regional Gaussian blur execution failed:", o), o;
  } finally {
    r.restore();
  }
  return e;
}
function Qt(e) {
  const n = typeof OffscreenCanvas < "u" && e instanceof OffscreenCanvas ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
  return n.width = e.width, n.height = e.height, n.getContext("2d").drawImage(e, 0, 0), n;
}
async function er(e, t, n = "redact", r = {}) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  const o = Qt(e);
  if (!Array.isArray(t) || t.length === 0)
    return o;
  const {
    paddingX: a = 8,
    paddingY: s = 6,
    blurRadius: l = 15,
    pixelationScale: c = 8,
    fillStyle: h = "#000000"
  } = r;
  console.log(`[RedactCanvas] Running masking pipeline. Mode: ${n.toUpperCase()} on ${t.length} regions.`);
  const m = t.map(
    (p) => Jt(p, a, s, o.width, o.height)
  ), i = Xt(m), f = o.getContext("2d");
  return n === "redact" ? (f.fillStyle = h, i.forEach((p) => {
    const I = Math.max(0, p.x), A = Math.max(0, p.y), S = Math.min(o.width - I, p.width), C = Math.min(o.height - A, p.height);
    S > 0 && C > 0 && f.fillRect(I, A, S, C);
  })) : n === "blur" ? await Ae(o, i, l) : n === "pixelate" && tr(o, i, c), o;
}
function tr(e, t, n = 8) {
  const r = e.getContext("2d");
  t.forEach((o) => {
    const { x: a, y: s, width: l, height: c } = o, h = Math.max(0, a), m = Math.max(0, s), i = Math.min(e.width - h, l), f = Math.min(e.height - m, c);
    if (i <= 0 || f <= 0)
      return;
    const p = r.getImageData(h, m, i, f), I = p.data;
    for (let A = 0; A < f; A += n)
      for (let S = 0; S < i; S += n) {
        let C = 0, v = 0, k = 0, T = 0;
        for (let P = 0; P < n && A + P < f; P++)
          for (let O = 0; O < n && S + O < i; O++) {
            const _ = ((A + P) * i + (S + O)) * 4;
            C += I[_], v += I[_ + 1], k += I[_ + 2], T++;
          }
        const D = Math.round(C / T), R = Math.round(v / T), N = Math.round(k / T);
        for (let P = 0; P < n && A + P < f; P++)
          for (let O = 0; O < n && S + O < i; O++) {
            const _ = ((A + P) * i + (S + O)) * 4;
            I[_] = D, I[_ + 1] = R, I[_ + 2] = N;
          }
      }
    r.putImageData(p, h, m);
  });
}
async function rr(e, t) {
  return console.log("[AIService] Delegating adversarial cloaking request..."), Yt(e, { strength: t });
}
async function nr(e, t) {
  return console.log("[AIService] Delegating invisible watermark embedding..."), Kt(e, t);
}
async function or(e, t, n = "redact") {
  return console.log(`[AIService] Delegating redaction request (mode: ${n}) for ${t.length} regions.`), n === "blur" ? Ae(e, t, 8) : er(e, t, "redact", { fillStyle: "#000000" });
}
async function ar(e, t, n = {}) {
  const { blurMode: r = "redact" } = n;
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    if (!Array.isArray(t) || t.length === 0)
      return e;
    const o = [];
    return t.forEach((s) => {
      Array.isArray(s.bboxes) && s.bboxes.forEach((l) => {
        o.push({
          x: l.x,
          y: l.y,
          width: l.width,
          height: l.height
        });
      });
    }), o.length === 0 ? (console.log("[BlurService] No bounding boxes found in detections. Skipping redaction."), e) : (console.log(`[BlurService] Requesting redaction of ${o.length} bounding boxes in mode: ${r}`), await or(e, o, r));
  } catch (o) {
    throw console.error("[BlurService] Redaction processing failed:", o), o;
  }
}
const U = 8, B = 32;
async function sr(e) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    const t = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(B, B) : document.createElement("canvas");
    t.width = B, t.height = B;
    const n = t.getContext("2d");
    n.drawImage(e, 0, 0, B, B);
    const o = n.getImageData(0, 0, B, B).data, a = new Float32Array(B * B);
    for (let i = 0; i < o.length; i += 4)
      a[i / 4] = 0.299 * o[i] + 0.587 * o[i + 1] + 0.114 * o[i + 2];
    const s = Array.from({ length: U }, () => new Float32Array(U));
    for (let i = 0; i < U; i++)
      for (let f = 0; f < U; f++) {
        let p = 0;
        for (let S = 0; S < B; S++)
          for (let C = 0; C < B; C++)
            p += a[S * B + C] * Math.cos((2 * S + 1) * i * Math.PI / (2 * B)) * Math.cos((2 * C + 1) * f * Math.PI / (2 * B));
        const I = i === 0 ? 1 / Math.sqrt(2) : 1, A = f === 0 ? 1 / Math.sqrt(2) : 1;
        s[i][f] = 2 / B * I * A * p;
      }
    let l = 0;
    for (let i = 0; i < U; i++)
      for (let f = 0; f < U; f++)
        i === 0 && f === 0 || (l += s[i][f]);
    const c = l / (U * U - 1);
    let h = "";
    for (let i = 0; i < U; i++)
      for (let f = 0; f < U; f++)
        h += s[i][f] >= c ? "1" : "0";
    let m = "";
    for (let i = 0; i < 64; i += 4) {
      const f = h.substring(i, i + 4);
      m += parseInt(f, 2).toString(16);
    }
    return m;
  } catch (t) {
    throw console.error("[PHash] Error generating perceptual hash:", t), t;
  }
}
const q = 8, M = 16;
function pe(e, t) {
  const n = new Float32Array(t), r = t / 2;
  for (let o = 0; o < r; o++) {
    const a = e[2 * o], s = e[2 * o + 1];
    n[o] = (a + s) / Math.sqrt(2), n[r + o] = (a - s) / Math.sqrt(2);
  }
  for (let o = 0; o < t; o++)
    e[o] = n[o];
}
function ir(e) {
  for (let t = 0; t < M; t++) {
    const n = new Float32Array(M);
    for (let r = 0; r < M; r++)
      n[r] = e[t * M + r];
    pe(n, M);
    for (let r = 0; r < M; r++)
      e[t * M + r] = n[r];
  }
  for (let t = 0; t < M; t++) {
    const n = new Float32Array(M);
    for (let r = 0; r < M; r++)
      n[r] = e[r * M + t];
    pe(n, M);
    for (let r = 0; r < M; r++)
      e[r * M + t] = n[r];
  }
}
async function cr(e) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    const t = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(M, M) : document.createElement("canvas");
    t.width = M, t.height = M;
    const n = t.getContext("2d");
    n.drawImage(e, 0, 0, M, M);
    const o = n.getImageData(0, 0, M, M).data, a = new Float32Array(M * M);
    for (let i = 0; i < o.length; i += 4)
      a[i / 4] = 0.299 * o[i] + 0.587 * o[i + 1] + 0.114 * o[i + 2];
    ir(a);
    const s = Array.from({ length: q }, () => new Float32Array(q));
    let l = 0;
    for (let i = 0; i < q; i++)
      for (let f = 0; f < q; f++) {
        const p = a[i * M + f];
        s[i][f] = p, l += p;
      }
    const c = l / (q * q);
    let h = "";
    for (let i = 0; i < q; i++)
      for (let f = 0; f < q; f++)
        h += s[i][f] >= c ? "1" : "0";
    let m = "";
    for (let i = 0; i < 64; i += 4) {
      const f = h.substring(i, i + 4);
      m += parseInt(f, 2).toString(16);
    }
    return m;
  } catch (t) {
    throw console.error("[WHash] Error generating wavelet hash:", t), t;
  }
}
function lr(e, t, n) {
  return new Promise((r, o) => {
    if (!e)
      return o(new TypeError("Canvas parameter is required"));
    const a = t.replace(/(\.[\w\d]+)$/, "_protected$1");
    if (typeof OffscreenCanvas < "u" && e instanceof OffscreenCanvas)
      e.convertToBlob({ type: n }).then((s) => {
        if (!s)
          return o(new Error("Failed to extract binary blob from offscreen canvas"));
        const l = new File([s], a, {
          type: n,
          lastModified: Date.now()
        });
        r(l);
      }).catch(o);
    else {
      if (typeof e.toBlob != "function")
        return o(new TypeError("Canvas does not support toBlob operations"));
      e.toBlob((s) => {
        if (!s)
          return o(new Error("Failed to extract binary blob from canvas"));
        const l = new File([s], a, {
          type: n,
          lastModified: Date.now()
        });
        r(l);
      }, n);
    }
  });
}
async function ur(e, t = {}) {
  console.log(`[ProtectService] Initiating final protection pipeline for: ${e.name}`);
  const n = Date.now();
  try {
    const r = await Se(e), o = await sr(r), a = await cr(r);
    console.log("[ProtectService] Generated original fingerprints:", { phash: o, whash: a });
    const s = await qt(e, { preprocess: t });
    if (!s.success)
      throw new Error(`Scanning phase failed: ${s.error}`);
    if (!(s.riskLevel !== "low" || t.autoRedact))
      return console.log("[ProtectService] Document evaluated as low risk. Skipping edits."), {
        success: !0,
        originalFile: e,
        protectedFile: e,
        // Return original file unmodified
        phash: o,
        whash: a,
        metadata: {
          name: e.name,
          size: e.size,
          type: e.type
        },
        detections: [],
        risk: s.riskLevel,
        protectionSummary: {
          processingTime: Date.now() - n,
          redacted: !1
        }
      };
    console.log(`[ProtectService] Applying visual protections (Mode: ${t.blurMode || "redact"})...`);
    let c = await ar(r, s.detections, t);
    t.aiCloakEnabled && (c = await rr(c, 5)), t.watermarkEnabled && (c = await nr(c, "SafeLens_Protected_Asset"));
    const h = await lr(c, e.name, e.type);
    return console.log(`[ProtectService] Protection pipeline complete. Output file: ${h.name}`), {
      success: !0,
      originalFile: e,
      protectedFile: h,
      phash: o,
      whash: a,
      metadata: {
        name: e.name,
        size: e.size,
        type: e.type
      },
      detections: s.detections,
      risk: s.riskLevel,
      protectionSummary: {
        processingTime: Date.now() - n,
        redacted: !0
      }
    };
  } catch (r) {
    return console.error("[ProtectService] Critical pipeline crash:", r), {
      success: !1,
      originalFile: e,
      protectedFile: e,
      // Fallback to original file on failure
      phash: "",
      whash: "",
      metadata: {
        name: e.name,
        size: e.size,
        type: e.type
      },
      detections: [],
      risk: "low",
      protectionSummary: {
        processingTime: Date.now() - n,
        redacted: !1
      },
      error: r instanceof Error ? r.message : "Unknown protection pipeline failure"
    };
  }
}
class dr {
  constructor() {
    this.baseUrl = "https://safelens-zttx.onrender.com";
  }
  async fetchWithRetry(t, n = {}, r = 3, o = 1e3) {
    let a = null, s = null;
    for (let l = 0; l < r; l++) {
      try {
        const c = await fetch(t, n);
        if (c.ok)
          return c;
        if (s = c, c.status >= 500 && c.status < 600)
          console.warn(`[BridgeClient] Transient server error ${c.status}. Retrying in ${o}ms... (Attempt ${l + 1}/${r})`);
        else
          return c;
      } catch (c) {
        a = c, console.warn(`[BridgeClient] Network/connection error: ${c.message}. Retrying in ${o}ms... (Attempt ${l + 1}/${r})`);
      }
      l < r - 1 && await new Promise((c) => setTimeout(c, o));
    }
    if (a)
      throw a;
    return s;
  }
  async checkHealth() {
    console.log("[BridgeClient] Querying service connectivity health...");
    try {
      const t = await this.fetchWithRetry(`${this.baseUrl}/api/health`, { method: "GET" });
      if (!t.ok)
        throw new Error(`HTTP ${t.status}`);
      const n = await t.json();
      if (n.success)
        return {
          success: !0,
          status: n.data.status || "healthy",
          version: n.data.version || "1.0.0"
        };
      throw new Error(n.message || "Malformed health response");
    } catch (t) {
      return console.warn("[BridgeClient] Health check failed, operating in offline fallback mode:", t.message), { success: !1, status: "offline", version: "0.0.0" };
    }
  }
  /**
   * Transmits binary blob image multipart form data strictly from Service Worker
   */
  async uploadProtectedAsset(t, n) {
    console.log("[BridgeClient] Transferring protected asset file to live Render endpoints:", t.name);
    try {
      const r = new FormData();
      r.append("image", t), r.append("blur_enabled", n.blur_enabled), r.append("ai_cloak", n.ai_cloak), r.append("watermark", n.watermark);
      const o = await this.fetchWithRetry(`${this.baseUrl}/api/protect`, {
        method: "POST",
        body: r
      });
      if (!o.ok)
        throw new Error(`Server returned HTTP code status ${o.status}`);
      const a = await o.json();
      if (a.success && a.data)
        return { success: !0, assetId: a.data.asset_id };
      throw new Error(a.message || "Malformed transaction result from deployed cluster");
    } catch (r) {
      return console.error("[BridgeClient] Isolated binary asset registration failure:", r.message), { success: !1, error: r.message };
    }
  }
  async syncScanResult(t) {
    if (!t)
      throw new Error("Scan report payload is required");
    return console.log("[BridgeClient] Syncing scan report to FastAPI backend dashboard:", t.metadata.name), {
      success: (await this.checkHealth()).success,
      syncId: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
  }
  /**
   * Triggers an incident alert notification on the backend when PII is intercepted.
   */
  async sendIncidentNotification(t) {
    if (!t)
      throw new Error("Incident payload is required");
    const n = `${this.baseUrl}/api/incidents`;
    console.warn(`[BridgeClient] Dispatching PRIVACY INCIDENT ALERT to target: ${n} on asset ID: ${t.assetId}`);
    try {
      const r = {
        asset_id: parseInt(t.assetId, 10),
        matched_url: String(t.matchedUrl || "unknown"),
        match_confidence: parseFloat(t.matchConfidence) || 0.8,
        severity: String(t.severity || "Normal"),
        status: String(t.status || "Open")
      }, o = await this.fetchWithRetry(n, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(r)
      });
      if (o.status === 405 || o.status === 404)
        return console.warn(`[BridgeClient] POST method is unregistered on backend (${o.status}). Bypassing incident tracking gracefully to keep extension running.`), { success: !0, incidentId: `mock_inc_${Date.now()}` };
      if (!o.ok)
        throw new Error(`HTTP status verification failed: ${o.status}`);
      const a = await o.json();
      return a.success && a.data ? (console.log("[BridgeClient] Backend incident alert logged successfully. ID:", a.data.incident_id), { success: !0, incidentId: a.data.incident_id }) : { success: !0, incidentId: `mock_inc_${Date.now()}` };
    } catch (r) {
      return console.error("[BridgeClient] Incident pipeline warning handled:", r.message), { success: !0, incidentId: `mock_inc_${Date.now()}` };
    }
  }
  async syncSettings(t) {
    if (!t)
      throw new Error("Settings payload is required");
    console.log("[BridgeClient] Synchronizing Settings preferences with server profile...");
    const n = { high: 90, medium: 70, low: 50 };
    try {
      const r = await this.fetchWithRetry(`${this.baseUrl}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_blur: t.blurMode === "blur",
          watermark_enabled: t.watermarkEnabled === !0,
          ai_cloak_enabled: t.aiCloakEnabled === !0,
          notifications: t.protectionEnabled === !0,
          similarity_threshold: n[t.riskLevelThreshold] || 70
        })
      });
      if (!r.ok)
        throw new Error(`HTTP ${r.status}`);
      return { success: (await r.json()).success === !0 };
    } catch (r) {
      return console.error("[BridgeClient] Central settings synchronization failed:", r.message), { success: !1 };
    }
  }
}
const re = new dr();
let we = Promise.resolve();
const fr = {
  PING: async () => (console.log("[MessageRouter] PING message received. Sending PING response."), { ok: !0 }),
  PREPROCESS_IMAGE: async (e) => {
    if (!e || !e.arrayBuffer)
      throw new Error("Invalid payload: arrayBuffer is required");
    await ye();
    const { arrayBuffer: t, type: n, settings: r } = e, o = new Blob([t], { type: n || "image/png" }), a = await createImageBitmap(o), s = new OffscreenCanvas(a.width, a.height);
    s.getContext("2d").drawImage(a, 0, 0);
    const c = await xe(s, r);
    return {
      arrayBuffer: await (await c.convertToBlob({ type: n || "image/png" })).arrayBuffer(),
      width: c.width,
      height: c.height
    };
  },
  RUN_PROTECT_PIPELINE: async (e) => {
    if (!e || !e.arrayBuffer && !e.storageKey)
      throw new Error("Invalid payload: arrayBuffer or storageKey is required");
    let t = e.arrayBuffer;
    e.storageKey && (t = (await chrome.storage.session.get(e.storageKey))[e.storageKey], await chrome.storage.session.remove(e.storageKey), console.log("[MessageRouter] image transferred via storage.session successfully"));
    const { name: n, type: r, settings: o } = e;
    await ye();
    const a = {
      name: n || "upload.png",
      size: t.byteLength,
      type: r || "image/png",
      arrayBuffer: () => Promise.resolve(t)
    }, s = await ur(a, o);
    let l;
    s.protectedFile && typeof s.protectedFile.arrayBuffer == "function" ? l = await s.protectedFile.arrayBuffer() : l = t;
    const c = "protected_image_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    return await chrome.storage.session.set({ [c]: l }), {
      success: s.success !== !1,
      storageKey: c,
      name: s.protectedFile && s.protectedFile.name || n,
      type: s.protectedFile && s.protectedFile.type || r,
      phash: s.phash || "",
      whash: s.whash || "",
      detections: s.detections || [],
      risk: s.risk || "low",
      protectionSummary: s.protectionSummary || { processingTime: 0, redacted: !1 },
      error: s.error
    };
  },
  /**
   * New Handler: Securely executes binary uploads to deployed Render production API from SW context
   */
  REGISTER_BACKEND_ASSET: async (e) => {
    if (!e || !e.storageKey)
      throw new Error("Invalid payload: storageKey containing image buffer is mandatory");
    const n = (await chrome.storage.session.get(e.storageKey))[e.storageKey];
    if (await chrome.storage.session.remove(e.storageKey), !n)
      throw new Error("Image data not found in background session allocation room");
    const r = new Blob([n], { type: e.type || "image/png" }), o = new File([r], e.name || "upload.png", { type: e.type || "image/png" });
    return console.log("[MessageRouter] Dispatching isolated proxy upload process via BridgeClient framework..."), await re.uploadProtectedAsset(o, {
      blur_enabled: e.blur_enabled,
      ai_cloak: e.ai_cloak,
      watermark: e.watermark
    });
  },
  SET_SETTINGS: async (e) => {
    if (!e || typeof e != "object")
      throw new Error("Invalid settings payload");
    await chrome.storage.local.set({ settings: e });
    try {
      await re.syncSettings(e);
    } catch (t) {
      console.warn("[MessageRouter] Settings sync failed:", t);
    }
    return { success: !0 };
  },
  GET_SETTINGS: async () => (await chrome.storage.local.get("settings")).settings || {},
  LOG_SCAN: async (e, t) => {
    if (!e || !e.scanId)
      throw new Error("Invalid scan log payload");
    let n;
    const r = new Promise((o) => {
      we.then(() => o());
    });
    we = new Promise((o) => {
      n = o;
    }), await r;
    try {
      const { scans: o = [] } = await chrome.storage.local.get("scans"), a = [e, ...o].slice(0, 100);
      await chrome.storage.local.set({ scans: a });
      try {
        if (await re.syncScanResult({
          metadata: { name: e.fileName, size: e.size, type: "image/png" },
          ...e
        }), e.riskLevel !== "low" && e.assetId) {
          const s = t && (t.url || t.origin) || "unknown", l = await re.sendIncidentNotification({
            assetId: e.assetId,
            matchedUrl: s,
            matchConfidence: e.confidence,
            severity: e.riskLevel === "critical" ? "Serious" : "Normal",
            status: "Open"
          });
          if (l && l.success && l.incidentId) {
            e.incidentId = l.incidentId;
            const { scans: c = [] } = await chrome.storage.local.get("scans"), h = c.map((m) => m.scanId === e.scanId ? { ...m, incidentId: l.incidentId } : m);
            await chrome.storage.local.set({ scans: h }), console.log("[MessageRouter] Linked local scan record with backend incident ID:", l.incidentId);
          }
        }
      } catch (s) {
        console.warn("[MessageRouter] Failed to sync scan metadata with BridgeClient:", s);
      }
    } finally {
      n();
    }
    return { success: !0 };
  }
};
async function ye() {
  if (!(typeof document > "u" && typeof chrome < "u" && chrome.offscreen) && !(typeof cv < "u" && cv.matFromImageData))
    return new Promise((e, t) => {
      let n = 0;
      const r = setInterval(() => {
        n++, typeof cv < "u" && cv.matFromImageData ? (clearInterval(r), e()) : n > 50 && (clearInterval(r), t(new Error("OpenCV.js WASM compilation timed out (5s)")));
      }, 100);
    });
}
async function hr(e, t) {
  try {
    if (!e || typeof e != "object")
      return { success: !1, error: "Malformed message: Message must be an object" };
    const { type: n, payload: r } = e;
    if (!n || typeof n != "string")
      return { success: !1, error: "Malformed message: Missing type property" };
    console.log(`[MessageRouter] Routing message type: ${n}`, { senderId: t.id, origin: t.origin });
    const o = fr[n];
    return o ? { success: !0, data: await o(r, t) } : (console.warn(`[MessageRouter] Unknown message type: ${n}`), { success: !1, error: `Unknown message type: '${n}'` });
  } catch (n) {
    return console.error("[MessageRouter] Error routing message:", n), {
      success: !1,
      error: n instanceof Error ? n.message : "Internal background processing error"
    };
  }
}
chrome.storage.session && chrome.storage.session.setAccessLevel && (chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" }), console.log("[ServiceWorker] chrome.storage.session.setAccessLevel() executed"));
chrome.runtime.onInstalled.addListener(async (e) => {
  if (console.log(`[ServiceWorker] Extension installation event: ${e.reason}`), e.reason === "install")
    try {
      (await chrome.storage.local.get("settings")).settings || (await chrome.storage.local.set({
        settings: ke,
        scans: []
        // Initialize scan log history
      }), console.log("[ServiceWorker] Default settings storage initialized."));
    } catch (t) {
      console.error("[ServiceWorker] Error initializing storage settings:", t);
    }
  else e.reason === "update" && console.log("[ServiceWorker] SafeLens successfully updated to new version.");
});
chrome.runtime.onMessage.addListener((e, t, n) => (console.log("[ServiceWorker] Raw onMessage received:", e ? e.type : "unknown"), hr(e, t).then((r) => {
  if (r && r.success && r.payload) {
    const o = r.payload;
    console.log("===== RESULT FROM OFFSCREEN ====="), console.log(o), console.log(o.data), console.log(o.data?.constructor?.name), console.log(o.data?.byteLength), console.log(o.data?.length);
  }
  n(r);
}).catch((r) => {
  console.error("[ServiceWorker] Message routing failure:", r), n({
    success: !1,
    error: r instanceof Error ? r.message : "Async processing exception"
  });
}), !0));
