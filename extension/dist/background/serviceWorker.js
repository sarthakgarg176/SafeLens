const Re = {
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
async function Ae(e, t = 1920, n = 1080) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let r = null, o = null;
  try {
    let { width: a, height: i } = e, s = !1;
    if (a > t && (i = Math.round(i * t / a), a = t, s = !0), i > n && (a = Math.round(a * n / i), i = n, s = !0), !s)
      return e;
    if (console.log(`[Resize] Scaling image down to ${a}x${i} using cv.resize`), typeof cv > "u" || !cv.matFromImageData)
      throw new Error("OpenCV.js runtime is not loaded");
    const h = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height);
    r = cv.matFromImageData(h), o = new cv.Mat();
    const m = new cv.Size(a, i);
    cv.resize(r, o, m, 0, 0, cv.INTER_AREA);
    const c = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(a, i) : document.createElement("canvas");
    c.width = a, c.height = i;
    const g = c.getContext("2d", { willReadFrequently: !0 }), p = new ImageData(new Uint8ClampedArray(o.data), o.cols, o.rows);
    return g.putImageData(p, 0, 0), c;
  } catch (a) {
    console.warn("[Resize] OpenCV resizing failed. Falling back to native canvas context scaling:", a);
    try {
      const { width: i, height: s } = e;
      let u = i, h = s;
      u > t && (h = Math.round(h * t / u), u = t), h > n && (u = Math.round(u * n / h), h = n);
      const m = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(u, h) : document.createElement("canvas");
      m.width = u, m.height = h;
      const c = m.getContext("2d", { willReadFrequently: !0 });
      return c.imageSmoothingEnabled = !0, c.imageSmoothingQuality = "high", c.drawImage(e, 0, 0, u, h), m;
    } catch (i) {
      return console.error("[Resize] Native canvas resizing fallback failed. Returning original image.", i), e;
    }
  } finally {
    r && r.delete(), o && o.delete();
  }
}
async function Oe(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let t = null, n = null, r = null;
  try {
    if (typeof cv > "u" || !cv.cvtColor)
      throw new Error("OpenCV.js runtime is not loaded");
    const a = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(a), n = new cv.Mat(), cv.cvtColor(t, n, cv.COLOR_RGBA2GRAY), r = new cv.Mat(), cv.cvtColor(n, r, cv.COLOR_GRAY2RGBA);
    const i = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    i.width = e.width, i.height = e.height;
    const s = i.getContext("2d", { willReadFrequently: !0 }), u = new ImageData(new Uint8ClampedArray(r.data), r.cols, r.rows);
    return s.putImageData(u, 0, 0), i;
  } catch (o) {
    console.warn("[Grayscale] OpenCV conversion failed. Falling back to native JS luminosity conversions:", o);
    try {
      const i = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height), s = i.data;
      for (let h = 0; h < s.length; h += 4) {
        const m = s[h], c = s[h + 1], g = s[h + 2], p = Math.round(0.299 * m + 0.587 * c + 0.114 * g);
        s[h] = p, s[h + 1] = p, s[h + 2] = p;
      }
      const u = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
      return u.width = e.width, u.height = e.height, u.getContext("2d", { willReadFrequently: !0 }).putImageData(i, 0, 0), u;
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
    const o = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(o), n = new cv.Mat();
    const a = new cv.Size(3, 3);
    cv.GaussianBlur(t, n, a, 0, 0, cv.BORDER_DEFAULT);
    const i = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    i.width = e.width, i.height = e.height;
    const s = i.getContext("2d", { willReadFrequently: !0 }), u = new ImageData(new Uint8ClampedArray(n.data), n.cols, n.rows);
    return s.putImageData(u, 0, 0), i;
  } catch (r) {
    return console.warn("[Denoise] Denoising failed. Skipping this stage and returning original canvas:", r), e;
  } finally {
    t && t.delete(), n && n.delete();
  }
}
async function Te(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let t = null, n = null, r = null, o = null, a = null, i = null;
  try {
    if (typeof cv > "u" || !cv.HoughLinesP)
      throw new Error("OpenCV.js runtime is not loaded");
    const u = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(u), n = new cv.Mat(), r = new cv.Mat(), o = new cv.Mat(), cv.cvtColor(t, n, cv.COLOR_RGBA2GRAY), cv.Canny(n, r, 50, 200, 3), cv.HoughLinesP(r, o, 1, Math.PI / 180, 100, 50, 10);
    let h = 0, m = 0;
    for (let x = 0; x < o.rows; ++x) {
      const v = o.data32S[x * 4], M = o.data32S[x * 4 + 1], R = o.data32S[x * 4 + 2], O = o.data32S[x * 4 + 3], T = Math.atan2(O - M, R - v) * (180 / Math.PI);
      T > -45 && T < 45 && (h += T, m++);
    }
    if (m < 3)
      return console.log("[Deskew] Insufficient line segments detected. Skipping deskew."), { canvas: e, angle: 0 };
    const c = h / m;
    if (Math.abs(c) < 0.5)
      return console.log(`[Deskew] Skew angle is negligible (${c.toFixed(2)} deg). Skipping rotation.`), { canvas: e, angle: 0 };
    console.log(`[Deskew] Correcting skew angle: ${c.toFixed(2)} degrees`);
    const g = new cv.Point(e.width / 2, e.height / 2);
    i = cv.getRotationMatrix2D(g, c, 1), a = new cv.Mat();
    const p = new cv.Size(e.width, e.height);
    cv.warpAffine(t, a, i, p, cv.INTER_CUBIC, cv.BORDER_REPLICATE);
    const E = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    E.width = e.width, E.height = e.height;
    const A = E.getContext("2d", { willReadFrequently: !0 }), S = new ImageData(new Uint8ClampedArray(a.data), a.cols, a.rows);
    return A.putImageData(S, 0, 0), { canvas: E, angle: c };
  } catch (s) {
    return console.warn("[Deskew] Hough deskewing failed. Skipping this stage and returning original canvas:", s), { canvas: e, angle: 0 };
  } finally {
    t && t.delete(), n && n.delete(), r && r.delete(), o && o.delete(), a && a.delete(), i && i.delete();
  }
}
async function Pe(e, t = 127) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let n = null, r = null, o = null, a = null;
  try {
    if (typeof cv > "u" || !cv.adaptiveThreshold)
      throw new Error("OpenCV.js runtime is not loaded");
    const s = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height);
    n = cv.matFromImageData(s), r = new cv.Mat(), cv.cvtColor(n, r, cv.COLOR_RGBA2GRAY), o = new cv.Mat(), cv.adaptiveThreshold(
      r,
      o,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      11,
      2
    ), a = new cv.Mat(), cv.cvtColor(o, a, cv.COLOR_GRAY2RGBA);
    const u = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    u.width = e.width, u.height = e.height;
    const h = u.getContext("2d", { willReadFrequently: !0 }), m = new ImageData(new Uint8ClampedArray(a.data), a.cols, a.rows);
    return h.putImageData(m, 0, 0), u;
  } catch (i) {
    console.warn("[Threshold] OpenCV adaptive thresholding failed. Falling back to grayscale image:", i);
    try {
      return await _e(e);
    } catch (s) {
      return console.error("[Threshold] Grayscale fallback failed. Returning original canvas.", s), e;
    }
  } finally {
    n && n.delete(), r && r.delete(), o && o.delete(), a && a.delete();
  }
}
async function _e(e) {
  const n = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height), r = n.data;
  for (let a = 0; a < r.length; a += 4) {
    const i = Math.round(0.299 * r[a] + 0.587 * r[a + 1] + 0.114 * r[a + 2]);
    r[a] = i, r[a + 1] = i, r[a + 2] = i;
  }
  const o = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
  return o.width = e.width, o.height = e.height, o.getContext("2d", { willReadFrequently: !0 }).putImageData(n, 0, 0), o;
}
let J = null;
async function Le() {
  if (typeof chrome > "u" || !chrome.offscreen)
    return;
  const e = "public/offscreen.html";
  let t = !1;
  if (chrome.runtime.getContexts && (t = (await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(e)]
  })).length > 0), t) {
    try {
      if (await new Promise((r) => {
        const o = setTimeout(() => r(!1), 1e3);
        chrome.runtime.sendMessage({ target: "offscreen", type: "PING" }, (a) => {
          clearTimeout(o), r(a && a.from === "offscreen");
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
  } catch (n) {
    if (!n.message.includes("Only a single offscreen"))
      throw n;
  } finally {
    J = null;
  }
}
async function Be(e, t, n = 15e3) {
  await Le();
  const r = (o = 3) => new Promise((a, i) => {
    let s = setTimeout(() => {
      i(new Error(`Offscreen execution timed out after ${n}ms`));
    }, n);
    console.log("========= BEFORE SENDMESSAGE ========="), console.log(t), console.log(t.data?.constructor?.name), console.log(t.data?.byteLength), console.log("======================================"), chrome.runtime.sendMessage({
      target: "offscreen",
      type: e,
      payload: t
    }, (u) => {
      if (clearTimeout(s), chrome.runtime.lastError) {
        const h = chrome.runtime.lastError.message;
        if (h.includes("Could not establish connection") && o > 0) {
          console.warn(`[OffscreenManager] Connection failed (${h}). Retrying in 100ms... (${o} retries left)`), setTimeout(() => {
            r(o - 1).then(a, i);
          }, 100);
          return;
        }
        return i(new Error(h));
      }
      if (!u)
        return i(new Error("No response received from offscreen document"));
      if (!u.success)
        return i(new Error(u.error || "Offscreen processing failed"));
      a(u.payload);
    });
  });
  return r();
}
async function Ce(e, t = {}) {
  if (typeof document > "u" && typeof chrome < "u" && chrome.offscreen)
    return e;
  const {
    enableDenoise: n = !1,
    // ID cards ke liye false rakha hai
    enableDeskew: r = !0,
    thresholdValue: o = 0,
    // 0 = Skip thresholding to preserve edges
    maxWidth: a = 1920,
    maxHeight: i = 1080
  } = t;
  console.log("[Preprocessor] Beginning Safe-Mode pipeline...");
  let s = e;
  try {
    return s = await Ae(s, a, i), s = await Oe(s), n && (s = await De(s)), r && (s = (await Te(s)).canvas), o > 0 && (s = await Pe(s, o)), s;
  } catch (u) {
    return console.error("[Preprocessor] Pipeline failure, returning raw.", u), e;
  }
}
var Fe = { exports: {} };
(function(e) {
  var t = function(n) {
    var r = Object.prototype, o = r.hasOwnProperty, a = Object.defineProperty || function(d, l, f) {
      d[l] = f.value;
    }, i, s = typeof Symbol == "function" ? Symbol : {}, u = s.iterator || "@@iterator", h = s.asyncIterator || "@@asyncIterator", m = s.toStringTag || "@@toStringTag";
    function c(d, l, f) {
      return Object.defineProperty(d, l, {
        value: f,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }), d[l];
    }
    try {
      c({}, "");
    } catch {
      c = function(l, f, y) {
        return l[f] = y;
      };
    }
    function g(d, l, f, y) {
      var w = l && l.prototype instanceof M ? l : M, I = Object.create(w.prototype), L = new V(y || []);
      return a(I, "_invoke", { value: ae(d, f, L) }), I;
    }
    n.wrap = g;
    function p(d, l, f) {
      try {
        return { type: "normal", arg: d.call(l, f) };
      } catch (y) {
        return { type: "throw", arg: y };
      }
    }
    var E = "suspendedStart", A = "suspendedYield", S = "executing", x = "completed", v = {};
    function M() {
    }
    function R() {
    }
    function O() {
    }
    var T = {};
    c(T, u, function() {
      return this;
    });
    var $ = Object.getPrototypeOf, P = $ && $($(b([])));
    P && P !== r && o.call(P, u) && (T = P);
    var D = O.prototype = M.prototype = Object.create(T);
    R.prototype = O, a(D, "constructor", { value: O, configurable: !0 }), a(
      O,
      "constructor",
      { value: R, configurable: !0 }
    ), R.displayName = c(
      O,
      m,
      "GeneratorFunction"
    );
    function _(d) {
      ["next", "throw", "return"].forEach(function(l) {
        c(d, l, function(f) {
          return this._invoke(l, f);
        });
      });
    }
    n.isGeneratorFunction = function(d) {
      var l = typeof d == "function" && d.constructor;
      return l ? l === R || // For the native GeneratorFunction constructor, the best we can
      // do is to check its .name property.
      (l.displayName || l.name) === "GeneratorFunction" : !1;
    }, n.mark = function(d) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(d, O) : (d.__proto__ = O, c(d, m, "GeneratorFunction")), d.prototype = Object.create(D), d;
    }, n.awrap = function(d) {
      return { __await: d };
    };
    function Z(d, l) {
      function f(I, L, N, z) {
        var q = p(d[I], d, L);
        if (q.type === "throw")
          z(q.arg);
        else {
          var se = q.arg, K = se.value;
          return K && typeof K == "object" && o.call(K, "__await") ? l.resolve(K.__await).then(function(j) {
            f("next", j, N, z);
          }, function(j) {
            f("throw", j, N, z);
          }) : l.resolve(K).then(function(j) {
            se.value = j, N(se);
          }, function(j) {
            return f("throw", j, N, z);
          });
        }
      }
      var y;
      function w(I, L) {
        function N() {
          return new l(function(z, q) {
            f(I, L, z, q);
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
          N,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          N
        ) : N();
      }
      a(this, "_invoke", { value: w });
    }
    _(Z.prototype), c(Z.prototype, h, function() {
      return this;
    }), n.AsyncIterator = Z, n.async = function(d, l, f, y, w) {
      w === void 0 && (w = Promise);
      var I = new Z(
        g(d, l, f, y),
        w
      );
      return n.isGeneratorFunction(l) ? I : I.next().then(function(L) {
        return L.done ? L.value : I.next();
      });
    };
    function ae(d, l, f) {
      var y = E;
      return function(I, L) {
        if (y === S)
          throw new Error("Generator is already running");
        if (y === x) {
          if (I === "throw")
            throw L;
          return C();
        }
        for (f.method = I, f.arg = L; ; ) {
          var N = f.delegate;
          if (N) {
            var z = Q(N, f);
            if (z) {
              if (z === v) continue;
              return z;
            }
          }
          if (f.method === "next")
            f.sent = f._sent = f.arg;
          else if (f.method === "throw") {
            if (y === E)
              throw y = x, f.arg;
            f.dispatchException(f.arg);
          } else f.method === "return" && f.abrupt("return", f.arg);
          y = S;
          var q = p(d, l, f);
          if (q.type === "normal") {
            if (y = f.done ? x : A, q.arg === v)
              continue;
            return {
              value: q.arg,
              done: f.done
            };
          } else q.type === "throw" && (y = x, f.method = "throw", f.arg = q.arg);
        }
      };
    }
    function Q(d, l) {
      var f = l.method, y = d.iterator[f];
      if (y === i)
        return l.delegate = null, f === "throw" && d.iterator.return && (l.method = "return", l.arg = i, Q(d, l), l.method === "throw") || f !== "return" && (l.method = "throw", l.arg = new TypeError(
          "The iterator does not provide a '" + f + "' method"
        )), v;
      var w = p(y, d.iterator, l.arg);
      if (w.type === "throw")
        return l.method = "throw", l.arg = w.arg, l.delegate = null, v;
      var I = w.arg;
      if (!I)
        return l.method = "throw", l.arg = new TypeError("iterator result is not an object"), l.delegate = null, v;
      if (I.done)
        l[d.resultName] = I.value, l.next = d.nextLoc, l.method !== "return" && (l.method = "next", l.arg = i);
      else
        return I;
      return l.delegate = null, v;
    }
    _(D), c(D, m, "Generator"), c(D, u, function() {
      return this;
    }), c(D, "toString", function() {
      return "[object Generator]";
    });
    function ie(d) {
      var l = { tryLoc: d[0] };
      1 in d && (l.catchLoc = d[1]), 2 in d && (l.finallyLoc = d[2], l.afterLoc = d[3]), this.tryEntries.push(l);
    }
    function H(d) {
      var l = d.completion || {};
      l.type = "normal", delete l.arg, d.completion = l;
    }
    function V(d) {
      this.tryEntries = [{ tryLoc: "root" }], d.forEach(ie, this), this.reset(!0);
    }
    n.keys = function(d) {
      var l = Object(d), f = [];
      for (var y in l)
        f.push(y);
      return f.reverse(), function w() {
        for (; f.length; ) {
          var I = f.pop();
          if (I in l)
            return w.value = I, w.done = !1, w;
        }
        return w.done = !0, w;
      };
    };
    function b(d) {
      if (d) {
        var l = d[u];
        if (l)
          return l.call(d);
        if (typeof d.next == "function")
          return d;
        if (!isNaN(d.length)) {
          var f = -1, y = function w() {
            for (; ++f < d.length; )
              if (o.call(d, f))
                return w.value = d[f], w.done = !1, w;
            return w.value = i, w.done = !0, w;
          };
          return y.next = y;
        }
      }
      return { next: C };
    }
    n.values = b;
    function C() {
      return { value: i, done: !0 };
    }
    return V.prototype = {
      constructor: V,
      reset: function(d) {
        if (this.prev = 0, this.next = 0, this.sent = this._sent = i, this.done = !1, this.delegate = null, this.method = "next", this.arg = i, this.tryEntries.forEach(H), !d)
          for (var l in this)
            l.charAt(0) === "t" && o.call(this, l) && !isNaN(+l.slice(1)) && (this[l] = i);
      },
      stop: function() {
        this.done = !0;
        var d = this.tryEntries[0], l = d.completion;
        if (l.type === "throw")
          throw l.arg;
        return this.rval;
      },
      dispatchException: function(d) {
        if (this.done)
          throw d;
        var l = this;
        function f(z, q) {
          return I.type = "throw", I.arg = d, l.next = z, q && (l.method = "next", l.arg = i), !!q;
        }
        for (var y = this.tryEntries.length - 1; y >= 0; --y) {
          var w = this.tryEntries[y], I = w.completion;
          if (w.tryLoc === "root")
            return f("end");
          if (w.tryLoc <= this.prev) {
            var L = o.call(w, "catchLoc"), N = o.call(w, "finallyLoc");
            if (L && N) {
              if (this.prev < w.catchLoc)
                return f(w.catchLoc, !0);
              if (this.prev < w.finallyLoc)
                return f(w.finallyLoc);
            } else if (L) {
              if (this.prev < w.catchLoc)
                return f(w.catchLoc, !0);
            } else if (N) {
              if (this.prev < w.finallyLoc)
                return f(w.finallyLoc);
            } else
              throw new Error("try statement without catch or finally");
          }
        }
      },
      abrupt: function(d, l) {
        for (var f = this.tryEntries.length - 1; f >= 0; --f) {
          var y = this.tryEntries[f];
          if (y.tryLoc <= this.prev && o.call(y, "finallyLoc") && this.prev < y.finallyLoc) {
            var w = y;
            break;
          }
        }
        w && (d === "break" || d === "continue") && w.tryLoc <= l && l <= w.finallyLoc && (w = null);
        var I = w ? w.completion : {};
        return I.type = d, I.arg = l, w ? (this.method = "next", this.next = w.finallyLoc, v) : this.complete(I);
      },
      complete: function(d, l) {
        if (d.type === "throw")
          throw d.arg;
        return d.type === "break" || d.type === "continue" ? this.next = d.arg : d.type === "return" ? (this.rval = this.arg = d.arg, this.method = "return", this.next = "end") : d.type === "normal" && l && (this.next = l), v;
      },
      finish: function(d) {
        for (var l = this.tryEntries.length - 1; l >= 0; --l) {
          var f = this.tryEntries[l];
          if (f.finallyLoc === d)
            return this.complete(f.completion, f.afterLoc), H(f), v;
        }
      },
      catch: function(d) {
        for (var l = this.tryEntries.length - 1; l >= 0; --l) {
          var f = this.tryEntries[l];
          if (f.tryLoc === d) {
            var y = f.completion;
            if (y.type === "throw") {
              var w = y.arg;
              H(f);
            }
            return w;
          }
        }
        throw new Error("illegal catch attempt");
      },
      delegateYield: function(d, l, f) {
        return this.delegate = {
          iterator: b(d),
          resultName: l,
          nextLoc: f
        }, this.method === "next" && (this.arg = i), v;
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
})(Fe);
var Ie = (e, t) => `${e}-${t}-${Math.random().toString(16).slice(3, 8)}`;
const $e = Ie;
let fe = 0;
var Ne = ({
  id: e,
  action: t,
  payload: n = {}
}) => {
  let r = e;
  return typeof r > "u" && (r = $e("Job", fe), fe += 1), {
    id: r,
    action: t,
    payload: n
  };
}, oe = {};
let de = !1;
oe.logging = de;
oe.setLogging = (e) => {
  de = e;
};
oe.log = (...e) => de ? console.log.apply(void 0, e) : null;
function qe(e) {
  throw new Error('Could not dynamically require "' + e + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var ze = (e) => {
  const t = {};
  return typeof WorkerGlobalScope < "u" ? t.type = "webworker" : typeof document == "object" ? t.type = "browser" : typeof process == "object" && typeof qe == "function" && (t.type = "node"), typeof e > "u" ? t : t[e];
};
const Ge = ze("type") === "browser", Ue = Ge ? (e) => new URL(e, window.location.href).href : (e) => e;
var We = (e) => {
  const t = { ...e };
  return ["corePath", "workerPath", "langPath"].forEach((n) => {
    e[n] && (t[n] = Ue(t[n]));
  }), t;
}, je = {
  TESSERACT_ONLY: 0,
  LSTM_ONLY: 1,
  TESSERACT_LSTM_COMBINED: 2,
  DEFAULT: 3
};
const Ye = "7.0.0", Ze = {
  version: Ye
};
var He = {
  /*
   * Use BlobURL for worker script by default
   * TODO: remove this option
   *
   */
  workerBlobURL: !0,
  logger: () => {
  }
};
const Ve = Ze.version, Ke = He;
var Je = {
  ...Ke,
  workerPath: `https://cdn.jsdelivr.net/npm/tesseract.js@v${Ve}/dist/worker.min.js`
}, Xe = ({ workerPath: e, workerBlobURL: t }) => {
  let n;
  if (Blob && URL && t) {
    const r = new Blob([`importScripts("${e}");`], {
      type: "application/javascript"
    });
    n = new Worker(URL.createObjectURL(r));
  } else
    n = new Worker(e);
  return n;
}, Qe = (e) => {
  e.terminate();
}, et = (e, t) => {
  e.onmessage = ({ data: n }) => {
    t(n);
  };
}, tt = async (e, t) => {
  e.postMessage(t);
};
const ce = (e) => new Promise((t, n) => {
  const r = new FileReader();
  r.onload = () => {
    t(r.result);
  }, r.onerror = ({ target: { error: { code: o } } }) => {
    n(Error(`File could not be read! Code=${o}`));
  }, r.readAsArrayBuffer(e);
}), ue = async (e) => {
  let t = e;
  if (typeof e > "u")
    return "undefined";
  if (typeof e == "string")
    /data:image\/([a-zA-Z]*);base64,([^"]*)/.test(e) ? t = atob(e.split(",")[1]).split("").map((n) => n.charCodeAt(0)) : t = await (await fetch(e)).arrayBuffer();
  else if (typeof HTMLElement < "u" && e instanceof HTMLElement)
    e.tagName === "IMG" && (t = await ue(e.src)), e.tagName === "VIDEO" && (t = await ue(e.poster)), e.tagName === "CANVAS" && await new Promise((n) => {
      e.toBlob(async (r) => {
        t = await ce(r), n();
      });
    });
  else if (typeof OffscreenCanvas < "u" && e instanceof OffscreenCanvas) {
    const n = await e.convertToBlob();
    t = await ce(n);
  } else (e instanceof File || e instanceof Blob) && (t = await ce(e));
  return new Uint8Array(t);
};
var rt = ue;
const nt = Je, ot = Xe, at = Qe, it = et, st = tt, ct = rt;
var lt = {
  defaultOptions: nt,
  spawnWorker: ot,
  terminateWorker: at,
  onMessage: it,
  send: st,
  loadImage: ct
};
const ut = We, G = Ne, { log: he } = oe, dt = Ie, Y = je, {
  defaultOptions: ft,
  spawnWorker: ht,
  terminateWorker: gt,
  onMessage: mt,
  loadImage: ge,
  send: wt
} = lt;
let me = 0;
var Ee = async (e = "eng", t = Y.LSTM_ONLY, n = {}, r = {}) => {
  const o = dt("Worker", me), {
    logger: a,
    errorHandler: i,
    ...s
  } = ut({
    ...ft,
    ...n
  }), u = {}, h = typeof e == "string" ? e.split("+") : e;
  let m = t, c = r;
  const g = [Y.DEFAULT, Y.LSTM_ONLY].includes(t) && !s.legacyCore;
  let p, E;
  const A = new Promise((b, C) => {
    E = b, p = C;
  }), S = (b) => {
    p(b.message);
  };
  let x = ht(s);
  x.onerror = S, me += 1;
  const v = ({ id: b, action: C, payload: d }) => new Promise((l, f) => {
    he(`[${o}]: Start ${b}, action=${C}`);
    const y = `${C}-${b}`;
    u[y] = { resolve: l, reject: f }, wt(x, {
      workerId: o,
      jobId: b,
      action: C,
      payload: d
    });
  }), M = () => console.warn("`load` is depreciated and should be removed from code (workers now come pre-loaded)"), R = (b) => v(G({
    id: b,
    action: "load",
    payload: { options: { lstmOnly: g, corePath: s.corePath, logging: s.logging } }
  })), O = (b, C, d) => v(G({
    id: d,
    action: "FS",
    payload: { method: "writeFile", args: [b, C] }
  })), T = (b, C) => v(G({
    id: C,
    action: "FS",
    payload: { method: "readFile", args: [b, { encoding: "utf8" }] }
  })), $ = (b, C) => v(G({
    id: C,
    action: "FS",
    payload: { method: "unlink", args: [b] }
  })), P = (b, C, d) => v(G({
    id: d,
    action: "FS",
    payload: { method: b, args: C }
  })), D = (b, C) => v(G({
    id: C,
    action: "loadLanguage",
    payload: {
      langs: b,
      options: {
        langPath: s.langPath,
        dataPath: s.dataPath,
        cachePath: s.cachePath,
        cacheMethod: s.cacheMethod,
        gzip: s.gzip,
        lstmOnly: [Y.DEFAULT, Y.LSTM_ONLY].includes(m) && !s.legacyLang
      }
    }
  })), _ = (b, C, d, l) => v(G({
    id: l,
    action: "initialize",
    payload: { langs: b, oem: C, config: d }
  })), Z = (b = "eng", C, d, l) => {
    if (g && [Y.TESSERACT_ONLY, Y.TESSERACT_LSTM_COMBINED].includes(C)) throw Error("Legacy model requested but code missing.");
    const f = C || m;
    m = f;
    const y = d || c;
    c = y;
    const I = (typeof b == "string" ? b.split("+") : b).filter((L) => !h.includes(L));
    return h.push(...I), I.length > 0 ? D(I, l).then(() => _(b, f, y, l)) : _(b, f, y, l);
  }, ae = (b = {}, C) => v(G({
    id: C,
    action: "setParameters",
    payload: { params: b }
  })), Q = async (b, C = {}, d = {
    text: !0
  }, l) => v(G({
    id: l,
    action: "recognize",
    payload: { image: await ge(b), options: C, output: d }
  })), ie = async (b, C) => {
    if (g) throw Error("`worker.detect` requires Legacy model, which was not loaded.");
    return v(G({
      id: C,
      action: "detect",
      payload: { image: await ge(b) }
    }));
  }, H = async () => (x !== null && (gt(x), x = null), Promise.resolve());
  mt(x, ({
    workerId: b,
    jobId: C,
    status: d,
    action: l,
    data: f
  }) => {
    const y = `${l}-${C}`;
    if (d === "resolve")
      he(`[${b}]: Complete ${C}`), u[y].resolve({ jobId: C, data: f }), delete u[y];
    else if (d === "reject")
      if (u[y].reject(f), delete u[y], l === "load" && p(f), i)
        i(f);
      else
        throw Error(f);
    else d === "progress" && a({ ...f, userJobId: C });
  });
  const V = {
    id: o,
    worker: x,
    load: M,
    writeText: O,
    readText: T,
    removeFile: $,
    FS: P,
    reinitialize: Z,
    setParameters: ae,
    recognize: Q,
    detect: ie,
    terminate: H
  };
  return R().then(() => D(e)).then(() => _(e, t, r)).then(() => E(V)).catch(() => {
  }), A;
};
const Se = Ee, yt = async (e, t, n) => {
  const r = await Se(t, 1, n);
  return r.recognize(e).finally(async () => {
    await r.terminate();
  });
}, pt = async (e, t) => {
  const n = await Se("osd", 0, t);
  return n.detect(e).finally(async () => {
    await n.terminate();
  });
};
var vt = {
  recognize: yt,
  detect: pt
};
const bt = Ee, xt = vt;
var Ct = {
  createWorker: bt,
  ...xt
};
let le = null, X = null, we = Promise.resolve();
async function It(e = "eng") {
  return le || X || (X = (async () => {
    try {
      console.log("[TesseractWorker] Spawning local OCR worker...");
      const t = await Ct.createWorker(e, 1, {
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
        tessedit_create_tsv: "1",
        // Force Tabular layout (guarantees words array)
        tessedit_ocr_engine_mode: "1"
        // Neural Net (best accuracy)
      }), le = t, t;
    } catch (t) {
      throw console.error("[TesseractWorker] Failed to create worker:", t), X = null, t;
    }
  })(), X);
}
async function Et(e) {
  let t;
  const n = new Promise((r) => {
    we.then(() => r());
  });
  we = new Promise((r) => {
    t = r;
  }), await n;
  try {
    return await (await It()).recognize(e, {
      tessjs_create_hocr: "1",
      tessjs_create_tsv: "1"
    });
  } finally {
    t();
  }
}
function St(e) {
  if (!e) return [];
  const t = [];
  try {
    e.words && Array.isArray(e.words) && e.words.length > 0 ? e.words.forEach((n) => {
      n.bbox && n.text.trim().length > 0 && t.push({
        text: n.text,
        x0: n.bbox.x0,
        y0: n.bbox.y0,
        x1: n.bbox.x1,
        y1: n.bbox.y1
      });
    }) : e.lines && Array.isArray(e.lines) && e.lines.forEach((n) => {
      n.words && Array.isArray(n.words) && n.words.forEach((r) => {
        r.bbox && r.text.trim().length > 0 && t.push({
          text: r.text,
          x0: r.bbox.x0,
          y0: r.bbox.y0,
          x1: r.bbox.x1,
          y1: r.bbox.y1
        });
      });
    });
  } catch (n) {
    console.error("[ExtractBoundingBoxes] Parsing failed silently:", n);
  }
  return t;
}
function Mt(e) {
  const t = new Uint8Array(e);
  let n = "";
  const r = 8192;
  for (let o = 0; o < t.length; o += r)
    n += String.fromCharCode.apply(null, t.subarray(o, o + r));
  return btoa(n);
}
async function kt(e) {
  try {
    if (typeof document > "u" && typeof chrome < "u" && chrome.offscreen) {
      const n = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height), r = Mt(n.data.buffer);
      if (!r || r.length < 100) throw new Error("OCR source data missing");
      const o = await Be("RECOGNIZE_IMAGE", {
        width: e.width,
        height: e.height,
        base64Data: r
      });
      return console.log(`[RecognizeImage] Received from Offscreen. Boxes: ${o?.boundingBoxes?.length || 0}`), o;
    } else {
      const t = await Et(e), n = t.data || t;
      let r = n.words || [];
      r.length === 0 && n.lines && n.lines.forEach((a) => {
        a.words && r.push(...a.words);
      });
      const o = St(n);
      return console.log(`[RecognizeImage] OCR Local Success. Words: ${r.length}. Boxes: ${o.length}`), {
        text: n.text || "",
        confidence: n.confidence || 0,
        words: r,
        boundingBoxes: o,
        processingTime: t.processingTime || 0
      };
    }
  } catch (t) {
    return console.error("[RecognizeImage] Pipeline failed:", t), { text: "", confidence: 0, words: [], boundingBoxes: [], processingTime: 0 };
  }
}
const Rt = {
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
}, ye = (e) => (e || "").replace(/[\s\-_]/g, "").toLowerCase();
function At(e, t = []) {
  if (!e) return [];
  console.log("[RegexDetector] Inspecting first 3 wordBoxes structure:", t.slice(0, 3));
  const n = [];
  for (const [r, o] of Object.entries(Rt)) {
    o.lastIndex = 0;
    let a;
    for (; (a = o.exec(e)) !== null; ) {
      const i = a[0], s = ye(i), u = t.filter((h) => {
        const m = (h.text || h.word || h.value || h.content || "").toString().trim();
        if (!m) return !1;
        const c = ye(m);
        return s.includes(c) || c.includes(s);
      }).map(Ot);
      u.length === 0 && console.warn(`[RegexDetector] Mapping FAILED for: "${i}".`), n.push({
        type: r,
        value: i,
        bboxes: u,
        source: "regex"
      });
    }
  }
  return n;
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
function ee(e) {
  if (!Array.isArray(e) || e.length <= 1)
    return e;
  const t = [...e].sort((o, a) => o.x - a.x), n = [];
  let r = t[0];
  for (let o = 1; o < t.length; o++) {
    const a = t[o], i = r.y + r.height, s = a.y + a.height, u = Math.min(i, s) - Math.max(r.y, a.y), h = a.x - (r.x + r.width);
    if (u > 0 && h <= 15) {
      const m = Math.min(r.x, a.x), c = Math.min(r.y, a.y), g = Math.max(r.x + r.width, a.x + a.width), p = Math.max(i, s);
      r = {
        x: m,
        y: c,
        width: g - m,
        height: p - c,
        confidence: Math.max(r.confidence, a.confidence)
      };
    } else
      n.push(r), r = a;
  }
  return n.push(r), n;
}
function Dt(e) {
  if (!Array.isArray(e) || e.length <= 1)
    return e || [];
  const t = [...e].sort((a, i) => a.startIndex - i.startIndex), n = [];
  let r = t[0];
  for (let a = 1; a < t.length; a++) {
    const i = t[a];
    i.startIndex <= r.endIndex ? i.rulePassed && !r.rulePassed || i.rulePassed === r.rulePassed && i.regexConfidence > r.regexConfidence ? r = {
      ...i,
      startIndex: r.startIndex,
      endIndex: Math.max(r.endIndex, i.endIndex),
      value: r.value + i.value.substring(Math.max(0, r.endIndex - i.startIndex)),
      bboxes: ee([...r.bboxes, ...i.bboxes])
    } : r = {
      ...r,
      endIndex: Math.max(r.endIndex, i.endIndex),
      value: r.value + i.value.substring(Math.max(0, r.endIndex - i.startIndex)),
      bboxes: ee([...r.bboxes, ...i.bboxes])
    } : (r.bboxes = ee(r.bboxes), n.push(r), r = i);
  }
  r.bboxes = ee(r.bboxes), n.push(r);
  const o = /* @__PURE__ */ new Set();
  return n.filter((a) => {
    const i = `${a.type}_${a.startIndex}_${a.value}`;
    return o.has(i) ? !1 : (o.add(i), !0);
  });
}
const Tt = {
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
  let t = 0, n = !1;
  e.forEach((o) => {
    const a = Tt[o.severity] || 2, i = typeof o.fusedConfidence == "number" ? o.fusedConfidence : 0.8;
    t += a * i, o.severity === "critical" && i >= 0.7 && (n = !0);
  });
  let r = "low";
  return n || t >= 15 ? r = "critical" : t >= 5 ? r = "high" : t >= 2 && (r = "medium"), console.log(`[RiskAnalyzer] Calculated document risk score: ${t.toFixed(2)} -> Level: ${r.toUpperCase()}`), {
    riskLevel: r,
    score: parseFloat(t.toFixed(2)),
    detections: e
  };
}
async function Me(e) {
  if (!e) throw new TypeError("File parameter is required");
  if (typeof document > "u") {
    const t = await e.arrayBuffer(), n = new Blob([t], { type: e.type || "image/png" }), r = await createImageBitmap(n), o = new OffscreenCanvas(r.width, r.height);
    return o.getContext("2d", { willReadFrequently: !0 }).drawImage(r, 0, 0), o;
  } else
    return new Promise((t, n) => {
      const r = new FileReader();
      r.onload = (o) => {
        const a = new Image();
        a.onload = () => {
          const i = document.createElement("canvas");
          i.width = a.width, i.height = a.height, i.getContext("2d", { willReadFrequently: !0 }).drawImage(a, 0, 0), t(i);
        }, a.onerror = (i) => n(new Error(`Failed to decode image: ${i}`)), a.src = o.target.result;
      }, r.onerror = (o) => n(new Error(`Failed to read file: ${o}`)), r.readAsDataURL(e);
    });
}
async function _t(e, t = {}) {
  const n = Date.now();
  try {
    const r = await Me(e), o = await Ce(r, t.preprocess), a = await kt(o), i = a.boundingBoxes || [];
    console.log(`[ScanService] Pipeline running with ${i.length} boxes.`);
    const s = At(a.text, i), u = Dt(s), h = Pt(u);
    return {
      success: !0,
      detections: u,
      riskLevel: h.riskLevel,
      processingTime: Date.now() - n
    };
  } catch (r) {
    return console.error("[ScanService] Pipeline failed:", r), { success: !1, detections: [], error: r.message };
  }
}
function Lt(e) {
  const n = Array.from({ length: 8 }, () => new Array(8).fill(0));
  for (let r = 0; r < 8; r++)
    for (let o = 0; o < 8; o++) {
      let a = 0;
      for (let u = 0; u < 8; u++)
        for (let h = 0; h < 8; h++)
          a += e[u][h] * Math.cos((2 * u + 1) * r * Math.PI / 16) * Math.cos((2 * h + 1) * o * Math.PI / 16);
      const i = r === 0 ? 1 / Math.sqrt(2) : 1, s = o === 0 ? 1 / Math.sqrt(2) : 1;
      n[r][o] = 0.25 * i * s * a;
    }
  return n;
}
function Bt(e) {
  const n = Array.from({ length: 8 }, () => new Array(8).fill(0));
  for (let r = 0; r < 8; r++)
    for (let o = 0; o < 8; o++) {
      let a = 0;
      for (let i = 0; i < 8; i++)
        for (let s = 0; s < 8; s++) {
          const u = i === 0 ? 1 / Math.sqrt(2) : 1, h = s === 0 ? 1 / Math.sqrt(2) : 1;
          a += u * h * e[i][s] * Math.cos((2 * r + 1) * i * Math.PI / 16) * Math.cos((2 * o + 1) * s * Math.PI / 16);
        }
      n[r][o] = 0.25 * a;
    }
  return n;
}
const B = 8, te = 20;
function Ft(e) {
  const t = [];
  for (let n = 0; n < e.length; n++) {
    const r = e.charCodeAt(n);
    for (let o = 7; o >= 0; o--)
      t.push(r >> o & 1);
  }
  return t;
}
async function $t(e, t) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    console.log(`[WatermarkEngine] Embedding invisible DCT watermark: "${t}"`);
    const n = e.getContext("2d", { willReadFrequently: !0 }), r = e.width, o = e.height, a = n.getImageData(0, 0, r, o), i = a.data, s = Ft(t + "\0");
    let u = 0;
    const h = Math.floor(r / B) * B, m = Math.floor(o / B) * B;
    for (let c = 0; c < m; c += B)
      for (let g = 0; g < h; g += B) {
        const p = Array.from({ length: B }, () => new Array(B).fill(0)), E = Array.from({ length: B }, () => new Array(B).fill(0)), A = Array.from({ length: B }, () => new Array(B).fill(0));
        for (let v = 0; v < B; v++)
          for (let M = 0; M < B; M++) {
            const R = ((c + v) * r + (g + M)) * 4, O = i[R], T = i[R + 1], $ = i[R + 2];
            p[v][M] = 0.299 * O + 0.587 * T + 0.114 * $, E[v][M] = 128 - 0.1687 * O - 0.3313 * T + 0.5 * $, A[v][M] = 128 + 0.5 * O - 0.4187 * T - 0.0813 * $;
          }
        const S = Lt(p);
        if (u < s.length) {
          const v = s[u], M = S[4][4], R = Math.round(M / te) * te;
          S[4][4] = v === 1 ? R + te / 4 : R - te / 4, u++;
        }
        const x = Bt(S);
        for (let v = 0; v < B; v++)
          for (let M = 0; M < B; M++) {
            const R = ((c + v) * r + (g + M)) * 4, O = x[v][M], T = E[v][M], $ = A[v][M];
            let P = Math.round(O + 1.402 * ($ - 128)), D = Math.round(O - 0.3441 * (T - 128) - 0.7141 * ($ - 128)), _ = Math.round(O + 1.772 * (T - 128));
            i[R] = Math.max(0, Math.min(255, P)), i[R + 1] = Math.max(0, Math.min(255, D)), i[R + 2] = Math.max(0, Math.min(255, _));
          }
      }
    return n.putImageData(a, 0, 0), e;
  } catch (n) {
    throw console.error("[WatermarkEngine] Failed to embed watermark:", n), n;
  }
}
function Nt(e, t = 8, n = 6, r = 99999, o = 99999) {
  if (!e)
    throw new TypeError("Box object is required");
  const a = Math.max(0, e.x - t), i = Math.max(0, e.y - n), s = Math.min(r, e.x + e.width + t), u = Math.min(o, e.y + e.height + n), h = s - a, m = u - i;
  return { x: a, y: i, width: h, height: m };
}
function qt(e) {
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
    const a = t[o], i = r.x + r.width, s = r.y + r.height, u = a.x + a.width, h = a.y + a.height, m = a.x <= i + 15, c = Math.min(s, h) - Math.max(r.y, a.y) > 0;
    if (m && c) {
      const g = Math.min(r.x, a.x), p = Math.max(i, u), E = Math.min(r.y, a.y), A = Math.max(s, h);
      r.x = g, r.width = p - g, r.y = E, r.height = A - E, a.detection && (r.detections.some(
        (x) => x.type === a.detection.type && x.value === a.detection.value
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
async function ke(e, t, n = 15) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  if (!Array.isArray(t) || t.length === 0)
    return e;
  const r = e.getContext("2d", { willReadFrequently: !0 });
  r.save();
  try {
    t.forEach((o) => {
      const { x: a, y: i, width: s, height: u } = o, h = Math.max(0, a), m = Math.max(0, i), c = Math.min(e.width - h, s), g = Math.min(e.height - m, u);
      if (c <= 0 || g <= 0)
        return;
      const p = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(c, g) : document.createElement("canvas");
      p.width = c, p.height = g, p.getContext("2d", { willReadFrequently: !0 }).drawImage(e, h, m, c, g, 0, 0, c, g), r.save();
      try {
        r.beginPath(), r.rect(h, m, c, g), r.clip(), r.filter = `blur(${n}px)`, r.drawImage(p, h, m);
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
function zt(e) {
  const n = typeof OffscreenCanvas < "u" && e instanceof OffscreenCanvas ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
  return n.width = e.width, n.height = e.height, n.getContext("2d", { willReadFrequently: !0 }).drawImage(e, 0, 0), n;
}
async function Gt(e, t, n = "redact", r = {}) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  const o = zt(e);
  if (!Array.isArray(t) || t.length === 0)
    return o;
  const {
    paddingX: a = 8,
    paddingY: i = 6,
    blurRadius: s = 15,
    pixelationScale: u = 8,
    fillStyle: h = "#000000"
  } = r;
  console.log(`[RedactCanvas] Running masking pipeline. Mode: ${n.toUpperCase()} on ${t.length} regions.`);
  const m = t.map(
    (p) => Nt(p, a, i, o.width, o.height)
  ), c = qt(m), g = o.getContext("2d", { willReadFrequently: !0 });
  return n === "redact" ? (g.fillStyle = h, c.forEach((p) => {
    const E = Math.max(0, p.x), A = Math.max(0, p.y), S = Math.min(o.width - E, p.width), x = Math.min(o.height - A, p.height);
    S > 0 && x > 0 && g.fillRect(E, A, S, x);
  })) : n === "blur" ? await ke(o, c, s) : n === "pixelate" && Ut(o, c, u), o;
}
function Ut(e, t, n = 8) {
  const r = e.getContext("2d", { willReadFrequently: !0 });
  t.forEach((o) => {
    const { x: a, y: i, width: s, height: u } = o, h = Math.max(0, a), m = Math.max(0, i), c = Math.min(e.width - h, s), g = Math.min(e.height - m, u);
    if (c <= 0 || g <= 0)
      return;
    const p = r.getImageData(h, m, c, g), E = p.data;
    for (let A = 0; A < g; A += n)
      for (let S = 0; S < c; S += n) {
        let x = 0, v = 0, M = 0, R = 0;
        for (let P = 0; P < n && A + P < g; P++)
          for (let D = 0; D < n && S + D < c; D++) {
            const _ = ((A + P) * c + (S + D)) * 4;
            x += E[_], v += E[_ + 1], M += E[_ + 2], R++;
          }
        const O = Math.round(x / R), T = Math.round(v / R), $ = Math.round(M / R);
        for (let P = 0; P < n && A + P < g; P++)
          for (let D = 0; D < n && S + D < c; D++) {
            const _ = ((A + P) * c + (S + D)) * 4;
            E[_] = O, E[_ + 1] = T, E[_ + 2] = $;
          }
      }
    r.putImageData(p, h, m);
  });
}
async function Wt(e, t) {
  return console.log("[AIService] Delegating invisible watermark embedding..."), $t(e, t);
}
async function jt(e, t, n = "redact") {
  return console.log(`[AIService] Delegating redaction request (mode: ${n}) for ${t.length} regions.`), n === "blur" ? ke(e, t, 8) : Gt(e, t, "redact", { fillStyle: "#000000" });
}
async function Yt(e, t, n = {}) {
  const { blurMode: r = "redact" } = n;
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    if (!Array.isArray(t) || t.length === 0)
      return e;
    const o = [];
    return t.forEach((i) => {
      Array.isArray(i.bboxes) && i.bboxes.forEach((s) => {
        s && typeof s.x == "number" && typeof s.width == "number" && s.width > 0 && s.height > 0 && o.push({
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height
        });
      });
    }), o.length === 0 ? (console.log("[BlurService] No bounding boxes found in detections. Skipping redaction."), e) : (console.log(`[BlurService] Requesting redaction of ${o.length} bounding boxes in mode: ${r}`), await jt(e, o, r));
  } catch (o) {
    throw console.error("[BlurService] Redaction processing failed:", o), o;
  }
}
const U = 8, F = 32;
async function Zt(e) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    const t = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(F, F) : document.createElement("canvas");
    t.width = F, t.height = F;
    const n = t.getContext("2d", { willReadFrequently: !0 });
    n.drawImage(e, 0, 0, F, F);
    const o = n.getImageData(0, 0, F, F).data, a = new Float32Array(F * F);
    for (let c = 0; c < o.length; c += 4)
      a[c / 4] = 0.299 * o[c] + 0.587 * o[c + 1] + 0.114 * o[c + 2];
    const i = Array.from({ length: U }, () => new Float32Array(U));
    for (let c = 0; c < U; c++)
      for (let g = 0; g < U; g++) {
        let p = 0;
        for (let S = 0; S < F; S++)
          for (let x = 0; x < F; x++)
            p += a[S * F + x] * Math.cos((2 * S + 1) * c * Math.PI / (2 * F)) * Math.cos((2 * x + 1) * g * Math.PI / (2 * F));
        const E = c === 0 ? 1 / Math.sqrt(2) : 1, A = g === 0 ? 1 / Math.sqrt(2) : 1;
        i[c][g] = 2 / F * E * A * p;
      }
    let s = 0;
    for (let c = 0; c < U; c++)
      for (let g = 0; g < U; g++)
        c === 0 && g === 0 || (s += i[c][g]);
    const u = s / (U * U - 1);
    let h = "";
    for (let c = 0; c < U; c++)
      for (let g = 0; g < U; g++)
        h += i[c][g] >= u ? "1" : "0";
    let m = "";
    for (let c = 0; c < 64; c += 4) {
      const g = h.substring(c, c + 4);
      m += parseInt(g, 2).toString(16);
    }
    return m;
  } catch (t) {
    throw console.error("[PHash] Error generating perceptual hash:", t), t;
  }
}
const W = 8, k = 16;
function pe(e, t) {
  const n = new Float32Array(t), r = t / 2;
  for (let o = 0; o < r; o++) {
    const a = e[2 * o], i = e[2 * o + 1];
    n[o] = (a + i) / Math.sqrt(2), n[r + o] = (a - i) / Math.sqrt(2);
  }
  for (let o = 0; o < t; o++)
    e[o] = n[o];
}
function Ht(e) {
  for (let t = 0; t < k; t++) {
    const n = new Float32Array(k);
    for (let r = 0; r < k; r++)
      n[r] = e[t * k + r];
    pe(n, k);
    for (let r = 0; r < k; r++)
      e[t * k + r] = n[r];
  }
  for (let t = 0; t < k; t++) {
    const n = new Float32Array(k);
    for (let r = 0; r < k; r++)
      n[r] = e[r * k + t];
    pe(n, k);
    for (let r = 0; r < k; r++)
      e[r * k + t] = n[r];
  }
}
async function Vt(e) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    const t = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(k, k) : document.createElement("canvas");
    t.width = k, t.height = k;
    const n = t.getContext("2d", { willReadFrequently: !0 });
    n.drawImage(e, 0, 0, k, k);
    const o = n.getImageData(0, 0, k, k).data, a = new Float32Array(k * k);
    for (let c = 0; c < o.length; c += 4)
      a[c / 4] = 0.299 * o[c] + 0.587 * o[c + 1] + 0.114 * o[c + 2];
    Ht(a);
    const i = Array.from({ length: W }, () => new Float32Array(W));
    let s = 0;
    for (let c = 0; c < W; c++)
      for (let g = 0; g < W; g++) {
        const p = a[c * k + g];
        i[c][g] = p, s += p;
      }
    const u = s / (W * W);
    let h = "";
    for (let c = 0; c < W; c++)
      for (let g = 0; g < W; g++)
        h += i[c][g] >= u ? "1" : "0";
    let m = "";
    for (let c = 0; c < 64; c += 4) {
      const g = h.substring(c, c + 4);
      m += parseInt(g, 2).toString(16);
    }
    return m;
  } catch (t) {
    throw console.error("[WHash] Error generating wavelet hash:", t), t;
  }
}
function Kt(e, t, n) {
  return new Promise((r, o) => {
    if (!e)
      return o(new TypeError("Canvas parameter is required"));
    const a = t.replace(/(\.[\w\d]+)$/, "_protected$1");
    if (typeof OffscreenCanvas < "u" && e instanceof OffscreenCanvas)
      e.convertToBlob({ type: n }).then((i) => {
        if (!i) return o(new Error("Failed to extract binary blob from offscreen canvas"));
        r(new File([i], a, { type: n, lastModified: Date.now() }));
      }).catch(o);
    else {
      if (typeof e.toBlob != "function")
        return o(new TypeError("Canvas does not support toBlob operations"));
      e.toBlob((i) => {
        if (!i) return o(new Error("Failed to extract binary blob from canvas"));
        r(new File([i], a, { type: n, lastModified: Date.now() }));
      }, n);
    }
  });
}
async function Jt(e, t = {}) {
  console.log(`[ProtectService] Initiating final protection pipeline for: ${e.name}`);
  const n = Date.now();
  try {
    const r = await Me(e), o = await Zt(r), a = await Vt(r);
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
        protectionSummary: { processingTime: Date.now() - n, redacted: !1 }
      };
    console.log(`[ProtectService] Applying visual protections (Mode: ${t.blurMode || "redact"})...`);
    let u = await Yt(r, i.detections, t);
    t.aiCloakEnabled && (u = await adversarialCloak(u, 5)), t.watermarkEnabled && (u = await Wt(u, "SafeLens_Protected_Asset"));
    const h = await Kt(u, e.name, e.type);
    return console.log(`[ProtectService] Protection pipeline complete. Output file: ${h.name}`), {
      success: !0,
      originalFile: e,
      protectedFile: h,
      phash: o,
      whash: a,
      metadata: { name: e.name, size: e.size, type: e.type },
      detections: i.detections,
      risk: i.riskLevel,
      protectionSummary: { processingTime: Date.now() - n, redacted: !0 }
    };
  } catch (r) {
    return console.error("[ProtectService] Critical pipeline crash:", r), {
      success: !1,
      originalFile: e,
      protectedFile: e,
      phash: "",
      whash: "",
      metadata: { name: e.name, size: e.size, type: e.type },
      detections: [],
      risk: "low",
      protectionSummary: { processingTime: Date.now() - n, redacted: !1 },
      error: r instanceof Error ? r.message : "Unknown protection pipeline failure"
    };
  }
}
class Xt {
  constructor() {
    this.baseUrl = "https://safelens-zttx.onrender.com";
  }
  async fetchWithRetry(t, n = {}, r = 3, o = 1e3) {
    let a = null;
    for (let i = 0; i < r; i++) {
      try {
        const s = await fetch(t, n);
        if (s.ok || s.status < 500 || s.status >= 600) return s;
      } catch (s) {
        a = s, console.warn(`[BridgeClient] Network connection error: ${s.message}. Retrying...`);
      }
      i < r - 1 && await new Promise((s) => setTimeout(s, o));
    }
    if (a) throw a;
  }
  /**
   * Universal Incident Notification Router
   */
  async sendIncidentNotification(t) {
    if (!t) throw new Error("Incident payload is required");
    const n = `${this.baseUrl}/api/incidents`;
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
        return { success: !0, incidentId: `mock_inc_${Date.now()}` };
      const a = await o.json();
      return a.success && a.data ? { success: !0, incidentId: a.data.incident_id } : { success: !0, incidentId: `mock_inc_${Date.now()}` };
    } catch (r) {
      return console.error("[BridgeClient] Incident pipeline handled gracefully:", r.message), { success: !0, incidentId: `mock_inc_${Date.now()}` };
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
const re = new Xt();
let ve = Promise.resolve();
function be(e) {
  if (!e) return "";
  const t = new Uint8Array(e);
  let n = "";
  for (let r = 0; r < t.length; r++)
    n += String.fromCharCode(t[r]);
  return btoa(n);
}
function ne(e) {
  if (!e) return new ArrayBuffer(0);
  const t = atob(e), n = t.length, r = new Uint8Array(n);
  for (let o = 0; o < n; o++)
    r[o] = t.charCodeAt(o);
  return r.buffer;
}
const Qt = {
  PING: async () => (console.log("[MessageRouter] PING message received. Sending PING response."), { ok: !0 }),
  PREPROCESS_IMAGE: async (e) => {
    if (!e || !e.arrayBuffer)
      throw new Error("Invalid payload: arrayBuffer is required");
    await xe();
    const { arrayBuffer: t, type: n, settings: r } = e, o = new Blob([t], { type: n || "image/png" }), a = await createImageBitmap(o), i = new OffscreenCanvas(a.width, a.height);
    i.getContext("2d", { willReadFrequently: !0 }).drawImage(a, 0, 0);
    const u = await Ce(i, r);
    return {
      arrayBuffer: await (await u.convertToBlob({ type: n || "image/png" })).arrayBuffer(),
      width: u.width,
      height: u.height
    };
  },
  RUN_PROTECT_PIPELINE: async (e) => {
    if (!e || !e.arrayBuffer && !e.base64Data && !e.storageKey)
      throw new Error("Invalid payload: base64Data or arrayBuffer is required");
    let t = e.arrayBuffer;
    if (e.base64Data)
      t = ne(e.base64Data);
    else if (e.storageKey) {
      const h = await chrome.storage.local.get(e.storageKey), m = h ? h[e.storageKey] : null;
      typeof m == "string" ? t = ne(m) : (m && m.byteLength || m && typeof m == "object") && (t = m), t && t.byteLength > 0 && await chrome.storage.local.remove(e.storageKey);
    }
    if (!t || !t.byteLength)
      throw new Error("Invalid or corrupted image arrayBuffer received in pipeline gateway");
    const n = "pending_image_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    await chrome.storage.local.set({ [n]: be(t) });
    const { name: r, type: o, settings: a } = e;
    await xe();
    const i = {
      name: r || "upload.png",
      size: t.byteLength,
      type: o || "image/png",
      arrayBuffer: () => Promise.resolve(t)
    }, s = await Jt(i, a);
    await chrome.storage.local.remove(n);
    let u;
    return s.protectedFile && typeof s.protectedFile.arrayBuffer == "function" ? u = await s.protectedFile.arrayBuffer() : u = t, {
      success: s.success !== !1,
      base64Data: be(u),
      name: s.protectedFile && s.protectedFile.name || r,
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
      t = ne(e.base64Data);
    else if (e.storageKey) {
      const a = await chrome.storage.local.get(e.storageKey), i = a ? a[e.storageKey] : null;
      typeof i == "string" ? t = ne(i) : i && i.byteLength && (t = i), t && await chrome.storage.local.remove(e.storageKey);
    }
    if (!t || !t.byteLength)
      throw new Error("Image data not found or corrupted in background session allocation room");
    const n = new Blob([t], { type: e.type || "image/png" }), r = new File([n], e.name || "upload.png", { type: e.type || "image/png" });
    return console.log("[MessageRouter] Dispatching isolated proxy upload process via BridgeClient framework..."), await re.uploadProtectedAsset(r, {
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
  GET_SETTINGS: async () => {
    const e = await chrome.storage.local.get("settings");
    return e ? e.settings || {} : {};
  },
  LOG_SCAN: async (e, t) => {
    if (!e || !e.scanId)
      throw new Error("Invalid scan log payload");
    let n;
    const r = new Promise((o) => {
      ve.then(() => o());
    });
    ve = new Promise((o) => {
      n = o;
    }), await r;
    try {
      const o = await chrome.storage.local.get("scans"), a = o && o.scans ? o.scans : [], i = [e, ...a].slice(0, 100);
      await chrome.storage.local.set({ scans: i });
      try {
        if (await re.syncScanResult({
          metadata: { name: e.fileName, size: e.size, type: "image/png" },
          ...e
        }), e.riskLevel !== "low" && e.assetId) {
          const s = t && (t.url || t.origin) || "unknown", u = await re.sendIncidentNotification({
            assetId: e.assetId,
            matchedUrl: s,
            matchConfidence: e.confidence,
            severity: e.riskLevel === "critical" ? "Serious" : "Normal",
            status: "Open"
          });
          if (u && u.success && u.incidentId) {
            e.incidentId = u.incidentId;
            const h = await chrome.storage.local.get("scans"), c = (h && h.scans ? h.scans : []).map((g) => g.scanId === e.scanId ? { ...g, incidentId: u.incidentId } : g);
            await chrome.storage.local.set({ scans: c }), console.log("[MessageRouter] Linked local scan record with backend incident ID:", u.incidentId);
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
async function xe() {
  if (!(typeof document > "u" && typeof chrome < "u" && chrome.offscreen) && !(typeof cv < "u" && cv.matFromImageData))
    return new Promise((e, t) => {
      let n = 0;
      const r = setInterval(() => {
        n++, typeof cv < "u" && cv.matFromImageData ? (clearInterval(r), e()) : n > 50 && (clearInterval(r), t(new Error("OpenCV.js WASM compilation timed out (5s)")));
      }, 100);
    });
}
async function er(e, t) {
  try {
    if (!e || typeof e != "object")
      return { success: !1, error: "Malformed message: Message must be an object" };
    const { type: n, payload: r } = e;
    if (!n || typeof n != "string")
      return { success: !1, error: "Malformed message: Missing type property" };
    console.log(`[MessageRouter] Routing message type: ${n}`, { senderId: t.id, origin: t.origin });
    const o = Qt[n];
    return o ? { success: !0, data: await o(r, t) } : (console.warn(`[MessageRouter] Unknown message type: ${n}`), { success: !1, error: `Unknown message type: '${n}'` });
  } catch (n) {
    return console.error("[MessageRouter] Error routing message:", n), {
      success: !1,
      error: n instanceof Error ? n.message : "Internal background processing error"
    };
  }
}
chrome.runtime.onInstalled.addListener(async (e) => {
  if (console.log(`[ServiceWorker] Extension installation event: ${e.reason}`), e.reason === "install")
    try {
      (await chrome.storage.local.get("settings")).settings || (await chrome.storage.local.set({
        settings: Re,
        scans: []
        // Initialize scan log history
      }), console.log("[ServiceWorker] Default settings storage initialized."));
    } catch (t) {
      console.error("[ServiceWorker] Error initializing storage settings:", t);
    }
  else e.reason === "update" && console.log("[ServiceWorker] SafeLens successfully updated to new version.");
});
chrome.runtime.onMessage.addListener((e, t, n) => {
  if (console.log("[ServiceWorker] Raw onMessage received:", e ? e.type : "unknown"), e && e.target === "offscreen")
    return !1;
  let r = !1;
  const o = (s) => {
    if (!r) {
      r = !0, a && clearInterval(a), i && clearTimeout(i);
      try {
        n(s);
      } catch (u) {
        console.error("[ServiceWorker] Failed to execute sendResponse (channel may be dead):", u);
      }
    }
  }, a = setInterval(() => {
    chrome.runtime && chrome.runtime.getPlatformInfo && chrome.runtime.getPlatformInfo();
  }, 2e4), i = setTimeout(() => {
    console.warn("[ServiceWorker] Message routing timed out (240s). Forcefully resolving channel."), o({ success: !1, error: "Background async processing timeout (240s)" });
  }, 24e4);
  try {
    er(e, t).then((s) => {
      if (s && s.success && s.payload) {
        const u = s.payload;
        console.log("===== RESULT FROM OFFSCREEN ====="), console.log(u), console.log(u.data), console.log(u.data?.constructor?.name), console.log(u.data?.byteLength), console.log(u.data?.length);
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
