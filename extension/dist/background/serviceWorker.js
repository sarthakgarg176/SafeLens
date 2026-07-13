const Me = {
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
async function De(e, t = 1920, r = 1080) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let n = null, o = null;
  try {
    let { width: a, height: i } = e, s = !1;
    if (a > t && (i = Math.round(i * t / a), a = t, s = !0), i > r && (a = Math.round(a * r / i), i = r, s = !0), !s)
      return e;
    if (console.log(`[Resize] Scaling image down to ${a}x${i} using cv.resize`), typeof cv > "u" || !cv.matFromImageData)
      throw new Error("OpenCV.js runtime is not loaded");
    const f = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height);
    n = cv.matFromImageData(f), o = new cv.Mat();
    const m = new cv.Size(a, i);
    cv.resize(n, o, m, 0, 0, cv.INTER_AREA);
    const c = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(a, i) : document.createElement("canvas");
    c.width = a, c.height = i;
    const h = c.getContext("2d", { willReadFrequently: !0 }), v = new ImageData(new Uint8ClampedArray(o.data), o.cols, o.rows);
    return h.putImageData(v, 0, 0), c;
  } catch (a) {
    console.warn("[Resize] OpenCV resizing failed. Falling back to native canvas context scaling:", a);
    try {
      const { width: i, height: s } = e;
      let l = i, f = s;
      l > t && (f = Math.round(f * t / l), l = t), f > r && (l = Math.round(l * r / f), f = r);
      const m = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(l, f) : document.createElement("canvas");
      m.width = l, m.height = f;
      const c = m.getContext("2d", { willReadFrequently: !0 });
      return c.imageSmoothingEnabled = !0, c.imageSmoothingQuality = "high", c.drawImage(e, 0, 0, l, f), m;
    } catch (i) {
      return console.error("[Resize] Native canvas resizing fallback failed. Returning original image.", i), e;
    }
  } finally {
    n && n.delete(), o && o.delete();
  }
}
async function Oe(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let t = null, r = null, n = null;
  try {
    if (typeof cv > "u" || !cv.cvtColor)
      throw new Error("OpenCV.js runtime is not loaded");
    const a = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(a), r = new cv.Mat(), cv.cvtColor(t, r, cv.COLOR_RGBA2GRAY), n = new cv.Mat(), cv.cvtColor(r, n, cv.COLOR_GRAY2RGBA);
    const i = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    i.width = e.width, i.height = e.height;
    const s = i.getContext("2d", { willReadFrequently: !0 }), l = new ImageData(new Uint8ClampedArray(n.data), n.cols, n.rows);
    return s.putImageData(l, 0, 0), i;
  } catch (o) {
    console.warn("[Grayscale] OpenCV conversion failed. Falling back to native JS luminosity conversions:", o);
    try {
      const i = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height), s = i.data;
      for (let f = 0; f < s.length; f += 4) {
        const m = s[f], c = s[f + 1], h = s[f + 2], v = Math.round(0.299 * m + 0.587 * c + 0.114 * h);
        s[f] = v, s[f + 1] = v, s[f + 2] = v;
      }
      const l = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
      return l.width = e.width, l.height = e.height, l.getContext("2d", { willReadFrequently: !0 }).putImageData(i, 0, 0), l;
    } catch (a) {
      return console.error("[Grayscale] JS grayscale fallback failed. Returning original image.", a), e;
    }
  } finally {
    t && t.delete(), r && r.delete(), n && n.delete();
  }
}
async function Te(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let t = null, r = null;
  try {
    if (typeof cv > "u" || !cv.GaussianBlur)
      throw new Error("OpenCV.js runtime is not loaded");
    const o = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(o), r = new cv.Mat();
    const a = new cv.Size(3, 3);
    cv.GaussianBlur(t, r, a, 0, 0, cv.BORDER_DEFAULT);
    const i = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    i.width = e.width, i.height = e.height;
    const s = i.getContext("2d", { willReadFrequently: !0 }), l = new ImageData(new Uint8ClampedArray(r.data), r.cols, r.rows);
    return s.putImageData(l, 0, 0), i;
  } catch (n) {
    return console.warn("[Denoise] Denoising failed. Skipping this stage and returning original canvas:", n), e;
  } finally {
    t && t.delete(), r && r.delete();
  }
}
async function Be(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let t = null, r = null, n = null, o = null, a = null, i = null;
  try {
    if (typeof cv > "u" || !cv.HoughLinesP)
      throw new Error("OpenCV.js runtime is not loaded");
    const l = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(l), r = new cv.Mat(), n = new cv.Mat(), o = new cv.Mat(), cv.cvtColor(t, r, cv.COLOR_RGBA2GRAY), cv.Canny(r, n, 50, 200, 3), cv.HoughLinesP(n, o, 1, Math.PI / 180, 100, 50, 10);
    let f = 0, m = 0;
    for (let b = 0; b < o.rows; ++b) {
      const x = o.data32S[b * 4], I = o.data32S[b * 4 + 1], M = o.data32S[b * 4 + 2], D = o.data32S[b * 4 + 3], T = Math.atan2(D - I, M - x) * (180 / Math.PI);
      T > -45 && T < 45 && (f += T, m++);
    }
    if (m < 3)
      return console.log("[Deskew] Insufficient line segments detected. Skipping deskew."), { canvas: e, angle: 0 };
    const c = f / m;
    if (Math.abs(c) < 0.5)
      return console.log(`[Deskew] Skew angle is negligible (${c.toFixed(2)} deg). Skipping rotation.`), { canvas: e, angle: 0 };
    console.log(`[Deskew] Correcting skew angle: ${c.toFixed(2)} degrees`);
    const h = new cv.Point(e.width / 2, e.height / 2);
    i = cv.getRotationMatrix2D(h, c, 1), a = new cv.Mat();
    const v = new cv.Size(e.width, e.height);
    cv.warpAffine(t, a, i, v, cv.INTER_CUBIC, cv.BORDER_REPLICATE);
    const y = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    y.width = e.width, y.height = e.height;
    const A = y.getContext("2d", { willReadFrequently: !0 }), R = new ImageData(new Uint8ClampedArray(a.data), a.cols, a.rows);
    return A.putImageData(R, 0, 0), { canvas: y, angle: c };
  } catch (s) {
    return console.warn("[Deskew] Hough deskewing failed. Skipping this stage and returning original canvas:", s), { canvas: e, angle: 0 };
  } finally {
    t && t.delete(), r && r.delete(), n && n.delete(), o && o.delete(), a && a.delete(), i && i.delete();
  }
}
async function Pe(e, t = 127) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let r = null, n = null, o = null, a = null;
  try {
    if (typeof cv > "u" || !cv.adaptiveThreshold)
      throw new Error("OpenCV.js runtime is not loaded");
    const s = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height);
    r = cv.matFromImageData(s), n = new cv.Mat(), cv.cvtColor(r, n, cv.COLOR_RGBA2GRAY), o = new cv.Mat(), cv.adaptiveThreshold(
      n,
      o,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      11,
      2
    ), a = new cv.Mat(), cv.cvtColor(o, a, cv.COLOR_GRAY2RGBA);
    const l = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    l.width = e.width, l.height = e.height;
    const f = l.getContext("2d", { willReadFrequently: !0 }), m = new ImageData(new Uint8ClampedArray(a.data), a.cols, a.rows);
    return f.putImageData(m, 0, 0), l;
  } catch (i) {
    console.warn("[Threshold] OpenCV adaptive thresholding failed. Falling back to grayscale image:", i);
    try {
      return await Le(e);
    } catch (s) {
      return console.error("[Threshold] Grayscale fallback failed. Returning original canvas.", s), e;
    }
  } finally {
    r && r.delete(), n && n.delete(), o && o.delete(), a && a.delete();
  }
}
async function Le(e) {
  const r = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height), n = r.data;
  for (let a = 0; a < n.length; a += 4) {
    const i = Math.round(0.299 * n[a] + 0.587 * n[a + 1] + 0.114 * n[a + 2]);
    n[a] = i, n[a + 1] = i, n[a + 2] = i;
  }
  const o = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
  return o.width = e.width, o.height = e.height, o.getContext("2d", { willReadFrequently: !0 }).putImageData(r, 0, 0), o;
}
let X = null;
async function _e() {
  if (typeof chrome > "u" || !chrome.offscreen)
    return;
  const e = "public/offscreen.html";
  let t = !1;
  if (chrome.runtime.getContexts && (t = (await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(e)]
  })).length > 0), t) {
    try {
      if (await new Promise((n) => {
        const o = setTimeout(() => n(!1), 1e3);
        chrome.runtime.sendMessage({ target: "offscreen", type: "PING" }, (a) => {
          clearTimeout(o), n(a && a.from === "offscreen");
        });
      }))
        return;
    } catch {
    }
    console.warn("[OffscreenManager] Offscreen document unresponsive. Recreating...");
    try {
      await chrome.offscreen.closeDocument();
    } catch {
    }
  }
  if (X) {
    await X;
    return;
  }
  X = chrome.offscreen.createDocument({
    url: e,
    reasons: ["DOM_SCRAPING"],
    justification: "OpenCV image preprocessing requires canvas DOM context"
  });
  try {
    await X;
  } catch (r) {
    if (!r.message.includes("Only a single offscreen"))
      throw r;
  } finally {
    X = null;
  }
}
async function Fe(e, t, r = 15e3) {
  await _e();
  const n = (o = 3) => new Promise((a, i) => {
    let s = setTimeout(() => {
      i(new Error(`Offscreen execution timed out after ${r}ms`));
    }, r);
    console.log("========= BEFORE SENDMESSAGE ========="), console.log(t), console.log(t.data?.constructor?.name), console.log(t.data?.byteLength), console.log("======================================"), chrome.runtime.sendMessage({
      target: "offscreen",
      type: e,
      payload: t
    }, (l) => {
      if (clearTimeout(s), chrome.runtime.lastError) {
        const f = chrome.runtime.lastError.message;
        if (f.includes("Could not establish connection") && o > 0) {
          console.warn(`[OffscreenManager] Connection failed (${f}). Retrying in 100ms... (${o} retries left)`), setTimeout(() => {
            n(o - 1).then(a, i);
          }, 100);
          return;
        }
        return i(new Error(f));
      }
      if (!l)
        return i(new Error("No response received from offscreen document"));
      if (!l.success)
        return i(new Error(l.error || "Offscreen processing failed"));
      a(l.payload);
    });
  });
  return n();
}
async function Ee(e, t = {}) {
  if (typeof document > "u" && typeof chrome < "u" && chrome.offscreen)
    return e;
  const {
    enableDenoise: r = !1,
    // ID cards ke liye false rakha hai
    enableDeskew: n = !0,
    thresholdValue: o = 0,
    // 0 = Skip thresholding to preserve edges
    maxWidth: a = 1920,
    maxHeight: i = 1080
  } = t;
  console.log("[Preprocessor] Beginning Safe-Mode pipeline...");
  let s = e;
  try {
    return s = await De(s, a, i), s = await Oe(s), r && (s = await Te(s)), n && (s = (await Be(s)).canvas), o > 0 && (s = await Pe(s, o)), s;
  } catch (l) {
    return console.error("[Preprocessor] Pipeline failure, returning raw.", l), e;
  }
}
var Ne = { exports: {} };
(function(e) {
  var t = function(r) {
    var n = Object.prototype, o = n.hasOwnProperty, a = Object.defineProperty || function(d, u, g) {
      d[u] = g.value;
    }, i, s = typeof Symbol == "function" ? Symbol : {}, l = s.iterator || "@@iterator", f = s.asyncIterator || "@@asyncIterator", m = s.toStringTag || "@@toStringTag";
    function c(d, u, g) {
      return Object.defineProperty(d, u, {
        value: g,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }), d[u];
    }
    try {
      c({}, "");
    } catch {
      c = function(u, g, p) {
        return u[g] = p;
      };
    }
    function h(d, u, g, p) {
      var w = u && u.prototype instanceof I ? u : I, S = Object.create(w.prototype), L = new Z(p || []);
      return a(S, "_invoke", { value: oe(d, g, L) }), S;
    }
    r.wrap = h;
    function v(d, u, g) {
      try {
        return { type: "normal", arg: d.call(u, g) };
      } catch (p) {
        return { type: "throw", arg: p };
      }
    }
    var y = "suspendedStart", A = "suspendedYield", R = "executing", b = "completed", x = {};
    function I() {
    }
    function M() {
    }
    function D() {
    }
    var T = {};
    c(T, l, function() {
      return this;
    });
    var N = Object.getPrototypeOf, B = N && N(N(C([])));
    B && B !== n && o.call(B, l) && (T = B);
    var O = D.prototype = I.prototype = Object.create(T);
    M.prototype = D, a(O, "constructor", { value: D, configurable: !0 }), a(
      D,
      "constructor",
      { value: M, configurable: !0 }
    ), M.displayName = c(
      D,
      m,
      "GeneratorFunction"
    );
    function P(d) {
      ["next", "throw", "return"].forEach(function(u) {
        c(d, u, function(g) {
          return this._invoke(u, g);
        });
      });
    }
    r.isGeneratorFunction = function(d) {
      var u = typeof d == "function" && d.constructor;
      return u ? u === M || // For the native GeneratorFunction constructor, the best we can
      // do is to check its .name property.
      (u.displayName || u.name) === "GeneratorFunction" : !1;
    }, r.mark = function(d) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(d, D) : (d.__proto__ = D, c(d, m, "GeneratorFunction")), d.prototype = Object.create(O), d;
    }, r.awrap = function(d) {
      return { __await: d };
    };
    function H(d, u) {
      function g(S, L, $, z) {
        var q = v(d[S], d, L);
        if (q.type === "throw")
          z(q.arg);
        else {
          var ie = q.arg, K = ie.value;
          return K && typeof K == "object" && o.call(K, "__await") ? u.resolve(K.__await).then(function(j) {
            g("next", j, $, z);
          }, function(j) {
            g("throw", j, $, z);
          }) : u.resolve(K).then(function(j) {
            ie.value = j, $(ie);
          }, function(j) {
            return g("throw", j, $, z);
          });
        }
      }
      var p;
      function w(S, L) {
        function $() {
          return new u(function(z, q) {
            g(S, L, z, q);
          });
        }
        return p = // If enqueue has been called before, then we want to wait until
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
        p ? p.then(
          $,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          $
        ) : $();
      }
      a(this, "_invoke", { value: w });
    }
    P(H.prototype), c(H.prototype, f, function() {
      return this;
    }), r.AsyncIterator = H, r.async = function(d, u, g, p, w) {
      w === void 0 && (w = Promise);
      var S = new H(
        h(d, u, g, p),
        w
      );
      return r.isGeneratorFunction(u) ? S : S.next().then(function(L) {
        return L.done ? L.value : S.next();
      });
    };
    function oe(d, u, g) {
      var p = y;
      return function(S, L) {
        if (p === R)
          throw new Error("Generator is already running");
        if (p === b) {
          if (S === "throw")
            throw L;
          return E();
        }
        for (g.method = S, g.arg = L; ; ) {
          var $ = g.delegate;
          if ($) {
            var z = Q($, g);
            if (z) {
              if (z === x) continue;
              return z;
            }
          }
          if (g.method === "next")
            g.sent = g._sent = g.arg;
          else if (g.method === "throw") {
            if (p === y)
              throw p = b, g.arg;
            g.dispatchException(g.arg);
          } else g.method === "return" && g.abrupt("return", g.arg);
          p = R;
          var q = v(d, u, g);
          if (q.type === "normal") {
            if (p = g.done ? b : A, q.arg === x)
              continue;
            return {
              value: q.arg,
              done: g.done
            };
          } else q.type === "throw" && (p = b, g.method = "throw", g.arg = q.arg);
        }
      };
    }
    function Q(d, u) {
      var g = u.method, p = d.iterator[g];
      if (p === i)
        return u.delegate = null, g === "throw" && d.iterator.return && (u.method = "return", u.arg = i, Q(d, u), u.method === "throw") || g !== "return" && (u.method = "throw", u.arg = new TypeError(
          "The iterator does not provide a '" + g + "' method"
        )), x;
      var w = v(p, d.iterator, u.arg);
      if (w.type === "throw")
        return u.method = "throw", u.arg = w.arg, u.delegate = null, x;
      var S = w.arg;
      if (!S)
        return u.method = "throw", u.arg = new TypeError("iterator result is not an object"), u.delegate = null, x;
      if (S.done)
        u[d.resultName] = S.value, u.next = d.nextLoc, u.method !== "return" && (u.method = "next", u.arg = i);
      else
        return S;
      return u.delegate = null, x;
    }
    P(O), c(O, m, "Generator"), c(O, l, function() {
      return this;
    }), c(O, "toString", function() {
      return "[object Generator]";
    });
    function ae(d) {
      var u = { tryLoc: d[0] };
      1 in d && (u.catchLoc = d[1]), 2 in d && (u.finallyLoc = d[2], u.afterLoc = d[3]), this.tryEntries.push(u);
    }
    function V(d) {
      var u = d.completion || {};
      u.type = "normal", delete u.arg, d.completion = u;
    }
    function Z(d) {
      this.tryEntries = [{ tryLoc: "root" }], d.forEach(ae, this), this.reset(!0);
    }
    r.keys = function(d) {
      var u = Object(d), g = [];
      for (var p in u)
        g.push(p);
      return g.reverse(), function w() {
        for (; g.length; ) {
          var S = g.pop();
          if (S in u)
            return w.value = S, w.done = !1, w;
        }
        return w.done = !0, w;
      };
    };
    function C(d) {
      if (d) {
        var u = d[l];
        if (u)
          return u.call(d);
        if (typeof d.next == "function")
          return d;
        if (!isNaN(d.length)) {
          var g = -1, p = function w() {
            for (; ++g < d.length; )
              if (o.call(d, g))
                return w.value = d[g], w.done = !1, w;
            return w.value = i, w.done = !0, w;
          };
          return p.next = p;
        }
      }
      return { next: E };
    }
    r.values = C;
    function E() {
      return { value: i, done: !0 };
    }
    return Z.prototype = {
      constructor: Z,
      reset: function(d) {
        if (this.prev = 0, this.next = 0, this.sent = this._sent = i, this.done = !1, this.delegate = null, this.method = "next", this.arg = i, this.tryEntries.forEach(V), !d)
          for (var u in this)
            u.charAt(0) === "t" && o.call(this, u) && !isNaN(+u.slice(1)) && (this[u] = i);
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
        function g(z, q) {
          return S.type = "throw", S.arg = d, u.next = z, q && (u.method = "next", u.arg = i), !!q;
        }
        for (var p = this.tryEntries.length - 1; p >= 0; --p) {
          var w = this.tryEntries[p], S = w.completion;
          if (w.tryLoc === "root")
            return g("end");
          if (w.tryLoc <= this.prev) {
            var L = o.call(w, "catchLoc"), $ = o.call(w, "finallyLoc");
            if (L && $) {
              if (this.prev < w.catchLoc)
                return g(w.catchLoc, !0);
              if (this.prev < w.finallyLoc)
                return g(w.finallyLoc);
            } else if (L) {
              if (this.prev < w.catchLoc)
                return g(w.catchLoc, !0);
            } else if ($) {
              if (this.prev < w.finallyLoc)
                return g(w.finallyLoc);
            } else
              throw new Error("try statement without catch or finally");
          }
        }
      },
      abrupt: function(d, u) {
        for (var g = this.tryEntries.length - 1; g >= 0; --g) {
          var p = this.tryEntries[g];
          if (p.tryLoc <= this.prev && o.call(p, "finallyLoc") && this.prev < p.finallyLoc) {
            var w = p;
            break;
          }
        }
        w && (d === "break" || d === "continue") && w.tryLoc <= u && u <= w.finallyLoc && (w = null);
        var S = w ? w.completion : {};
        return S.type = d, S.arg = u, w ? (this.method = "next", this.next = w.finallyLoc, x) : this.complete(S);
      },
      complete: function(d, u) {
        if (d.type === "throw")
          throw d.arg;
        return d.type === "break" || d.type === "continue" ? this.next = d.arg : d.type === "return" ? (this.rval = this.arg = d.arg, this.method = "return", this.next = "end") : d.type === "normal" && u && (this.next = u), x;
      },
      finish: function(d) {
        for (var u = this.tryEntries.length - 1; u >= 0; --u) {
          var g = this.tryEntries[u];
          if (g.finallyLoc === d)
            return this.complete(g.completion, g.afterLoc), V(g), x;
        }
      },
      catch: function(d) {
        for (var u = this.tryEntries.length - 1; u >= 0; --u) {
          var g = this.tryEntries[u];
          if (g.tryLoc === d) {
            var p = g.completion;
            if (p.type === "throw") {
              var w = p.arg;
              V(g);
            }
            return w;
          }
        }
        throw new Error("illegal catch attempt");
      },
      delegateYield: function(d, u, g) {
        return this.delegate = {
          iterator: C(d),
          resultName: u,
          nextLoc: g
        }, this.method === "next" && (this.arg = i), x;
      }
    }, r;
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
})(Ne);
var Se = (e, t) => `${e}-${t}-${Math.random().toString(16).slice(3, 8)}`;
const $e = Se;
let de = 0;
var qe = ({
  id: e,
  action: t,
  payload: r = {}
}) => {
  let n = e;
  return typeof n > "u" && (n = $e("Job", de), de += 1), {
    id: n,
    action: t,
    payload: r
  };
}, ne = {};
let ue = !1;
ne.logging = ue;
ne.setLogging = (e) => {
  ue = e;
};
ne.log = (...e) => ue ? console.log.apply(void 0, e) : null;
function ze(e) {
  throw new Error('Could not dynamically require "' + e + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var Ge = (e) => {
  const t = {};
  return typeof WorkerGlobalScope < "u" ? t.type = "webworker" : typeof document == "object" ? t.type = "browser" : typeof process == "object" && typeof ze == "function" && (t.type = "node"), typeof e > "u" ? t : t[e];
};
const Ue = Ge("type") === "browser", We = Ue ? (e) => new URL(e, window.location.href).href : (e) => e;
var je = (e) => {
  const t = { ...e };
  return ["corePath", "workerPath", "langPath"].forEach((r) => {
    e[r] && (t[r] = We(t[r]));
  }), t;
}, Ye = {
  TESSERACT_ONLY: 0,
  LSTM_ONLY: 1,
  TESSERACT_LSTM_COMBINED: 2,
  DEFAULT: 3
};
const He = "7.0.0", Ve = {
  version: He
};
var Ze = {
  /*
   * Use BlobURL for worker script by default
   * TODO: remove this option
   *
   */
  workerBlobURL: !0,
  logger: () => {
  }
};
const Ke = Ve.version, Xe = Ze;
var Je = {
  ...Xe,
  workerPath: `https://cdn.jsdelivr.net/npm/tesseract.js@v${Ke}/dist/worker.min.js`
}, Qe = ({ workerPath: e, workerBlobURL: t }) => {
  let r;
  if (Blob && URL && t) {
    const n = new Blob([`importScripts("${e}");`], {
      type: "application/javascript"
    });
    r = new Worker(URL.createObjectURL(n));
  } else
    r = new Worker(e);
  return r;
}, et = (e) => {
  e.terminate();
}, tt = (e, t) => {
  e.onmessage = ({ data: r }) => {
    t(r);
  };
}, rt = async (e, t) => {
  e.postMessage(t);
};
const se = (e) => new Promise((t, r) => {
  const n = new FileReader();
  n.onload = () => {
    t(n.result);
  }, n.onerror = ({ target: { error: { code: o } } }) => {
    r(Error(`File could not be read! Code=${o}`));
  }, n.readAsArrayBuffer(e);
}), le = async (e) => {
  let t = e;
  if (typeof e > "u")
    return "undefined";
  if (typeof e == "string")
    /data:image\/([a-zA-Z]*);base64,([^"]*)/.test(e) ? t = atob(e.split(",")[1]).split("").map((r) => r.charCodeAt(0)) : t = await (await fetch(e)).arrayBuffer();
  else if (typeof HTMLElement < "u" && e instanceof HTMLElement)
    e.tagName === "IMG" && (t = await le(e.src)), e.tagName === "VIDEO" && (t = await le(e.poster)), e.tagName === "CANVAS" && await new Promise((r) => {
      e.toBlob(async (n) => {
        t = await se(n), r();
      });
    });
  else if (typeof OffscreenCanvas < "u" && e instanceof OffscreenCanvas) {
    const r = await e.convertToBlob();
    t = await se(r);
  } else (e instanceof File || e instanceof Blob) && (t = await se(e));
  return new Uint8Array(t);
};
var nt = le;
const ot = Je, at = Qe, it = et, st = tt, ct = rt, lt = nt;
var ut = {
  defaultOptions: ot,
  spawnWorker: at,
  terminateWorker: it,
  onMessage: st,
  send: ct,
  loadImage: lt
};
const dt = je, G = qe, { log: fe } = ne, ft = Se, Y = Ye, {
  defaultOptions: ht,
  spawnWorker: gt,
  terminateWorker: mt,
  onMessage: wt,
  loadImage: he,
  send: yt
} = ut;
let ge = 0;
var Ie = async (e = "eng", t = Y.LSTM_ONLY, r = {}, n = {}) => {
  const o = ft("Worker", ge), {
    logger: a,
    errorHandler: i,
    ...s
  } = dt({
    ...ht,
    ...r
  }), l = {}, f = typeof e == "string" ? e.split("+") : e;
  let m = t, c = n;
  const h = [Y.DEFAULT, Y.LSTM_ONLY].includes(t) && !s.legacyCore;
  let v, y;
  const A = new Promise((C, E) => {
    y = C, v = E;
  }), R = (C) => {
    v(C.message);
  };
  let b = gt(s);
  b.onerror = R, ge += 1;
  const x = ({ id: C, action: E, payload: d }) => new Promise((u, g) => {
    fe(`[${o}]: Start ${C}, action=${E}`);
    const p = `${E}-${C}`;
    l[p] = { resolve: u, reject: g }, yt(b, {
      workerId: o,
      jobId: C,
      action: E,
      payload: d
    });
  }), I = () => console.warn("`load` is depreciated and should be removed from code (workers now come pre-loaded)"), M = (C) => x(G({
    id: C,
    action: "load",
    payload: { options: { lstmOnly: h, corePath: s.corePath, logging: s.logging } }
  })), D = (C, E, d) => x(G({
    id: d,
    action: "FS",
    payload: { method: "writeFile", args: [C, E] }
  })), T = (C, E) => x(G({
    id: E,
    action: "FS",
    payload: { method: "readFile", args: [C, { encoding: "utf8" }] }
  })), N = (C, E) => x(G({
    id: E,
    action: "FS",
    payload: { method: "unlink", args: [C] }
  })), B = (C, E, d) => x(G({
    id: d,
    action: "FS",
    payload: { method: C, args: E }
  })), O = (C, E) => x(G({
    id: E,
    action: "loadLanguage",
    payload: {
      langs: C,
      options: {
        langPath: s.langPath,
        dataPath: s.dataPath,
        cachePath: s.cachePath,
        cacheMethod: s.cacheMethod,
        gzip: s.gzip,
        lstmOnly: [Y.DEFAULT, Y.LSTM_ONLY].includes(m) && !s.legacyLang
      }
    }
  })), P = (C, E, d, u) => x(G({
    id: u,
    action: "initialize",
    payload: { langs: C, oem: E, config: d }
  })), H = (C = "eng", E, d, u) => {
    if (h && [Y.TESSERACT_ONLY, Y.TESSERACT_LSTM_COMBINED].includes(E)) throw Error("Legacy model requested but code missing.");
    const g = E || m;
    m = g;
    const p = d || c;
    c = p;
    const S = (typeof C == "string" ? C.split("+") : C).filter((L) => !f.includes(L));
    return f.push(...S), S.length > 0 ? O(S, u).then(() => P(C, g, p, u)) : P(C, g, p, u);
  }, oe = (C = {}, E) => x(G({
    id: E,
    action: "setParameters",
    payload: { params: C }
  })), Q = async (C, E = {}, d = {
    text: !0
  }, u) => x(G({
    id: u,
    action: "recognize",
    payload: { image: await he(C), options: E, output: d }
  })), ae = async (C, E) => {
    if (h) throw Error("`worker.detect` requires Legacy model, which was not loaded.");
    return x(G({
      id: E,
      action: "detect",
      payload: { image: await he(C) }
    }));
  }, V = async () => (b !== null && (mt(b), b = null), Promise.resolve());
  wt(b, ({
    workerId: C,
    jobId: E,
    status: d,
    action: u,
    data: g
  }) => {
    const p = `${u}-${E}`;
    if (d === "resolve")
      fe(`[${C}]: Complete ${E}`), l[p].resolve({ jobId: E, data: g }), delete l[p];
    else if (d === "reject")
      if (l[p].reject(g), delete l[p], u === "load" && v(g), i)
        i(g);
      else
        throw Error(g);
    else d === "progress" && a({ ...g, userJobId: E });
  });
  const Z = {
    id: o,
    worker: b,
    load: I,
    writeText: D,
    readText: T,
    removeFile: N,
    FS: B,
    reinitialize: H,
    setParameters: oe,
    recognize: Q,
    detect: ae,
    terminate: V
  };
  return M().then(() => O(e)).then(() => P(e, t, n)).then(() => y(Z)).catch(() => {
  }), A;
};
const Re = Ie, pt = async (e, t, r) => {
  const n = await Re(t, 1, r);
  return n.recognize(e).finally(async () => {
    await n.terminate();
  });
}, vt = async (e, t) => {
  const r = await Re("osd", 0, t);
  return r.detect(e).finally(async () => {
    await r.terminate();
  });
};
var xt = {
  recognize: pt,
  detect: vt
};
const Ct = Ie, bt = xt;
var Et = {
  createWorker: Ct,
  ...bt
};
let ce = null, J = null, me = Promise.resolve();
async function St(e = "eng") {
  return ce || J || (J = (async () => {
    try {
      console.log("[TesseractWorker] Spawning local OCR worker...");
      const t = await Et.createWorker(e, 1, {
        workerPath: chrome.runtime.getURL("tesseract/worker.min.js"),
        corePath: chrome.runtime.getURL("tesseract/tesseract-core.wasm.js"),
        langPath: chrome.runtime.getURL("tesseract/"),
        workerBlobURL: !1,
        cacheMethod: "none"
      });
      return await t.setParameters({
        tessedit_pageseg_mode: "3",
        // Auto segmentation
        tessedit_create_hocr: "1",
        // Force HTML layout metadata
        tessedit_create_tsv: "1"
        // Force Tabular layout
      }), ce = t, t;
    } catch (t) {
      throw console.error("[TesseractWorker] Failed to create worker:", t), J = null, t;
    }
  })(), J);
}
async function It(e) {
  let t;
  const r = new Promise((n) => {
    me.then(() => n());
  });
  me = new Promise((n) => {
    t = n;
  }), await r;
  try {
    return await (await St()).recognize(e, {
      tessjs_create_hocr: "1",
      tessjs_create_tsv: "1"
    });
  } finally {
    t();
  }
}
function Rt(e) {
  if (!e) return [];
  const t = [];
  try {
    e.words && Array.isArray(e.words) && e.words.length > 0 ? e.words.forEach((r) => {
      r.bbox && r.text.trim().length > 0 && t.push({
        text: r.text,
        x0: r.bbox.x0,
        y0: r.bbox.y0,
        x1: r.bbox.x1,
        y1: r.bbox.y1
      });
    }) : e.lines && Array.isArray(e.lines) && e.lines.forEach((r) => {
      r.words && Array.isArray(r.words) && r.words.forEach((n) => {
        n.bbox && n.text.trim().length > 0 && t.push({
          text: n.text,
          x0: n.bbox.x0,
          y0: n.bbox.y0,
          x1: n.bbox.x1,
          y1: n.bbox.y1
        });
      });
    });
  } catch (r) {
    console.error("[ExtractBoundingBoxes] Parsing failed silently:", r);
  }
  return t;
}
function At(e) {
  const t = new Uint8Array(e);
  let r = "";
  const n = 8192;
  for (let o = 0; o < t.length; o += n)
    r += String.fromCharCode.apply(null, t.subarray(o, o + n));
  return btoa(r);
}
async function kt(e) {
  try {
    if (typeof document > "u" && typeof chrome < "u" && chrome.offscreen) {
      const r = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height), n = At(r.data.buffer);
      if (!n || n.length < 100) throw new Error("OCR source data missing");
      const o = await Fe("RECOGNIZE_IMAGE", {
        width: e.width,
        height: e.height,
        base64Data: n
      });
      return console.log(`[RecognizeImage] Received from Offscreen. Boxes: ${o?.boundingBoxes?.length || 0}`), o;
    } else {
      console.log("[RecognizeImage] Starting Tesseract OCR process...");
      const t = await It(e), r = t.data || t;
      console.log("================ RAW TESSERACT DATA ================"), console.log("[DEBUG] Keys present in Tesseract data:", Object.keys(r)), console.log("[DEBUG] Text Length:", r.text ? r.text.length : 0), console.log("[DEBUG] Natively has words array?", !!r.words, "Count:", r.words ? r.words.length : 0), console.log("[DEBUG] Natively has lines array?", !!r.lines, "Count:", r.lines ? r.lines.length : 0), console.log("[DEBUG] Natively has blocks array?", !!r.blocks, "Count:", r.blocks ? r.blocks.length : 0), console.log("====================================================");
      let n = r.words || [];
      n.length === 0 && r.lines && r.lines.length > 0 && (console.log("[RecognizeImage] Native words empty. Extracting from lines..."), r.lines.forEach((a) => {
        a.words && n.push(...a.words);
      })), n.length === 0 && r.blocks && r.blocks.length > 0 && (console.log("[RecognizeImage] Native words & lines empty. Extracting deeply from blocks..."), r.blocks.forEach((a) => {
        a.paragraphs && a.paragraphs.forEach((i) => {
          i.lines && i.lines.forEach((s) => {
            s.words && n.push(...s.words);
          });
        });
      })), console.log(`[RecognizeImage] Final Extracted Words Count: ${n.length}`), console.log("[RecognizeImage] Extracting bounding boxes..."), r.words = n;
      const o = Rt(r);
      return console.log(`[RecognizeImage] OCR Local Success. Words: ${n.length}. Boxes: ${o.length}`), {
        text: r.text || "",
        confidence: r.confidence || 0,
        words: n,
        boundingBoxes: o,
        processingTime: t.processingTime || 0
      };
    }
  } catch (t) {
    return console.error("[RecognizeImage] Pipeline failed:", t), { text: "", confidence: 0, words: [], boundingBoxes: [], processingTime: 0 };
  }
}
const Mt = {
  // 🚀 FUZZY MATCHING: Uses Negative Lookbehinds/Lookaheads instead of strict \b boundaries.
  // This allows detection even if the text is surrounded by brackets, quotes, or OCR artifacts.
  EMAIL: /(?<![a-zA-Z0-9])[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?![a-zA-Z0-9])/g,
  PHONE: /(?<!\d)(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)/g,
  AADHAAR: /(?<!\d)(\d{4}[-\s]?\d{4}[-\s]?\d{4})(?!\d)/g,
  PAN: /(?<![A-Z0-9])([A-Z]{5}[0-9]{4}[A-Z])(?![A-Z0-9])/g,
  PASSPORT: /(?<![A-Z0-9])([A-Z][0-9]{7})(?![A-Z0-9])/g,
  CREDIT_CARD: /(?<!\d)((?:\d[ -]*?){13,19})(?!\d)/g,
  UPI_ID: /(?<![a-zA-Z0-9.\-_])[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}(?![a-zA-Z0-9])/g
}, we = (e) => (e || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
function Dt(e, t = []) {
  if (!e) return [];
  console.log("[RegexDetector] Inspecting first 3 wordBoxes structure:", t.slice(0, 3));
  const r = [];
  let n = 0;
  const o = t.map((a) => {
    const i = (a.text || a.word || a.value || a.content || "").toString();
    let s = -1, l = -1;
    return i && (s = e.indexOf(i, n), s !== -1 && (l = s + i.length, n = l)), {
      box: Ot(a),
      text: i,
      norm: we(i),
      start: s,
      end: l
    };
  });
  for (const [a, i] of Object.entries(Mt)) {
    i.lastIndex = 0;
    let s;
    for (; (s = i.exec(e)) !== null; ) {
      const l = s[1] || s[0], f = we(l), m = s.index, c = s.index + s[0].length;
      let h = [];
      const v = o.filter((y) => y.start !== -1 && y.start < c && y.end > m);
      v.length > 0 ? h = v.map((y) => y.box) : h = o.filter((y) => y.norm.length > 0 && (f.includes(y.norm) || y.norm.includes(f))).map((y) => y.box), h.length === 0 ? console.warn(`[RegexDetector] Mapping FAILED for: "${l}". Regex found it in text, but couldn't link it to boxes.`) : console.log(`[RegexDetector] SUCCESS: Mapped "${l}" to ${h.length} bounding boxes.`), r.push({
        type: a,
        value: l,
        bboxes: h,
        source: "regex"
      });
    }
  }
  return r;
}
function Ot(e) {
  const t = e.bbox || e;
  return {
    x: t.x !== void 0 ? t.x : t.x0 || 0,
    y: t.y !== void 0 ? t.y : t.y0 || 0,
    width: t.width !== void 0 ? t.width : (t.x1 || 0) - (t.x0 || 0),
    height: t.height !== void 0 ? t.height : (t.y1 || 0) - (t.y0 || 0),
    confidence: e.confidence || 100
  };
}
function ye(e) {
  if (!Array.isArray(e) || e.length <= 1) return e;
  const t = [...e].sort((o, a) => o.x - a.x), r = [];
  let n = t[0];
  for (let o = 1; o < t.length; o++) {
    const a = t[o], i = n.y + n.height, s = a.y + a.height, l = Math.min(i, s) - Math.max(n.y, a.y), f = a.x - (n.x + n.width);
    if (l > 0 && f <= 150) {
      const m = Math.min(n.x, a.x), c = Math.min(n.y, a.y), h = Math.max(n.x + n.width, a.x + a.width), v = Math.max(i, s);
      n = {
        x: m,
        y: c,
        width: h - m,
        height: v - c,
        confidence: Math.max(n.confidence || 100, a.confidence || 100)
      };
    } else
      r.push(n), n = a;
  }
  return r.push(n), r;
}
function Tt(e) {
  if (!Array.isArray(e) || e.length === 0) return [];
  const r = e.map((a) => ({
    ...a,
    bboxes: ye(a.bboxes || [])
  })).sort((a, i) => (a.startIndex || 0) - (i.startIndex || 0)), n = [];
  if (r.length === 0) return [];
  let o = r[0];
  for (let a = 1; a < r.length; a++) {
    const i = r[a], s = o.endIndex || 0;
    (i.startIndex || 0) <= s + 5 ? o = {
      ...o,
      endIndex: Math.max(s, i.endIndex || 0),
      bboxes: ye([...o.bboxes || [], ...i.bboxes || []])
    } : (n.push(o), o = i);
  }
  return n.push(o), n;
}
const pe = {
  AADHAAR: "critical",
  PAN: "critical",
  PASSPORT: "critical",
  QR_CODE: "critical",
  // NEW: Ensures QR codes trigger immediate redaction
  DRIVING_LICENSE: "high",
  CREDIT_CARD: "high",
  EMAIL: "medium",
  PHONE: "medium",
  DEFAULT: "medium"
}, Bt = {
  critical: 10,
  high: 5,
  medium: 2,
  low: 1
};
function Pt(e) {
  if (!Array.isArray(e) || e.length === 0)
    return {
      riskLevel: "low",
      score: 0,
      detections: []
    };
  let t = 0, r = !1;
  e.forEach((o) => {
    const a = o.severity || pe[o.type] || pe.DEFAULT, i = Bt[a] || 2, s = typeof o.fusedConfidence == "number" ? o.fusedConfidence : 0.8;
    t += i * s, a === "critical" && s >= 0.5 && (r = !0);
  });
  let n = "low";
  return r || t >= 8 ? n = "critical" : t >= 4 ? n = "high" : t >= 2 && (n = "medium"), console.log(`[RiskAnalyzer] Calculated document risk score: ${t.toFixed(2)} -> Level: ${n.toUpperCase()}`), {
    riskLevel: n,
    score: parseFloat(t.toFixed(2)),
    detections: e
  };
}
async function Ae(e) {
  if (!e) throw new TypeError("File parameter is required");
  if (typeof document > "u") {
    const t = await e.arrayBuffer(), r = new Blob([t], { type: e.type || "image/png" }), n = await createImageBitmap(r), o = new OffscreenCanvas(n.width, n.height);
    return o.getContext("2d", { willReadFrequently: !0 }).drawImage(n, 0, 0), o;
  } else
    return new Promise((t, r) => {
      const n = new FileReader();
      n.onload = (o) => {
        const a = new Image();
        a.onload = () => {
          const i = document.createElement("canvas");
          i.width = a.width, i.height = a.height, i.getContext("2d", { willReadFrequently: !0 }).drawImage(a, 0, 0), t(i);
        }, a.onerror = (i) => r(new Error(`Failed to decode image: ${i}`)), a.src = o.target.result;
      }, n.onerror = (o) => r(new Error(`Failed to read file: ${o}`)), n.readAsDataURL(e);
    });
}
async function Lt(e, t) {
  if (typeof document < "u" || !chrome.offscreen)
    return Ee(e, t);
  console.log("[ScanService] Routing image to OpenCV Sandbox via Offscreen...");
  const r = chrome.runtime.getURL("public/offscreen.html");
  (await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"], documentUrls: [r] })).length === 0 && await chrome.offscreen.createDocument({ url: "public/offscreen.html", reasons: ["DOM_SCRAPING"], justification: "OpenCV Preprocessing" });
  const a = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height), i = new Uint8Array(a.data.buffer);
  let s = "";
  const l = 8192;
  for (let m = 0; m < i.length; m += l)
    s += String.fromCharCode.apply(null, i.subarray(m, m + l));
  const f = btoa(s);
  return new Promise((m, c) => {
    chrome.runtime.sendMessage({
      target: "offscreen",
      type: "PREPROCESS_IMAGE",
      payload: { width: e.width, height: e.height, base64Data: f, options: t }
    }, (h) => {
      if (chrome.runtime.lastError) return c(new Error(chrome.runtime.lastError.message));
      if (!h || !h.success) return c(new Error(h?.error || "Preprocessing failed offscreen"));
      const v = h.payload.base64Data, y = atob(v), A = new Uint8Array(y.length);
      for (let I = 0; I < y.length; I++)
        A[I] = y.charCodeAt(I);
      const R = new OffscreenCanvas(h.payload.width, h.payload.height), b = R.getContext("2d", { willReadFrequently: !0 }), x = new ImageData(new Uint8ClampedArray(A.buffer), h.payload.width, h.payload.height);
      b.putImageData(x, 0, 0), m(R);
    });
  });
}
async function _t(e, t = {}) {
  const r = Date.now();
  try {
    const n = await Ae(e), o = await Lt(n, t.preprocess), a = await kt(o), i = a.words || [];
    console.log(`[ScanService] Pipeline running with ${i.length} text boxes.`);
    const s = Dt(a.text, i), l = Tt(s);
    let f = [];
    if ("BarcodeDetector" in globalThis)
      try {
        f = (await new BarcodeDetector({ formats: ["qr_code"] }).detect(o)).map((y) => ({
          type: "QR_CODE",
          severity: "critical",
          bboxes: [{
            x: y.boundingBox.x,
            y: y.boundingBox.y,
            width: y.boundingBox.width,
            height: y.boundingBox.height,
            confidence: 100
            // High confidence for native API matches
          }]
        })), f.length > 0 && console.log(`[ScanService] Successfully detected ${f.length} QR Code(s).`);
      } catch (h) {
        console.warn("[ScanService] Native QR scanner failed or is unsupported:", h);
      }
    const m = [...l, ...f], c = Pt(m);
    return {
      success: !0,
      detections: m,
      riskLevel: c.riskLevel,
      processingTime: Date.now() - r
    };
  } catch (n) {
    return console.error("[ScanService] Pipeline failed:", n), { success: !1, detections: [], error: n.message };
  }
}
function Ft(e) {
  const r = Array.from({ length: 8 }, () => new Array(8).fill(0));
  for (let n = 0; n < 8; n++)
    for (let o = 0; o < 8; o++) {
      let a = 0;
      for (let l = 0; l < 8; l++)
        for (let f = 0; f < 8; f++)
          a += e[l][f] * Math.cos((2 * l + 1) * n * Math.PI / 16) * Math.cos((2 * f + 1) * o * Math.PI / 16);
      const i = n === 0 ? 1 / Math.sqrt(2) : 1, s = o === 0 ? 1 / Math.sqrt(2) : 1;
      r[n][o] = 0.25 * i * s * a;
    }
  return r;
}
function Nt(e) {
  const r = Array.from({ length: 8 }, () => new Array(8).fill(0));
  for (let n = 0; n < 8; n++)
    for (let o = 0; o < 8; o++) {
      let a = 0;
      for (let i = 0; i < 8; i++)
        for (let s = 0; s < 8; s++) {
          const l = i === 0 ? 1 / Math.sqrt(2) : 1, f = s === 0 ? 1 / Math.sqrt(2) : 1;
          a += l * f * e[i][s] * Math.cos((2 * n + 1) * i * Math.PI / 16) * Math.cos((2 * o + 1) * s * Math.PI / 16);
        }
      r[n][o] = 0.25 * a;
    }
  return r;
}
const _ = 8, ee = 20;
function $t(e) {
  const t = [];
  for (let r = 0; r < e.length; r++) {
    const n = e.charCodeAt(r);
    for (let o = 7; o >= 0; o--)
      t.push(n >> o & 1);
  }
  return t;
}
async function qt(e, t) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    console.log(`[WatermarkEngine] Embedding invisible DCT watermark: "${t}"`);
    const r = e.getContext("2d", { willReadFrequently: !0 }), n = e.width, o = e.height, a = r.getImageData(0, 0, n, o), i = a.data, s = $t(t + "\0");
    let l = 0;
    const f = Math.floor(n / _) * _, m = Math.floor(o / _) * _;
    for (let c = 0; c < m; c += _)
      for (let h = 0; h < f; h += _) {
        const v = Array.from({ length: _ }, () => new Array(_).fill(0)), y = Array.from({ length: _ }, () => new Array(_).fill(0)), A = Array.from({ length: _ }, () => new Array(_).fill(0));
        for (let x = 0; x < _; x++)
          for (let I = 0; I < _; I++) {
            const M = ((c + x) * n + (h + I)) * 4, D = i[M], T = i[M + 1], N = i[M + 2];
            v[x][I] = 0.299 * D + 0.587 * T + 0.114 * N, y[x][I] = 128 - 0.1687 * D - 0.3313 * T + 0.5 * N, A[x][I] = 128 + 0.5 * D - 0.4187 * T - 0.0813 * N;
          }
        const R = Ft(v);
        if (l < s.length) {
          const x = s[l], I = R[4][4], M = Math.round(I / ee) * ee;
          R[4][4] = x === 1 ? M + ee / 4 : M - ee / 4, l++;
        }
        const b = Nt(R);
        for (let x = 0; x < _; x++)
          for (let I = 0; I < _; I++) {
            const M = ((c + x) * n + (h + I)) * 4, D = b[x][I], T = y[x][I], N = A[x][I];
            let B = Math.round(D + 1.402 * (N - 128)), O = Math.round(D - 0.3441 * (T - 128) - 0.7141 * (N - 128)), P = Math.round(D + 1.772 * (T - 128));
            i[M] = Math.max(0, Math.min(255, B)), i[M + 1] = Math.max(0, Math.min(255, O)), i[M + 2] = Math.max(0, Math.min(255, P));
          }
      }
    return r.putImageData(a, 0, 0), e;
  } catch (r) {
    throw console.error("[WatermarkEngine] Failed to embed watermark:", r), r;
  }
}
function zt(e, t = 8, r = 6, n = 99999, o = 99999) {
  if (!e)
    throw new TypeError("Box object is required");
  const a = Math.max(0, e.x - t), i = Math.max(0, e.y - r), s = Math.min(n, e.x + e.width + t), l = Math.min(o, e.y + e.height + r), f = s - a, m = l - i;
  return { x: a, y: i, width: f, height: m };
}
function Gt(e) {
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
  const t = [...e].sort((o, a) => o.x - a.x), r = [];
  let n = {
    x: t[0].x,
    y: t[0].y,
    width: t[0].width,
    height: t[0].height,
    detections: t[0].detection ? [t[0].detection] : []
  };
  for (let o = 1; o < t.length; o++) {
    const a = t[o], i = n.x + n.width, s = n.y + n.height, l = a.x + a.width, f = a.y + a.height, m = a.x <= i + 15, c = Math.min(s, f) - Math.max(n.y, a.y) > 0;
    if (m && c) {
      const h = Math.min(n.x, a.x), v = Math.max(i, l), y = Math.min(n.y, a.y), A = Math.max(s, f);
      n.x = h, n.width = v - h, n.y = y, n.height = A - y, a.detection && (n.detections.some(
        (b) => b.type === a.detection.type && b.value === a.detection.value
      ) || n.detections.push(a.detection));
    } else
      r.push(n), n = {
        x: a.x,
        y: a.y,
        width: a.width,
        height: a.height,
        detections: a.detection ? [a.detection] : []
      };
  }
  return r.push(n), console.log(`[MergeBoundingBoxes] Consolidated into ${r.length} final bounding rectangles.`), r;
}
async function ke(e, t, r = 15) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  if (!Array.isArray(t) || t.length === 0)
    return e;
  const n = e.getContext("2d", { willReadFrequently: !0 });
  n.save();
  try {
    t.forEach((o) => {
      const { x: a, y: i, width: s, height: l } = o, f = Math.max(0, a), m = Math.max(0, i), c = Math.min(e.width - f, s), h = Math.min(e.height - m, l);
      if (c <= 0 || h <= 0)
        return;
      const v = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(c, h) : document.createElement("canvas");
      v.width = c, v.height = h, v.getContext("2d", { willReadFrequently: !0 }).drawImage(e, f, m, c, h, 0, 0, c, h), n.save();
      try {
        n.beginPath(), n.rect(f, m, c, h), n.clip(), n.filter = `blur(${r}px)`, n.drawImage(v, f, m);
      } finally {
        n.restore();
      }
    });
  } catch (o) {
    throw console.error("[BlurCanvas] Regional Gaussian blur execution failed:", o), o;
  } finally {
    n.restore();
  }
  return e;
}
function Ut(e) {
  const r = typeof OffscreenCanvas < "u" && e instanceof OffscreenCanvas ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
  return r.width = e.width, r.height = e.height, r.getContext("2d", { willReadFrequently: !0 }).drawImage(e, 0, 0), r;
}
async function Wt(e, t, r = "redact", n = {}) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  const o = Ut(e);
  if (!Array.isArray(t) || t.length === 0)
    return o;
  const {
    paddingX: a = 8,
    paddingY: i = 6,
    blurRadius: s = 15,
    pixelationScale: l = 8,
    fillStyle: f = "#000000"
  } = n;
  console.log(`[RedactCanvas] Running masking pipeline. Mode: ${r.toUpperCase()} on ${t.length} regions.`);
  const m = t.map(
    (v) => zt(v, a, i, o.width, o.height)
  ), c = Gt(m), h = o.getContext("2d", { willReadFrequently: !0 });
  return r === "redact" ? (h.fillStyle = f, c.forEach((v) => {
    const y = Math.max(0, v.x), A = Math.max(0, v.y), R = Math.min(o.width - y, v.width), b = Math.min(o.height - A, v.height);
    R > 0 && b > 0 && h.fillRect(y, A, R, b);
  })) : r === "blur" ? await ke(o, c, s) : r === "pixelate" && jt(o, c, l), o;
}
function jt(e, t, r = 8) {
  const n = e.getContext("2d", { willReadFrequently: !0 });
  t.forEach((o) => {
    const { x: a, y: i, width: s, height: l } = o, f = Math.max(0, a), m = Math.max(0, i), c = Math.min(e.width - f, s), h = Math.min(e.height - m, l);
    if (c <= 0 || h <= 0)
      return;
    const v = n.getImageData(f, m, c, h), y = v.data;
    for (let A = 0; A < h; A += r)
      for (let R = 0; R < c; R += r) {
        let b = 0, x = 0, I = 0, M = 0;
        for (let B = 0; B < r && A + B < h; B++)
          for (let O = 0; O < r && R + O < c; O++) {
            const P = ((A + B) * c + (R + O)) * 4;
            b += y[P], x += y[P + 1], I += y[P + 2], M++;
          }
        const D = Math.round(b / M), T = Math.round(x / M), N = Math.round(I / M);
        for (let B = 0; B < r && A + B < h; B++)
          for (let O = 0; O < r && R + O < c; O++) {
            const P = ((A + B) * c + (R + O)) * 4;
            y[P] = D, y[P + 1] = T, y[P + 2] = N;
          }
      }
    n.putImageData(v, f, m);
  });
}
async function Yt(e, t) {
  return console.log("[AIService] Delegating invisible watermark embedding..."), qt(e, t);
}
async function Ht(e, t, r = "redact") {
  return console.log(`[AIService] Delegating redaction request (mode: ${r}) for ${t.length} regions.`), r === "blur" ? ke(e, t, 8) : Wt(e, t, "redact", { fillStyle: "#000000" });
}
async function Vt(e, t, r = {}) {
  const { blurMode: n = "redact" } = r, o = 800, a = 3e4, i = 80;
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    if (!Array.isArray(t) || t.length === 0)
      return e;
    const s = [];
    return t.forEach((f) => {
      const m = ["AADHAAR", "PAN", "QR_CODE"].includes(f.type) || f.severity === "critical";
      Array.isArray(f.bboxes) && f.bboxes.forEach((c) => {
        const h = c.width * c.height;
        c && typeof c.x == "number" && typeof c.width == "number" && // 🚀 THE ULTIMATE FIX: Critical items bypass ALL constraints, including hardcoded width/height
        (m || c.width > 20) && (m || c.height > 10) && (m || c.height <= i) && (m || h >= o) && (m || h <= a) ? s.push({
          x: c.x,
          y: c.y,
          width: c.width,
          height: c.height
        }) : console.log(`[BlurService] Ignored invalid/oversized/tiny box: ${c.width}x${c.height} (Type: ${f.type})`);
      });
    }), s.length === 0 ? (console.log("[BlurService] No valid bounding boxes found. Skipping redaction."), e) : (console.log(`[BlurService] Requesting redaction of ${s.length} geometric-verified boxes in mode: ${n}`), await Ht(e, s, n));
  } catch (s) {
    throw console.error("[BlurService] Redaction processing failed:", s), s;
  }
}
const U = 8, F = 32;
async function Zt(e) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    const t = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(F, F) : document.createElement("canvas");
    t.width = F, t.height = F;
    const r = t.getContext("2d", { willReadFrequently: !0 });
    r.drawImage(e, 0, 0, F, F);
    const o = r.getImageData(0, 0, F, F).data, a = new Float32Array(F * F);
    for (let c = 0; c < o.length; c += 4)
      a[c / 4] = 0.299 * o[c] + 0.587 * o[c + 1] + 0.114 * o[c + 2];
    const i = Array.from({ length: U }, () => new Float32Array(U));
    for (let c = 0; c < U; c++)
      for (let h = 0; h < U; h++) {
        let v = 0;
        for (let R = 0; R < F; R++)
          for (let b = 0; b < F; b++)
            v += a[R * F + b] * Math.cos((2 * R + 1) * c * Math.PI / (2 * F)) * Math.cos((2 * b + 1) * h * Math.PI / (2 * F));
        const y = c === 0 ? 1 / Math.sqrt(2) : 1, A = h === 0 ? 1 / Math.sqrt(2) : 1;
        i[c][h] = 2 / F * y * A * v;
      }
    let s = 0;
    for (let c = 0; c < U; c++)
      for (let h = 0; h < U; h++)
        c === 0 && h === 0 || (s += i[c][h]);
    const l = s / (U * U - 1);
    let f = "";
    for (let c = 0; c < U; c++)
      for (let h = 0; h < U; h++)
        f += i[c][h] >= l ? "1" : "0";
    let m = "";
    for (let c = 0; c < 64; c += 4) {
      const h = f.substring(c, c + 4);
      m += parseInt(h, 2).toString(16);
    }
    return m;
  } catch (t) {
    throw console.error("[PHash] Error generating perceptual hash:", t), t;
  }
}
const W = 8, k = 16;
function ve(e, t) {
  const r = new Float32Array(t), n = t / 2;
  for (let o = 0; o < n; o++) {
    const a = e[2 * o], i = e[2 * o + 1];
    r[o] = (a + i) / Math.sqrt(2), r[n + o] = (a - i) / Math.sqrt(2);
  }
  for (let o = 0; o < t; o++)
    e[o] = r[o];
}
function Kt(e) {
  for (let t = 0; t < k; t++) {
    const r = new Float32Array(k);
    for (let n = 0; n < k; n++)
      r[n] = e[t * k + n];
    ve(r, k);
    for (let n = 0; n < k; n++)
      e[t * k + n] = r[n];
  }
  for (let t = 0; t < k; t++) {
    const r = new Float32Array(k);
    for (let n = 0; n < k; n++)
      r[n] = e[n * k + t];
    ve(r, k);
    for (let n = 0; n < k; n++)
      e[n * k + t] = r[n];
  }
}
async function Xt(e) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    const t = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(k, k) : document.createElement("canvas");
    t.width = k, t.height = k;
    const r = t.getContext("2d", { willReadFrequently: !0 });
    r.drawImage(e, 0, 0, k, k);
    const o = r.getImageData(0, 0, k, k).data, a = new Float32Array(k * k);
    for (let c = 0; c < o.length; c += 4)
      a[c / 4] = 0.299 * o[c] + 0.587 * o[c + 1] + 0.114 * o[c + 2];
    Kt(a);
    const i = Array.from({ length: W }, () => new Float32Array(W));
    let s = 0;
    for (let c = 0; c < W; c++)
      for (let h = 0; h < W; h++) {
        const v = a[c * k + h];
        i[c][h] = v, s += v;
      }
    const l = s / (W * W);
    let f = "";
    for (let c = 0; c < W; c++)
      for (let h = 0; h < W; h++)
        f += i[c][h] >= l ? "1" : "0";
    let m = "";
    for (let c = 0; c < 64; c += 4) {
      const h = f.substring(c, c + 4);
      m += parseInt(h, 2).toString(16);
    }
    return m;
  } catch (t) {
    throw console.error("[WHash] Error generating wavelet hash:", t), t;
  }
}
function Jt(e, t, r) {
  return new Promise((n, o) => {
    if (!e)
      return o(new TypeError("Canvas parameter is required"));
    const a = t.replace(/(\.[\w\d]+)$/, "_protected$1");
    if (typeof OffscreenCanvas < "u" && e instanceof OffscreenCanvas)
      e.convertToBlob({ type: r }).then((i) => {
        if (!i) return o(new Error("Failed to extract binary blob from offscreen canvas"));
        n(new File([i], a, { type: r, lastModified: Date.now() }));
      }).catch(o);
    else {
      if (typeof e.toBlob != "function")
        return o(new TypeError("Canvas does not support toBlob operations"));
      e.toBlob((i) => {
        if (!i) return o(new Error("Failed to extract binary blob from canvas"));
        n(new File([i], a, { type: r, lastModified: Date.now() }));
      }, r);
    }
  });
}
async function Qt(e, t = {}) {
  console.log(`[ProtectService] Initiating final protection pipeline for: ${e.name}`);
  const r = Date.now();
  try {
    const n = await Ae(e), o = await Zt(n), a = await Xt(n);
    console.log("[ProtectService] Generated original fingerprints:", { phash: o, whash: a });
    const i = await _t(e, { preprocess: t });
    if (!i.success)
      throw new Error(`Scanning phase failed: ${i.error}`);
    if (!(i.riskLevel !== "low" || t.autoRedact))
      return console.log("[ProtectService] Document evaluated as low risk. Skipping edits."), {
        success: !0,
        originalFile: e,
        protectedFile: e,
        phash: o,
        whash: a,
        metadata: { name: e.name, size: e.size, type: e.type },
        detections: [],
        risk: i.riskLevel,
        protectionSummary: { processingTime: Date.now() - r, redacted: !1 }
      };
    console.log(`[ProtectService] Applying visual protections (Mode: ${t.blurMode || "redact"})...`);
    let l = await Vt(n, i.detections, t);
    t.aiCloakEnabled && (l = await adversarialCloak(l, 5)), t.watermarkEnabled && (l = await Yt(l, "SafeLens_Protected_Asset"));
    const f = await Jt(l, e.name, e.type);
    return console.log(`[ProtectService] Protection pipeline complete. Output file: ${f.name}`), {
      success: !0,
      originalFile: e,
      protectedFile: f,
      phash: o,
      whash: a,
      metadata: { name: e.name, size: e.size, type: e.type },
      detections: i.detections,
      risk: i.riskLevel,
      protectionSummary: { processingTime: Date.now() - r, redacted: !0 }
    };
  } catch (n) {
    return console.error("[ProtectService] Critical pipeline crash:", n), {
      success: !1,
      originalFile: e,
      protectedFile: e,
      phash: "",
      whash: "",
      metadata: { name: e.name, size: e.size, type: e.type },
      detections: [],
      risk: "low",
      protectionSummary: { processingTime: Date.now() - r, redacted: !1 },
      error: n instanceof Error ? n.message : "Unknown protection pipeline failure"
    };
  }
}
class er {
  constructor() {
    this.baseUrl = "https://safelens-zttx.onrender.com";
  }
  async fetchWithRetry(t, r = {}, n = 3, o = 1e3) {
    let a = null;
    for (let i = 0; i < n; i++) {
      try {
        const s = await fetch(t, r);
        if (s.ok || s.status < 500 || s.status >= 600) return s;
      } catch (s) {
        a = s, console.warn(`[BridgeClient] Network connection error: ${s.message}. Retrying...`);
      }
      i < n - 1 && await new Promise((s) => setTimeout(s, o));
    }
    if (a) throw a;
  }
  /**
   * Universal Incident Notification Router
   */
  async sendIncidentNotification(t) {
    if (!t) throw new Error("Incident payload is required");
    const r = `${this.baseUrl}/api/incidents`;
    try {
      const n = {
        asset_id: parseInt(t.assetId, 10),
        matched_url: String(t.matchedUrl || "unknown"),
        match_confidence: parseFloat(t.matchConfidence) || 0.8,
        severity: String(t.severity || "Normal"),
        status: String(t.status || "Open")
      }, o = await this.fetchWithRetry(r, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(n)
      });
      if (o.status === 405 || o.status === 404)
        return { success: !0, incidentId: `mock_inc_${Date.now()}` };
      const a = await o.json();
      return a.success && a.data ? { success: !0, incidentId: a.data.incident_id } : { success: !0, incidentId: `mock_inc_${Date.now()}` };
    } catch (n) {
      return console.error("[BridgeClient] Incident pipeline handled gracefully:", n.message), { success: !0, incidentId: `mock_inc_${Date.now()}` };
    }
  }
  /**
   * Explicit Mapper mapping to REGISTER_BACKEND_ASSET routine
   */
  async uploadProtectedAsset(t) {
    return console.log("[BridgeClient] Mocking asset protection sync wrapper locally..."), { success: !0, data: { assetId: t?.assetId || Math.floor(Math.random() * 100) + 1 } };
  }
  /**
   * Explicit Mapper mapping to LOG_SCAN tracking routine
   */
  async syncScanResult(t) {
    return console.log("[BridgeClient] Registering scan analytics report metadata..."), this.sendIncidentNotification({
      assetId: t?.assetId || 1,
      matchedUrl: t?.matchedUrl || "unknown",
      matchConfidence: t?.confidence || 0.85,
      severity: t?.riskLevel === "critical" || t?.riskLevel === "high" ? "High" : "Normal",
      status: "Open"
    });
  }
}
const te = new er();
let xe = Promise.resolve();
function Ce(e) {
  if (!e) return "";
  const t = new Uint8Array(e);
  let r = "";
  for (let n = 0; n < t.length; n++)
    r += String.fromCharCode(t[n]);
  return btoa(r);
}
function re(e) {
  if (!e) return new ArrayBuffer(0);
  const t = atob(e), r = t.length, n = new Uint8Array(r);
  for (let o = 0; o < r; o++)
    n[o] = t.charCodeAt(o);
  return n.buffer;
}
const tr = {
  PING: async () => (console.log("[MessageRouter] PING message received. Sending PING response."), { ok: !0 }),
  PREPROCESS_IMAGE: async (e) => {
    if (!e || !e.arrayBuffer)
      throw new Error("Invalid payload: arrayBuffer is required");
    await be();
    const { arrayBuffer: t, type: r, settings: n } = e, o = new Blob([t], { type: r || "image/png" }), a = await createImageBitmap(o), i = new OffscreenCanvas(a.width, a.height);
    i.getContext("2d", { willReadFrequently: !0 }).drawImage(a, 0, 0);
    const l = await Ee(i, n);
    return {
      arrayBuffer: await (await l.convertToBlob({ type: r || "image/png" })).arrayBuffer(),
      width: l.width,
      height: l.height
    };
  },
  RUN_PROTECT_PIPELINE: async (e) => {
    if (!e || !e.arrayBuffer && !e.base64Data && !e.storageKey)
      throw new Error("Invalid payload: base64Data or arrayBuffer is required");
    let t = e.arrayBuffer;
    if (e.base64Data)
      t = re(e.base64Data);
    else if (e.storageKey) {
      const f = await chrome.storage.local.get(e.storageKey), m = f ? f[e.storageKey] : null;
      typeof m == "string" ? t = re(m) : (m && m.byteLength || m && typeof m == "object") && (t = m), t && t.byteLength > 0 && await chrome.storage.local.remove(e.storageKey);
    }
    if (!t || !t.byteLength)
      throw new Error("Invalid or corrupted image arrayBuffer received in pipeline gateway");
    const r = "pending_image_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    await chrome.storage.local.set({ [r]: Ce(t) });
    const { name: n, type: o, settings: a } = e;
    await be();
    const i = {
      name: n || "upload.png",
      size: t.byteLength,
      type: o || "image/png",
      arrayBuffer: () => Promise.resolve(t)
    }, s = await Qt(i, a);
    await chrome.storage.local.remove(r);
    let l;
    return s.protectedFile && typeof s.protectedFile.arrayBuffer == "function" ? l = await s.protectedFile.arrayBuffer() : l = t, {
      success: s.success !== !1,
      base64Data: Ce(l),
      name: s.protectedFile && s.protectedFile.name || n,
      type: s.protectedFile && s.protectedFile.type || o,
      phash: s.phash || "",
      whash: s.whash || "",
      detections: s.detections || [],
      risk: s.risk || "low",
      protectionSummary: s.protectionSummary || { processingTime: 0, redacted: !1 },
      error: s.error
    };
  },
  REGISTER_BACKEND_ASSET: async (e) => {
    if (!e || !e.storageKey && !e.base64Data)
      throw new Error("Invalid payload: storageKey or base64Data containing image buffer is mandatory");
    let t = null;
    if (e.base64Data)
      t = re(e.base64Data);
    else if (e.storageKey) {
      const a = await chrome.storage.local.get(e.storageKey), i = a ? a[e.storageKey] : null;
      typeof i == "string" ? t = re(i) : i && i.byteLength && (t = i), t && await chrome.storage.local.remove(e.storageKey);
    }
    if (!t || !t.byteLength)
      throw new Error("Image data not found or corrupted in background session allocation room");
    const r = new Blob([t], { type: e.type || "image/png" }), n = new File([r], e.name || "upload.png", { type: e.type || "image/png" });
    return console.log("[MessageRouter] Dispatching isolated proxy upload process via BridgeClient framework..."), await te.uploadProtectedAsset(n, {
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
      await te.syncSettings(e);
    } catch (t) {
      console.warn("[MessageRouter] Settings sync failed:", t);
    }
    return { success: !0 };
  },
  GET_SETTINGS: async () => {
    const e = await chrome.storage.local.get("settings");
    return e ? e.settings || {} : {};
  },
  LOG_SCAN: async (e, t) => {
    if (!e || !e.scanId)
      throw new Error("Invalid scan log payload");
    let r;
    const n = new Promise((o) => {
      xe.then(() => o());
    });
    xe = new Promise((o) => {
      r = o;
    }), await n;
    try {
      const o = await chrome.storage.local.get("scans"), a = o && o.scans ? o.scans : [], i = [e, ...a].slice(0, 100);
      await chrome.storage.local.set({ scans: i });
      try {
        if (await te.syncScanResult({
          metadata: { name: e.fileName, size: e.size, type: "image/png" },
          ...e
        }), e.riskLevel !== "low" && e.assetId) {
          const s = t && (t.url || t.origin) || "unknown", l = await te.sendIncidentNotification({
            assetId: e.assetId,
            matchedUrl: s,
            matchConfidence: e.confidence,
            severity: e.riskLevel === "critical" ? "Serious" : "Normal",
            status: "Open"
          });
          if (l && l.success && l.incidentId) {
            e.incidentId = l.incidentId;
            const f = await chrome.storage.local.get("scans"), c = (f && f.scans ? f.scans : []).map((h) => h.scanId === e.scanId ? { ...h, incidentId: l.incidentId } : h);
            await chrome.storage.local.set({ scans: c }), console.log("[MessageRouter] Linked local scan record with backend incident ID:", l.incidentId);
          }
        }
      } catch (s) {
        console.warn("[MessageRouter] Failed to sync scan metadata with BridgeClient:", s);
      }
    } finally {
      r();
    }
    return { success: !0 };
  }
};
async function be() {
  if (!(typeof document > "u" && typeof chrome < "u" && chrome.offscreen) && !(typeof cv < "u" && cv.matFromImageData))
    return new Promise((e, t) => {
      let r = 0;
      const n = setInterval(() => {
        r++, typeof cv < "u" && cv.matFromImageData ? (clearInterval(n), e()) : r > 50 && (clearInterval(n), t(new Error("OpenCV.js WASM compilation timed out (5s)")));
      }, 100);
    });
}
async function rr(e, t) {
  try {
    if (!e || typeof e != "object")
      return { success: !1, error: "Malformed message: Message must be an object" };
    const { type: r, payload: n } = e;
    if (!r || typeof r != "string")
      return { success: !1, error: "Malformed message: Missing type property" };
    console.log(`[MessageRouter] Routing message type: ${r}`, { senderId: t.id, origin: t.origin });
    const o = tr[r];
    return o ? { success: !0, data: await o(n, t) } : (console.warn(`[MessageRouter] Unknown message type: ${r}`), { success: !1, error: `Unknown message type: '${r}'` });
  } catch (r) {
    return console.error("[MessageRouter] Error routing message:", r), {
      success: !1,
      error: r instanceof Error ? r.message : "Internal background processing error"
    };
  }
}
chrome.runtime.onInstalled.addListener(async (e) => {
  if (console.log(`[ServiceWorker] Extension installation event: ${e.reason}`), e.reason === "install")
    try {
      (await chrome.storage.local.get("settings")).settings || (await chrome.storage.local.set({
        settings: Me,
        scans: []
        // Initialize scan log history
      }), console.log("[ServiceWorker] Default settings storage initialized."));
    } catch (t) {
      console.error("[ServiceWorker] Error initializing storage settings:", t);
    }
  else e.reason === "update" && console.log("[ServiceWorker] SafeLens successfully updated to new version.");
});
chrome.runtime.onMessage.addListener((e, t, r) => {
  if (console.log("[ServiceWorker] Raw onMessage received:", e ? e.type : "unknown"), e && e.target === "offscreen")
    return !1;
  let n = !1;
  const o = (s) => {
    if (!n) {
      n = !0, a && clearInterval(a), i && clearTimeout(i);
      try {
        r(s);
      } catch (l) {
        console.error("[ServiceWorker] Failed to execute sendResponse (channel may be dead):", l);
      }
    }
  }, a = setInterval(() => {
    chrome.runtime && chrome.runtime.getPlatformInfo && chrome.runtime.getPlatformInfo();
  }, 2e4), i = setTimeout(() => {
    console.warn("[ServiceWorker] Message routing timed out (240s). Forcefully resolving channel."), o({ success: !1, error: "Background async processing timeout (240s)" });
  }, 24e4);
  try {
    rr(e, t).then((s) => {
      if (s && s.success && s.payload) {
        const l = s.payload;
        console.log("===== RESULT FROM OFFSCREEN ====="), console.log(l), console.log(l.data), console.log(l.data?.constructor?.name), console.log(l.data?.byteLength), console.log(l.data?.length);
      }
      o(s);
    }).catch((s) => {
      console.error("[ServiceWorker] Message routing failure:", s), o({
        success: !1,
        error: s instanceof Error ? s.message : "Async processing exception"
      });
    });
  } catch (s) {
    console.error("[ServiceWorker] Synchronous crash during routing:", s), o({ success: !1, error: "Synchronous routing crash: " + s.message });
  }
  return !0;
});
