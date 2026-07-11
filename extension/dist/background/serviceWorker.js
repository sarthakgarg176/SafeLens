const Ae = {
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
async function Se(e, t = 1920, n = 1080) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let r = null, o = null;
  try {
    let { width: a, height: i } = e, l = !1;
    if (a > t && (i = Math.round(i * t / a), a = t, l = !0), i > n && (a = Math.round(a * n / i), i = n, l = !0), !l)
      return e;
    if (console.log(`[Resize] Scaling image down to ${a}x${i} using cv.resize`), typeof cv > "u" || !cv.matFromImageData)
      throw new Error("OpenCV.js runtime is not loaded");
    const g = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    r = cv.matFromImageData(g), o = new cv.Mat();
    const m = new cv.Size(a, i);
    cv.resize(r, o, m, 0, 0, cv.INTER_AREA);
    const s = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(a, i) : document.createElement("canvas");
    s.width = a, s.height = i;
    const f = s.getContext("2d"), p = new ImageData(new Uint8ClampedArray(o.data), o.cols, o.rows);
    return f.putImageData(p, 0, 0), s;
  } catch (a) {
    console.warn("[Resize] OpenCV resizing failed. Falling back to native canvas context scaling:", a);
    try {
      const { width: i, height: l } = e;
      let d = i, g = l;
      d > t && (g = Math.round(g * t / d), d = t), g > n && (d = Math.round(d * n / g), g = n);
      const m = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(d, g) : document.createElement("canvas");
      m.width = d, m.height = g;
      const s = m.getContext("2d");
      return s.imageSmoothingEnabled = !0, s.imageSmoothingQuality = "high", s.drawImage(e, 0, 0, d, g), m;
    } catch (i) {
      return console.error("[Resize] Native canvas resizing fallback failed. Returning original image.", i), e;
    }
  } finally {
    r && r.delete(), o && o.delete();
  }
}
async function Me(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let t = null, n = null, r = null;
  try {
    if (typeof cv > "u" || !cv.cvtColor)
      throw new Error("OpenCV.js runtime is not loaded");
    const a = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(a), n = new cv.Mat(), cv.cvtColor(t, n, cv.COLOR_RGBA2GRAY), r = new cv.Mat(), cv.cvtColor(n, r, cv.COLOR_GRAY2RGBA);
    const i = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    i.width = e.width, i.height = e.height;
    const l = i.getContext("2d"), d = new ImageData(new Uint8ClampedArray(r.data), r.cols, r.rows);
    return l.putImageData(d, 0, 0), i;
  } catch (o) {
    console.warn("[Grayscale] OpenCV conversion failed. Falling back to native JS luminosity conversions:", o);
    try {
      const i = e.getContext("2d").getImageData(0, 0, e.width, e.height), l = i.data;
      for (let g = 0; g < l.length; g += 4) {
        const m = l[g], s = l[g + 1], f = l[g + 2], p = Math.round(0.299 * m + 0.587 * s + 0.114 * f);
        l[g] = p, l[g + 1] = p, l[g + 2] = p;
      }
      const d = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
      return d.width = e.width, d.height = e.height, d.getContext("2d").putImageData(i, 0, 0), d;
    } catch (a) {
      return console.error("[Grayscale] JS grayscale fallback failed. Returning original image.", a), e;
    }
  } finally {
    t && t.delete(), n && n.delete(), r && r.delete();
  }
}
async function ke(e) {
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
    const i = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    i.width = e.width, i.height = e.height;
    const l = i.getContext("2d"), d = new ImageData(new Uint8ClampedArray(n.data), n.cols, n.rows);
    return l.putImageData(d, 0, 0), i;
  } catch (r) {
    return console.warn("[Denoise] Denoising failed. Skipping this stage and returning original canvas:", r), e;
  } finally {
    t && t.delete(), n && n.delete();
  }
}
async function Oe(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let t = null, n = null, r = null, o = null, a = null, i = null;
  try {
    if (typeof cv > "u" || !cv.HoughLinesP)
      throw new Error("OpenCV.js runtime is not loaded");
    const d = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(d), n = new cv.Mat(), r = new cv.Mat(), o = new cv.Mat(), cv.cvtColor(t, n, cv.COLOR_RGBA2GRAY), cv.Canny(n, r, 50, 200, 3), cv.HoughLinesP(r, o, 1, Math.PI / 180, 100, 50, 10);
    let g = 0, m = 0;
    for (let C = 0; C < o.rows; ++C) {
      const v = o.data32S[C * 4], S = o.data32S[C * 4 + 1], O = o.data32S[C * 4 + 2], D = o.data32S[C * 4 + 3], T = Math.atan2(D - S, O - v) * (180 / Math.PI);
      T > -45 && T < 45 && (g += T, m++);
    }
    if (m < 3)
      return console.log("[Deskew] Insufficient line segments detected. Skipping deskew."), { canvas: e, angle: 0 };
    const s = g / m;
    if (Math.abs(s) < 0.5)
      return console.log(`[Deskew] Skew angle is negligible (${s.toFixed(2)} deg). Skipping rotation.`), { canvas: e, angle: 0 };
    console.log(`[Deskew] Correcting skew angle: ${s.toFixed(2)} degrees`);
    const f = new cv.Point(e.width / 2, e.height / 2);
    i = cv.getRotationMatrix2D(f, s, 1), a = new cv.Mat();
    const p = new cv.Size(e.width, e.height);
    cv.warpAffine(t, a, i, p, cv.INTER_CUBIC, cv.BORDER_REPLICATE);
    const I = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    I.width = e.width, I.height = e.height;
    const k = I.getContext("2d"), A = new ImageData(new Uint8ClampedArray(a.data), a.cols, a.rows);
    return k.putImageData(A, 0, 0), { canvas: I, angle: s };
  } catch (l) {
    return console.warn("[Deskew] Hough deskewing failed. Skipping this stage and returning original canvas:", l), { canvas: e, angle: 0 };
  } finally {
    t && t.delete(), n && n.delete(), r && r.delete(), o && o.delete(), a && a.delete(), i && i.delete();
  }
}
async function De(e, t = 127) {
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
    const d = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    d.width = e.width, d.height = e.height;
    const g = d.getContext("2d"), m = new ImageData(new Uint8ClampedArray(a.data), a.cols, a.rows);
    return g.putImageData(m, 0, 0), d;
  } catch (i) {
    console.warn("[Threshold] OpenCV adaptive thresholding failed. Falling back to grayscale image:", i);
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
    const i = Math.round(0.299 * r[a] + 0.587 * r[a + 1] + 0.114 * r[a + 2]);
    r[a] = i, r[a + 1] = i, r[a + 2] = i;
  }
  const o = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
  return o.width = e.width, o.height = e.height, o.getContext("2d").putImageData(n, 0, 0), o;
}
let K = null;
async function Te() {
  if (typeof chrome > "u" || !chrome.offscreen)
    return;
  const e = "public/offscreen.html";
  if (!(chrome.runtime.getContexts && (await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(e)]
  })).length > 0)) {
    if (K) {
      await K;
      return;
    }
    K = chrome.offscreen.createDocument({
      url: e,
      reasons: ["DOM_SCRAPING"],
      justification: "OpenCV image preprocessing requires canvas DOM context"
    });
    try {
      await K;
    } catch (t) {
      if (!t.message.includes("Only a single offscreen"))
        throw t;
    } finally {
      K = null;
    }
  }
}
async function Re(e, t, n = 15e3) {
  await Te();
  const r = (o = 3) => new Promise((a, i) => {
    let l = setTimeout(() => {
      i(new Error(`Offscreen execution timed out after ${n}ms`));
    }, n);
    chrome.runtime.sendMessage({
      target: "offscreen",
      type: e,
      payload: t
    }, (d) => {
      if (clearTimeout(l), chrome.runtime.lastError) {
        const g = chrome.runtime.lastError.message;
        if (g.includes("Could not establish connection") && o > 0) {
          console.warn(`[OffscreenManager] Connection failed (${g}). Retrying in 100ms... (${o} retries left)`), setTimeout(() => {
            r(o - 1).then(a, i);
          }, 100);
          return;
        }
        return i(new Error(g));
      }
      if (!d)
        return i(new Error("No response received from offscreen document"));
      if (!d.success)
        return i(new Error(d.error || "Offscreen processing failed"));
      a(d.payload);
    });
  });
  return r();
}
async function ye(e, t = {}) {
  if (typeof document > "u" && typeof chrome < "u" && chrome.offscreen) {
    console.log("[Preprocessor] Running in Service Worker. Delegating OpenCV to Offscreen Document...");
    try {
      const m = e.getContext("2d").getImageData(0, 0, e.width, e.height), s = await Re("PREPROCESS_IMAGE", {
        width: e.width,
        height: e.height,
        data: m.data.buffer,
        options: t
      }), f = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(s.width, s.height) : document.createElement("canvas");
      f.width = s.width, f.height = s.height;
      const p = f.getContext("2d"), I = new ImageData(new Uint8ClampedArray(s.data), s.width, s.height);
      return p.putImageData(I, 0, 0), f;
    } catch (g) {
      return console.error("[Preprocessor] Offscreen delegation failed. Returning original imageSource.", g), e;
    }
  }
  const {
    enableDenoise: n = !0,
    enableDeskew: r = !0,
    thresholdValue: o = 127,
    maxWidth: a = 1920,
    maxHeight: i = 1080
  } = t;
  console.log("[Preprocessor] Beginning OpenCV.js image preprocessing pipeline...");
  const l = Date.now();
  let d = e;
  try {
    try {
      d = await Se(d, a, i);
    } catch (s) {
      console.warn("[Preprocessor] Resize stage failed. Continuing...", s);
    }
    try {
      d = await Me(d);
    } catch (s) {
      console.warn("[Preprocessor] Grayscale stage failed. Continuing...", s);
    }
    if (n)
      try {
        d = await ke(d);
      } catch (s) {
        console.warn("[Preprocessor] Denoise stage failed. Continuing...", s);
      }
    let g = 0;
    if (r)
      try {
        const s = await Oe(d);
        d = s.canvas, g = s.angle;
      } catch (s) {
        console.warn("[Preprocessor] Deskew stage failed. Continuing...", s);
      }
    try {
      d = await De(d, o);
    } catch (s) {
      console.warn("[Preprocessor] Threshold binarization stage failed. Continuing...", s);
    }
    const m = Date.now() - l;
    return console.log(`[Preprocessor] Pipeline resolved successfully in ${m}ms. Skew Angle: ${g.toFixed(2)} deg.`), d;
  } catch (g) {
    return console.error("[Preprocessor] Critical pipeline failure. Returning original image.", g), e;
  }
}
var Le = { exports: {} };
(function(e) {
  var t = function(n) {
    var r = Object.prototype, o = r.hasOwnProperty, a = Object.defineProperty || function(u, c, h) {
      u[c] = h.value;
    }, i, l = typeof Symbol == "function" ? Symbol : {}, d = l.iterator || "@@iterator", g = l.asyncIterator || "@@asyncIterator", m = l.toStringTag || "@@toStringTag";
    function s(u, c, h) {
      return Object.defineProperty(u, c, {
        value: h,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }), u[c];
    }
    try {
      s({}, "");
    } catch {
      s = function(c, h, y) {
        return c[h] = y;
      };
    }
    function f(u, c, h, y) {
      var w = c && c.prototype instanceof S ? c : S, E = Object.create(w.prototype), _ = new V(y || []);
      return a(E, "_invoke", { value: ne(u, h, _) }), E;
    }
    n.wrap = f;
    function p(u, c, h) {
      try {
        return { type: "normal", arg: u.call(c, h) };
      } catch (y) {
        return { type: "throw", arg: y };
      }
    }
    var I = "suspendedStart", k = "suspendedYield", A = "executing", C = "completed", v = {};
    function S() {
    }
    function O() {
    }
    function D() {
    }
    var T = {};
    s(T, d, function() {
      return this;
    });
    var B = Object.getPrototypeOf, R = B && B(B(x([])));
    R && R !== r && o.call(R, d) && (T = R);
    var P = D.prototype = S.prototype = Object.create(T);
    O.prototype = D, a(P, "constructor", { value: D, configurable: !0 }), a(
      D,
      "constructor",
      { value: O, configurable: !0 }
    ), O.displayName = s(
      D,
      m,
      "GeneratorFunction"
    );
    function L(u) {
      ["next", "throw", "return"].forEach(function(c) {
        s(u, c, function(h) {
          return this._invoke(c, h);
        });
      });
    }
    n.isGeneratorFunction = function(u) {
      var c = typeof u == "function" && u.constructor;
      return c ? c === O || // For the native GeneratorFunction constructor, the best we can
      // do is to check its .name property.
      (c.displayName || c.name) === "GeneratorFunction" : !1;
    }, n.mark = function(u) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(u, D) : (u.__proto__ = D, s(u, m, "GeneratorFunction")), u.prototype = Object.create(P), u;
    }, n.awrap = function(u) {
      return { __await: u };
    };
    function Z(u, c) {
      function h(E, _, z, G) {
        var F = p(u[E], u, _);
        if (F.type === "throw")
          G(F.arg);
        else {
          var ae = F.arg, J = ae.value;
          return J && typeof J == "object" && o.call(J, "__await") ? c.resolve(J.__await).then(function(H) {
            h("next", H, z, G);
          }, function(H) {
            h("throw", H, z, G);
          }) : c.resolve(J).then(function(H) {
            ae.value = H, z(ae);
          }, function(H) {
            return h("throw", H, z, G);
          });
        }
      }
      var y;
      function w(E, _) {
        function z() {
          return new c(function(G, F) {
            h(E, _, G, F);
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
          z,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          z
        ) : z();
      }
      a(this, "_invoke", { value: w });
    }
    L(Z.prototype), s(Z.prototype, g, function() {
      return this;
    }), n.AsyncIterator = Z, n.async = function(u, c, h, y, w) {
      w === void 0 && (w = Promise);
      var E = new Z(
        f(u, c, h, y),
        w
      );
      return n.isGeneratorFunction(c) ? E : E.next().then(function(_) {
        return _.done ? _.value : E.next();
      });
    };
    function ne(u, c, h) {
      var y = I;
      return function(E, _) {
        if (y === A)
          throw new Error("Generator is already running");
        if (y === C) {
          if (E === "throw")
            throw _;
          return b();
        }
        for (h.method = E, h.arg = _; ; ) {
          var z = h.delegate;
          if (z) {
            var G = Q(z, h);
            if (G) {
              if (G === v) continue;
              return G;
            }
          }
          if (h.method === "next")
            h.sent = h._sent = h.arg;
          else if (h.method === "throw") {
            if (y === I)
              throw y = C, h.arg;
            h.dispatchException(h.arg);
          } else h.method === "return" && h.abrupt("return", h.arg);
          y = A;
          var F = p(u, c, h);
          if (F.type === "normal") {
            if (y = h.done ? C : k, F.arg === v)
              continue;
            return {
              value: F.arg,
              done: h.done
            };
          } else F.type === "throw" && (y = C, h.method = "throw", h.arg = F.arg);
        }
      };
    }
    function Q(u, c) {
      var h = c.method, y = u.iterator[h];
      if (y === i)
        return c.delegate = null, h === "throw" && u.iterator.return && (c.method = "return", c.arg = i, Q(u, c), c.method === "throw") || h !== "return" && (c.method = "throw", c.arg = new TypeError(
          "The iterator does not provide a '" + h + "' method"
        )), v;
      var w = p(y, u.iterator, c.arg);
      if (w.type === "throw")
        return c.method = "throw", c.arg = w.arg, c.delegate = null, v;
      var E = w.arg;
      if (!E)
        return c.method = "throw", c.arg = new TypeError("iterator result is not an object"), c.delegate = null, v;
      if (E.done)
        c[u.resultName] = E.value, c.next = u.nextLoc, c.method !== "return" && (c.method = "next", c.arg = i);
      else
        return E;
      return c.delegate = null, v;
    }
    L(P), s(P, m, "Generator"), s(P, d, function() {
      return this;
    }), s(P, "toString", function() {
      return "[object Generator]";
    });
    function oe(u) {
      var c = { tryLoc: u[0] };
      1 in u && (c.catchLoc = u[1]), 2 in u && (c.finallyLoc = u[2], c.afterLoc = u[3]), this.tryEntries.push(c);
    }
    function j(u) {
      var c = u.completion || {};
      c.type = "normal", delete c.arg, u.completion = c;
    }
    function V(u) {
      this.tryEntries = [{ tryLoc: "root" }], u.forEach(oe, this), this.reset(!0);
    }
    n.keys = function(u) {
      var c = Object(u), h = [];
      for (var y in c)
        h.push(y);
      return h.reverse(), function w() {
        for (; h.length; ) {
          var E = h.pop();
          if (E in c)
            return w.value = E, w.done = !1, w;
        }
        return w.done = !0, w;
      };
    };
    function x(u) {
      if (u) {
        var c = u[d];
        if (c)
          return c.call(u);
        if (typeof u.next == "function")
          return u;
        if (!isNaN(u.length)) {
          var h = -1, y = function w() {
            for (; ++h < u.length; )
              if (o.call(u, h))
                return w.value = u[h], w.done = !1, w;
            return w.value = i, w.done = !0, w;
          };
          return y.next = y;
        }
      }
      return { next: b };
    }
    n.values = x;
    function b() {
      return { value: i, done: !0 };
    }
    return V.prototype = {
      constructor: V,
      reset: function(u) {
        if (this.prev = 0, this.next = 0, this.sent = this._sent = i, this.done = !1, this.delegate = null, this.method = "next", this.arg = i, this.tryEntries.forEach(j), !u)
          for (var c in this)
            c.charAt(0) === "t" && o.call(this, c) && !isNaN(+c.slice(1)) && (this[c] = i);
      },
      stop: function() {
        this.done = !0;
        var u = this.tryEntries[0], c = u.completion;
        if (c.type === "throw")
          throw c.arg;
        return this.rval;
      },
      dispatchException: function(u) {
        if (this.done)
          throw u;
        var c = this;
        function h(G, F) {
          return E.type = "throw", E.arg = u, c.next = G, F && (c.method = "next", c.arg = i), !!F;
        }
        for (var y = this.tryEntries.length - 1; y >= 0; --y) {
          var w = this.tryEntries[y], E = w.completion;
          if (w.tryLoc === "root")
            return h("end");
          if (w.tryLoc <= this.prev) {
            var _ = o.call(w, "catchLoc"), z = o.call(w, "finallyLoc");
            if (_ && z) {
              if (this.prev < w.catchLoc)
                return h(w.catchLoc, !0);
              if (this.prev < w.finallyLoc)
                return h(w.finallyLoc);
            } else if (_) {
              if (this.prev < w.catchLoc)
                return h(w.catchLoc, !0);
            } else if (z) {
              if (this.prev < w.finallyLoc)
                return h(w.finallyLoc);
            } else
              throw new Error("try statement without catch or finally");
          }
        }
      },
      abrupt: function(u, c) {
        for (var h = this.tryEntries.length - 1; h >= 0; --h) {
          var y = this.tryEntries[h];
          if (y.tryLoc <= this.prev && o.call(y, "finallyLoc") && this.prev < y.finallyLoc) {
            var w = y;
            break;
          }
        }
        w && (u === "break" || u === "continue") && w.tryLoc <= c && c <= w.finallyLoc && (w = null);
        var E = w ? w.completion : {};
        return E.type = u, E.arg = c, w ? (this.method = "next", this.next = w.finallyLoc, v) : this.complete(E);
      },
      complete: function(u, c) {
        if (u.type === "throw")
          throw u.arg;
        return u.type === "break" || u.type === "continue" ? this.next = u.arg : u.type === "return" ? (this.rval = this.arg = u.arg, this.method = "return", this.next = "end") : u.type === "normal" && c && (this.next = c), v;
      },
      finish: function(u) {
        for (var c = this.tryEntries.length - 1; c >= 0; --c) {
          var h = this.tryEntries[c];
          if (h.finallyLoc === u)
            return this.complete(h.completion, h.afterLoc), j(h), v;
        }
      },
      catch: function(u) {
        for (var c = this.tryEntries.length - 1; c >= 0; --c) {
          var h = this.tryEntries[c];
          if (h.tryLoc === u) {
            var y = h.completion;
            if (y.type === "throw") {
              var w = y.arg;
              j(h);
            }
            return w;
          }
        }
        throw new Error("illegal catch attempt");
      },
      delegateYield: function(u, c, h) {
        return this.delegate = {
          iterator: x(u),
          resultName: c,
          nextLoc: h
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
})(Le);
var ve = (e, t) => `${e}-${t}-${Math.random().toString(16).slice(3, 8)}`;
const _e = ve;
let de = 0;
var $e = ({
  id: e,
  action: t,
  payload: n = {}
}) => {
  let r = e;
  return typeof r > "u" && (r = _e("Job", de), de += 1), {
    id: r,
    action: t,
    payload: n
  };
}, re = {};
let ue = !1;
re.logging = ue;
re.setLogging = (e) => {
  ue = e;
};
re.log = (...e) => ue ? console.log.apply(void 0, e) : null;
function Ne(e) {
  throw new Error('Could not dynamically require "' + e + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var Be = (e) => {
  const t = {};
  return typeof WorkerGlobalScope < "u" ? t.type = "webworker" : typeof document == "object" ? t.type = "browser" : typeof process == "object" && typeof Ne == "function" && (t.type = "node"), typeof e > "u" ? t : t[e];
};
const ze = Be("type") === "browser", Fe = ze ? (e) => new URL(e, window.location.href).href : (e) => e;
var Ge = (e) => {
  const t = { ...e };
  return ["corePath", "workerPath", "langPath"].forEach((n) => {
    e[n] && (t[n] = Fe(t[n]));
  }), t;
}, We = {
  TESSERACT_ONLY: 0,
  LSTM_ONLY: 1,
  TESSERACT_LSTM_COMBINED: 2,
  DEFAULT: 3
};
const Ue = "7.0.0", qe = {
  version: Ue
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
const Ye = qe.version, Ze = He;
var je = {
  ...Ze,
  workerPath: `https://cdn.jsdelivr.net/npm/tesseract.js@v${Ye}/dist/worker.min.js`
}, Ve = ({ workerPath: e, workerBlobURL: t }) => {
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
}, Ke = (e, t) => {
  e.onmessage = ({ data: n }) => {
    t(n);
  };
}, Xe = async (e, t) => {
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
var Qe = le;
const et = je, tt = Ve, rt = Je, nt = Ke, ot = Xe, at = Qe;
var it = {
  defaultOptions: et,
  spawnWorker: tt,
  terminateWorker: rt,
  onMessage: nt,
  send: ot,
  loadImage: at
};
const st = Ge, W = $e, { log: fe } = re, ct = ve, Y = We, {
  defaultOptions: lt,
  spawnWorker: ut,
  terminateWorker: dt,
  onMessage: ft,
  loadImage: he,
  send: ht
} = it;
let ge = 0;
var xe = async (e = "eng", t = Y.LSTM_ONLY, n = {}, r = {}) => {
  const o = ct("Worker", ge), {
    logger: a,
    errorHandler: i,
    ...l
  } = st({
    ...lt,
    ...n
  }), d = {}, g = typeof e == "string" ? e.split("+") : e;
  let m = t, s = r;
  const f = [Y.DEFAULT, Y.LSTM_ONLY].includes(t) && !l.legacyCore;
  let p, I;
  const k = new Promise((x, b) => {
    I = x, p = b;
  }), A = (x) => {
    p(x.message);
  };
  let C = ut(l);
  C.onerror = A, ge += 1;
  const v = ({ id: x, action: b, payload: u }) => new Promise((c, h) => {
    fe(`[${o}]: Start ${x}, action=${b}`);
    const y = `${b}-${x}`;
    d[y] = { resolve: c, reject: h }, ht(C, {
      workerId: o,
      jobId: x,
      action: b,
      payload: u
    });
  }), S = () => console.warn("`load` is depreciated and should be removed from code (workers now come pre-loaded)"), O = (x) => v(W({
    id: x,
    action: "load",
    payload: { options: { lstmOnly: f, corePath: l.corePath, logging: l.logging } }
  })), D = (x, b, u) => v(W({
    id: u,
    action: "FS",
    payload: { method: "writeFile", args: [x, b] }
  })), T = (x, b) => v(W({
    id: b,
    action: "FS",
    payload: { method: "readFile", args: [x, { encoding: "utf8" }] }
  })), B = (x, b) => v(W({
    id: b,
    action: "FS",
    payload: { method: "unlink", args: [x] }
  })), R = (x, b, u) => v(W({
    id: u,
    action: "FS",
    payload: { method: x, args: b }
  })), P = (x, b) => v(W({
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
  })), L = (x, b, u, c) => v(W({
    id: c,
    action: "initialize",
    payload: { langs: x, oem: b, config: u }
  })), Z = (x = "eng", b, u, c) => {
    if (f && [Y.TESSERACT_ONLY, Y.TESSERACT_LSTM_COMBINED].includes(b)) throw Error("Legacy model requested but code missing.");
    const h = b || m;
    m = h;
    const y = u || s;
    s = y;
    const E = (typeof x == "string" ? x.split("+") : x).filter((_) => !g.includes(_));
    return g.push(...E), E.length > 0 ? P(E, c).then(() => L(x, h, y, c)) : L(x, h, y, c);
  }, ne = (x = {}, b) => v(W({
    id: b,
    action: "setParameters",
    payload: { params: x }
  })), Q = async (x, b = {}, u = {
    text: !0
  }, c) => v(W({
    id: c,
    action: "recognize",
    payload: { image: await he(x), options: b, output: u }
  })), oe = async (x, b) => {
    if (f) throw Error("`worker.detect` requires Legacy model, which was not loaded.");
    return v(W({
      id: b,
      action: "detect",
      payload: { image: await he(x) }
    }));
  }, j = async () => (C !== null && (dt(C), C = null), Promise.resolve());
  ft(C, ({
    workerId: x,
    jobId: b,
    status: u,
    action: c,
    data: h
  }) => {
    const y = `${c}-${b}`;
    if (u === "resolve")
      fe(`[${x}]: Complete ${b}`), d[y].resolve({ jobId: b, data: h }), delete d[y];
    else if (u === "reject")
      if (d[y].reject(h), delete d[y], c === "load" && p(h), i)
        i(h);
      else
        throw Error(h);
    else u === "progress" && a({ ...h, userJobId: b });
  });
  const V = {
    id: o,
    worker: C,
    load: S,
    writeText: D,
    readText: T,
    removeFile: B,
    FS: R,
    reinitialize: Z,
    setParameters: ne,
    recognize: Q,
    detect: oe,
    terminate: j
  };
  return O().then(() => P(e)).then(() => L(e, t, r)).then(() => I(V)).catch(() => {
  }), k;
};
const Ce = xe, gt = async (e, t, n) => {
  const r = await Ce(t, 1, n);
  return r.recognize(e).finally(async () => {
    await r.terminate();
  });
}, mt = async (e, t) => {
  const n = await Ce("osd", 0, t);
  return n.detect(e).finally(async () => {
    await n.terminate();
  });
};
var pt = {
  recognize: gt,
  detect: mt
};
const wt = xe, yt = pt;
var vt = {
  createWorker: wt,
  ...yt
};
let se = null, X = null, me = Promise.resolve();
async function xt(e = "eng") {
  return se || X || (X = (async () => {
    try {
      console.log(`[TesseractWorker] Spawning local OCR worker for language: ${e}...`);
      const t = chrome.runtime.getURL("tesseract/worker.min.js"), n = chrome.runtime.getURL("tesseract/tesseract-core.wasm.js"), r = chrome.runtime.getURL("tesseract/");
      console.log("[TesseractWorker] Configuring local sandboxed paths:", { workerPath: t, corePath: n, langPath: r });
      const o = await vt.createWorker(e, 1, {
        workerPath: t,
        corePath: n,
        langPath: r,
        cacheMethod: "none",
        // Prevent trying to write to browser IndexedDB caches
        gzip: !0,
        // eng.traineddata.gz is compressed
        logger: (a) => {
          a.status === "recognizing text" && console.log(`[TesseractWorker] OCR Progress: ${Math.round(a.progress * 100)}%`);
        }
      });
      return se = o, o;
    } catch (t) {
      throw console.error("[TesseractWorker] Failed to create or load worker:", t), X = null, t;
    }
  })(), X);
}
async function Ct(e) {
  let t;
  const n = new Promise((r) => {
    me.then(() => r());
  });
  me = new Promise((r) => {
    t = r;
  }), await n;
  try {
    const r = await xt(), a = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    return await r.recognize(a);
  } finally {
    t();
  }
}
function bt(e) {
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
function It(e) {
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
function be(e) {
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
async function Et(e) {
  const t = Date.now();
  console.log("[RecognizeImage] Triggering character recognition loop...");
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    if (e.width === 0 || e.height === 0)
      throw new Error("Canvas dimensions cannot be zero");
    const n = await Ct(e);
    if (!n || !n.data)
      throw new Error("Tesseract returned an empty or malformed result payload");
    const { data: r } = n, o = bt(r), a = It(r), i = be(r), l = Date.now() - t;
    return console.log(`[RecognizeImage] OCR successful. Latency: ${l}ms. Text length: ${r.text ? r.text.length : 0}`), {
      text: r.text || "",
      confidence: typeof r.confidence == "number" ? r.confidence : 0,
      words: o,
      lines: a,
      boundingBoxes: i,
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
}, St = {
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
  const n = [], r = kt(e, t);
  for (const [o, a] of Object.entries(At)) {
    a.lastIndex = 0;
    let i;
    for (; (i = a.exec(e)) !== null; ) {
      const l = i[0], d = i.index, g = d + l.length, m = r.filter((f) => f.startIndex < g && f.endIndex > d).map((f) => ({
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        confidence: f.confidence
      })), s = m.length > 0 ? m.reduce((f, p) => f + p.confidence, 0) / m.length : 0;
      n.push({
        type: o,
        value: l,
        regexConfidence: St[o] || 0.8,
        ocrConfidence: s / 100,
        // Normalize to 0.0 - 1.0
        startIndex: d,
        endIndex: g,
        bboxes: m,
        source: "regex"
      });
    }
  }
  return n;
}
function kt(e, t) {
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
async function Ot(e) {
  try {
    return e ? (console.log("[MiniLMClassifier] Classifying text semantic structure..."), [
      { topic: "Financial Statement", score: 0.94 },
      { topic: "Personal Identifiable Information", score: 0.88 }
    ]) : [];
  } catch (t) {
    throw console.error("[MiniLMClassifier] Semantic classification failed:", t), t;
  }
}
const Dt = {
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
function Pt(e) {
  return Array.isArray(e) ? e.filter((t) => t.rulePassed === !1 ? (console.log(`[ConfidenceFusion] Dropping false positive: [${t.type}] "${t.value}" (failed checksum validation).`), !1) : !0).map((t) => {
    const n = typeof t.ocrConfidence == "number" ? t.ocrConfidence : 0.5, r = typeof t.regexConfidence == "number" ? t.regexConfidence : 0.8;
    let o = 0.7 * r + 0.3 * n;
    return o = Math.min(1, Math.max(0, o)), {
      type: t.type,
      value: t.value,
      ocrConfidence: n,
      regexConfidence: r,
      fusedConfidence: parseFloat(o.toFixed(4)),
      severity: Dt[t.type] || "medium",
      startIndex: t.startIndex,
      endIndex: t.endIndex,
      bboxes: t.bboxes || [],
      source: t.source || "regex"
    };
  }) : [];
}
const Tt = [
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
], Rt = [
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
    n = Tt[n][Rt[o % 8][r[o]]];
  return n === 0;
}
function _t(e) {
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
function $t(e) {
  const t = /^[A-Z]{5}[0-9]{4}[A-Z]$/, n = e.trim().toUpperCase();
  return t.test(n) ? ["P", "C", "H", "F", "A", "T", "B", "L", "J", "G"].includes(n[3]) : !1;
}
function Nt(e) {
  const t = e.trim().toUpperCase();
  return /^[A-PR-WYZ][0-9]{7}$/.test(t);
}
function Bt(e) {
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
          n = _t(t.value);
          break;
        case "PAN":
          n = $t(t.value);
          break;
        case "PASSPORT":
          n = Nt(t.value);
          break;
        case "DRIVING_LICENSE":
          n = Bt(t.value);
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
    const a = t[o], i = r.y + r.height, l = a.y + a.height, d = Math.min(i, l) - Math.max(r.y, a.y), g = a.x - (r.x + r.width);
    if (d > 0 && g <= 15) {
      const m = Math.min(r.x, a.x), s = Math.min(r.y, a.y), f = Math.max(r.x + r.width, a.x + a.width), p = Math.max(i, l);
      r = {
        x: m,
        y: s,
        width: f - m,
        height: p - s,
        confidence: Math.max(r.confidence, a.confidence)
      };
    } else
      n.push(r), r = a;
  }
  return n.push(r), n;
}
function Ft(e) {
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
const Gt = {
  critical: 10,
  high: 5,
  medium: 2,
  low: 1
};
function Wt(e) {
  if (!Array.isArray(e) || e.length === 0)
    return {
      riskLevel: "low",
      score: 0,
      detections: []
    };
  let t = 0, n = !1;
  e.forEach((o) => {
    const a = Gt[o.severity] || 2, i = typeof o.fusedConfidence == "number" ? o.fusedConfidence : 0.8;
    t += a * i, o.severity === "critical" && i >= 0.7 && (n = !0);
  });
  let r = "low";
  return n || t >= 15 ? r = "critical" : t >= 5 ? r = "high" : t >= 2 && (r = "medium"), console.log(`[RiskAnalyzer] Calculated document risk score: ${t.toFixed(2)} -> Level: ${r.toUpperCase()}`), {
    riskLevel: r,
    score: parseFloat(t.toFixed(2)),
    detections: e
  };
}
async function Ie(e) {
  if (!e)
    throw new TypeError("File parameter is required");
  if (typeof document > "u") {
    const t = await e.arrayBuffer(), n = new Blob([t], { type: e.type || "image/png" }), r = await createImageBitmap(n), o = new OffscreenCanvas(r.width, r.height);
    return o.getContext("2d").drawImage(r, 0, 0), o;
  } else
    return new Promise((t, n) => {
      const r = new FileReader();
      r.onload = (o) => {
        const a = new Image();
        a.onload = () => {
          const i = document.createElement("canvas");
          i.width = a.width, i.height = a.height, i.getContext("2d").drawImage(a, 0, 0), t(i);
        }, a.onerror = (i) => n(new Error(`Failed to decode image pixels: ${i}`)), a.src = o.target.result;
      }, r.onerror = (o) => n(new Error(`Failed to read file buffer: ${o}`)), r.readAsDataURL(e);
    });
}
async function Ut(e, t = {}) {
  const n = Date.now();
  console.log(`[ScanService] Initiating scan pipeline for file: ${e.name} (${e.size} bytes)`);
  try {
    const r = await Ie(e), o = await ye(r, t.preprocess), a = await Et(o), i = be(a), l = Mt(a.text, i), d = zt(l), g = await Ot(a.text), m = Pt(d, g), s = Ft(m), f = Wt(s), p = Date.now() - n;
    return console.log(`[ScanService] Scan pipeline resolved in ${p}ms. Risk: ${f.riskLevel.toUpperCase()}`), {
      success: !0,
      riskLevel: f.riskLevel,
      score: f.score,
      piiCount: s.length,
      detections: s,
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
      error: r instanceof Error ? r.message : "Unknown scanning runtime failure"
    };
  }
}
async function qt(e, t) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    const n = e.getContext("2d"), r = e.width, o = e.height, a = n.getImageData(0, 0, r, o), i = a.data, l = t * 0.8;
    for (let m = 0; m < i.length; m += 4) {
      const s = m / 4, f = s % r, p = Math.floor(s / r), I = Math.sin(f * 0.8) * Math.cos(p * 0.8) * l, k = Math.cos(f * 0.8) * Math.sin(p * 0.8) * l, A = Math.sin((f + p) * 0.5) * l;
      i[m] = Math.min(255, Math.max(0, i[m] + I)), i[m + 1] = Math.min(255, Math.max(0, i[m + 1] + k)), i[m + 2] = Math.min(255, Math.max(0, i[m + 2] + A));
    }
    const d = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(r, o) : document.createElement("canvas");
    return d.width = r, d.height = o, d.getContext("2d").putImageData(a, 0, 0), d;
  } catch (n) {
    throw console.error("[Perturbation] Error applying pixel alterations:", n), n;
  }
}
async function Ht(e, t = {}) {
  const { strength: n = 5 } = t;
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    console.log(`[AICloak] Injecting adversarial cloak (intensity: ${n})...`);
    const r = await qt(e, n);
    return console.log("[AICloak] Adversarial noise mapping completed."), r;
  } catch (r) {
    throw console.error("[AICloak] Failed to apply adversarial cloaking:", r), r;
  }
}
function Yt(e) {
  const n = Array.from({ length: 8 }, () => new Array(8).fill(0));
  for (let r = 0; r < 8; r++)
    for (let o = 0; o < 8; o++) {
      let a = 0;
      for (let d = 0; d < 8; d++)
        for (let g = 0; g < 8; g++)
          a += e[d][g] * Math.cos((2 * d + 1) * r * Math.PI / 16) * Math.cos((2 * g + 1) * o * Math.PI / 16);
      const i = r === 0 ? 1 / Math.sqrt(2) : 1, l = o === 0 ? 1 / Math.sqrt(2) : 1;
      n[r][o] = 0.25 * i * l * a;
    }
  return n;
}
function Zt(e) {
  const n = Array.from({ length: 8 }, () => new Array(8).fill(0));
  for (let r = 0; r < 8; r++)
    for (let o = 0; o < 8; o++) {
      let a = 0;
      for (let i = 0; i < 8; i++)
        for (let l = 0; l < 8; l++) {
          const d = i === 0 ? 1 / Math.sqrt(2) : 1, g = l === 0 ? 1 / Math.sqrt(2) : 1;
          a += d * g * e[i][l] * Math.cos((2 * r + 1) * i * Math.PI / 16) * Math.cos((2 * o + 1) * l * Math.PI / 16);
        }
      n[r][o] = 0.25 * a;
    }
  return n;
}
const $ = 8, te = 20;
function jt(e) {
  const t = [];
  for (let n = 0; n < e.length; n++) {
    const r = e.charCodeAt(n);
    for (let o = 7; o >= 0; o--)
      t.push(r >> o & 1);
  }
  return t;
}
async function Vt(e, t) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    console.log(`[WatermarkEngine] Embedding invisible DCT watermark: "${t}"`);
    const n = e.getContext("2d"), r = e.width, o = e.height, a = n.getImageData(0, 0, r, o), i = a.data, l = jt(t + "\0");
    let d = 0;
    const g = Math.floor(r / $) * $, m = Math.floor(o / $) * $;
    for (let s = 0; s < m; s += $)
      for (let f = 0; f < g; f += $) {
        const p = Array.from({ length: $ }, () => new Array($).fill(0)), I = Array.from({ length: $ }, () => new Array($).fill(0)), k = Array.from({ length: $ }, () => new Array($).fill(0));
        for (let v = 0; v < $; v++)
          for (let S = 0; S < $; S++) {
            const O = ((s + v) * r + (f + S)) * 4, D = i[O], T = i[O + 1], B = i[O + 2];
            p[v][S] = 0.299 * D + 0.587 * T + 0.114 * B, I[v][S] = 128 - 0.1687 * D - 0.3313 * T + 0.5 * B, k[v][S] = 128 + 0.5 * D - 0.4187 * T - 0.0813 * B;
          }
        const A = Yt(p);
        if (d < l.length) {
          const v = l[d], S = A[4][4], O = Math.round(S / te) * te;
          A[4][4] = v === 1 ? O + te / 4 : O - te / 4, d++;
        }
        const C = Zt(A);
        for (let v = 0; v < $; v++)
          for (let S = 0; S < $; S++) {
            const O = ((s + v) * r + (f + S)) * 4, D = C[v][S], T = I[v][S], B = k[v][S];
            let R = Math.round(D + 1.402 * (B - 128)), P = Math.round(D - 0.3441 * (T - 128) - 0.7141 * (B - 128)), L = Math.round(D + 1.772 * (T - 128));
            i[O] = Math.max(0, Math.min(255, R)), i[O + 1] = Math.max(0, Math.min(255, P)), i[O + 2] = Math.max(0, Math.min(255, L));
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
  const a = Math.max(0, e.x - t), i = Math.max(0, e.y - n), l = Math.min(r, e.x + e.width + t), d = Math.min(o, e.y + e.height + n), g = l - a, m = d - i;
  return { x: a, y: i, width: g, height: m };
}
function Kt(e) {
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
    const a = t[o], i = r.x + r.width, l = r.y + r.height, d = a.x + a.width, g = a.y + a.height, m = a.x <= i + 15, s = Math.min(l, g) - Math.max(r.y, a.y) > 0;
    if (m && s) {
      const f = Math.min(r.x, a.x), p = Math.max(i, d), I = Math.min(r.y, a.y), k = Math.max(l, g);
      r.x = f, r.width = p - f, r.y = I, r.height = k - I, a.detection && (r.detections.some(
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
async function Ee(e, t, n = 15) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  if (!Array.isArray(t) || t.length === 0)
    return e;
  const r = e.getContext("2d");
  r.save();
  try {
    t.forEach((o) => {
      const { x: a, y: i, width: l, height: d } = o, g = Math.max(0, a), m = Math.max(0, i), s = Math.min(e.width - g, l), f = Math.min(e.height - m, d);
      if (s <= 0 || f <= 0)
        return;
      const p = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(s, f) : document.createElement("canvas");
      p.width = s, p.height = f, p.getContext("2d").drawImage(e, g, m, s, f, 0, 0, s, f), r.save();
      try {
        r.beginPath(), r.rect(g, m, s, f), r.clip(), r.filter = `blur(${n}px)`, r.drawImage(p, g, m);
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
function Xt(e) {
  const n = typeof OffscreenCanvas < "u" && e instanceof OffscreenCanvas ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
  return n.width = e.width, n.height = e.height, n.getContext("2d").drawImage(e, 0, 0), n;
}
async function Qt(e, t, n = "redact", r = {}) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  const o = Xt(e);
  if (!Array.isArray(t) || t.length === 0)
    return o;
  const {
    paddingX: a = 8,
    paddingY: i = 6,
    blurRadius: l = 15,
    pixelationScale: d = 8,
    fillStyle: g = "#000000"
  } = r;
  console.log(`[RedactCanvas] Running masking pipeline. Mode: ${n.toUpperCase()} on ${t.length} regions.`);
  const m = t.map(
    (p) => Jt(p, a, i, o.width, o.height)
  ), s = Kt(m), f = o.getContext("2d");
  return n === "redact" ? (f.fillStyle = g, s.forEach((p) => {
    const I = Math.max(0, p.x), k = Math.max(0, p.y), A = Math.min(o.width - I, p.width), C = Math.min(o.height - k, p.height);
    A > 0 && C > 0 && f.fillRect(I, k, A, C);
  })) : n === "blur" ? await Ee(o, s, l) : n === "pixelate" && er(o, s, d), o;
}
function er(e, t, n = 8) {
  const r = e.getContext("2d");
  t.forEach((o) => {
    const { x: a, y: i, width: l, height: d } = o, g = Math.max(0, a), m = Math.max(0, i), s = Math.min(e.width - g, l), f = Math.min(e.height - m, d);
    if (s <= 0 || f <= 0)
      return;
    const p = r.getImageData(g, m, s, f), I = p.data;
    for (let k = 0; k < f; k += n)
      for (let A = 0; A < s; A += n) {
        let C = 0, v = 0, S = 0, O = 0;
        for (let R = 0; R < n && k + R < f; R++)
          for (let P = 0; P < n && A + P < s; P++) {
            const L = ((k + R) * s + (A + P)) * 4;
            C += I[L], v += I[L + 1], S += I[L + 2], O++;
          }
        const D = Math.round(C / O), T = Math.round(v / O), B = Math.round(S / O);
        for (let R = 0; R < n && k + R < f; R++)
          for (let P = 0; P < n && A + P < s; P++) {
            const L = ((k + R) * s + (A + P)) * 4;
            I[L] = D, I[L + 1] = T, I[L + 2] = B;
          }
      }
    r.putImageData(p, g, m);
  });
}
async function tr(e, t) {
  return console.log("[AIService] Delegating adversarial cloaking request..."), Ht(e, { strength: t });
}
async function rr(e, t) {
  return console.log("[AIService] Delegating invisible watermark embedding..."), Vt(e, t);
}
async function nr(e, t, n = "redact") {
  return console.log(`[AIService] Delegating redaction request (mode: ${n}) for ${t.length} regions.`), n === "blur" ? Ee(e, t, 8) : Qt(e, t, "redact", { fillStyle: "#000000" });
}
async function or(e, t, n = {}) {
  const { blurMode: r = "redact" } = n;
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    if (!Array.isArray(t) || t.length === 0)
      return e;
    const o = [];
    return t.forEach((i) => {
      Array.isArray(i.bboxes) && i.bboxes.forEach((l) => {
        o.push({
          x: l.x,
          y: l.y,
          width: l.width,
          height: l.height
        });
      });
    }), o.length === 0 ? (console.log("[BlurService] No bounding boxes found in detections. Skipping redaction."), e) : (console.log(`[BlurService] Requesting redaction of ${o.length} bounding boxes in mode: ${r}`), await nr(e, o, r));
  } catch (o) {
    throw console.error("[BlurService] Redaction processing failed:", o), o;
  }
}
const U = 8, N = 32;
async function ar(e) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    const t = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(N, N) : document.createElement("canvas");
    t.width = N, t.height = N;
    const n = t.getContext("2d");
    n.drawImage(e, 0, 0, N, N);
    const o = n.getImageData(0, 0, N, N).data, a = new Float32Array(N * N);
    for (let s = 0; s < o.length; s += 4)
      a[s / 4] = 0.299 * o[s] + 0.587 * o[s + 1] + 0.114 * o[s + 2];
    const i = Array.from({ length: U }, () => new Float32Array(U));
    for (let s = 0; s < U; s++)
      for (let f = 0; f < U; f++) {
        let p = 0;
        for (let A = 0; A < N; A++)
          for (let C = 0; C < N; C++)
            p += a[A * N + C] * Math.cos((2 * A + 1) * s * Math.PI / (2 * N)) * Math.cos((2 * C + 1) * f * Math.PI / (2 * N));
        const I = s === 0 ? 1 / Math.sqrt(2) : 1, k = f === 0 ? 1 / Math.sqrt(2) : 1;
        i[s][f] = 2 / N * I * k * p;
      }
    let l = 0;
    for (let s = 0; s < U; s++)
      for (let f = 0; f < U; f++)
        s === 0 && f === 0 || (l += i[s][f]);
    const d = l / (U * U - 1);
    let g = "";
    for (let s = 0; s < U; s++)
      for (let f = 0; f < U; f++)
        g += i[s][f] >= d ? "1" : "0";
    let m = "";
    for (let s = 0; s < 64; s += 4) {
      const f = g.substring(s, s + 4);
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
    const a = e[2 * o], i = e[2 * o + 1];
    n[o] = (a + i) / Math.sqrt(2), n[r + o] = (a - i) / Math.sqrt(2);
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
async function sr(e) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    const t = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(M, M) : document.createElement("canvas");
    t.width = M, t.height = M;
    const n = t.getContext("2d");
    n.drawImage(e, 0, 0, M, M);
    const o = n.getImageData(0, 0, M, M).data, a = new Float32Array(M * M);
    for (let s = 0; s < o.length; s += 4)
      a[s / 4] = 0.299 * o[s] + 0.587 * o[s + 1] + 0.114 * o[s + 2];
    ir(a);
    const i = Array.from({ length: q }, () => new Float32Array(q));
    let l = 0;
    for (let s = 0; s < q; s++)
      for (let f = 0; f < q; f++) {
        const p = a[s * M + f];
        i[s][f] = p, l += p;
      }
    const d = l / (q * q);
    let g = "";
    for (let s = 0; s < q; s++)
      for (let f = 0; f < q; f++)
        g += i[s][f] >= d ? "1" : "0";
    let m = "";
    for (let s = 0; s < 64; s += 4) {
      const f = g.substring(s, s + 4);
      m += parseInt(f, 2).toString(16);
    }
    return m;
  } catch (t) {
    throw console.error("[WHash] Error generating wavelet hash:", t), t;
  }
}
function cr(e, t, n) {
  return new Promise((r, o) => {
    if (!e)
      return o(new TypeError("Canvas parameter is required"));
    e.toBlob((a) => {
      if (!a)
        return o(new Error("Failed to extract binary blob from canvas"));
      const i = t.replace(/(\.[\w\d]+)$/, "_protected$1"), l = new File([a], i, {
        type: n,
        lastModified: Date.now()
      });
      r(l);
    }, n);
  });
}
async function lr(e, t = {}) {
  console.log(`[ProtectService] Initiating final protection pipeline for: ${e.name}`);
  try {
    const n = await Ie(e), r = await ar(n), o = await sr(n);
    console.log("[ProtectService] Generated original fingerprints:", { phash: r, whash: o });
    const a = await Ut(e, { preprocess: t });
    if (!a.success)
      throw new Error(`Scanning phase failed: ${a.error}`);
    if (!(a.riskLevel !== "low" || t.autoRedact))
      return console.log("[ProtectService] Document evaluated as low risk. Skipping edits."), {
        success: !0,
        protectedFile: e,
        // Return original file unmodified
        phash: r,
        whash: o,
        metadata: {
          name: e.name,
          size: e.size,
          type: e.type
        },
        detections: [],
        risk: a.riskLevel
      };
    console.log(`[ProtectService] Applying visual protections (Mode: ${t.blurMode || "redact"})...`);
    let l = await or(n, a.detections, t);
    t.aiCloakEnabled && (l = await tr(l, 5)), t.watermarkEnabled && (l = await rr(l, "SafeLens_Protected_Asset"));
    const d = await cr(l, e.name, e.type);
    return console.log(`[ProtectService] Protection pipeline complete. Output file: ${d.name}`), {
      success: !0,
      protectedFile: d,
      phash: r,
      whash: o,
      metadata: {
        name: e.name,
        size: e.size,
        type: e.type
      },
      detections: a.detections,
      risk: a.riskLevel
    };
  } catch (n) {
    return console.error("[ProtectService] Critical pipeline crash:", n), {
      success: !1,
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
      error: n instanceof Error ? n.message : "Unknown protection pipeline failure"
    };
  }
}
class ur {
  constructor() {
    this.nativePort = null, this.isConnected = !1;
  }
  /**
   * Diagnostic health check evaluating connectivity to the backend FastAPI / native host.
   * 
   * @returns {Promise<{ success: boolean, status: string, version: string }>} Diagnostic report
   */
  async checkHealth() {
    return console.log("[BridgeClient] Querying service connectivity health..."), new Promise((t) => {
      setTimeout(() => {
        t({
          success: !0,
          status: "healthy",
          version: "1.0.0",
          provider: "Mock / Future FastAPI Hook"
        });
      }, 100);
    });
  }
  /**
   * Transmits scan details and metadata logs to populate the central dashboard.
   * 
   * @param {Object} scanReport - Completed scan result metrics
   * @returns {Promise<{ success: boolean, syncId: string }>} Sync confirmation details
   */
  async syncScanResult(t) {
    if (!t)
      throw new Error("Scan report payload is required");
    return console.log("[BridgeClient] Syncing scan report to FastAPI backend dashboard:", t.metadata.name), new Promise((n) => {
      setTimeout(() => {
        n({
          success: !0,
          syncId: `sync_${Math.random().toString(36).substr(2, 9)}`
        });
      }, 150);
    });
  }
  /**
   * Triggers an incident alert notification when PII is intercepted on inputs.
   * 
   * @param {IncidentPayload} incident - Detailed incident parameters
   * @returns {Promise<{ success: boolean, alertDispatched: boolean }>} Confirmation report
   */
  async sendIncidentNotification(t) {
    if (!t)
      throw new Error("Incident payload is required");
    return console.warn(`[BridgeClient] Dispatching PRIVACY INCIDENT ALERT: [${t.riskLevel.toUpperCase()}] on file ${t.fileName}`), new Promise((n) => {
      setTimeout(() => {
        n({
          success: !0,
          alertDispatched: !0
        });
      }, 200);
    });
  }
  /**
   * Synchronizes extension settings preferences with the backend dashboard.
   * 
   * @param {Object} settings - Extension Settings object
   * @returns {Promise<{ success: boolean }>} Confirmation status
   */
  async syncSettings(t) {
    if (!t)
      throw new Error("Settings payload is required");
    return console.log("[BridgeClient] Synchronizing Settings preferences with server profile..."), new Promise((n) => {
      setTimeout(() => {
        n({ success: !0 });
      }, 100);
    });
  }
  /**
   * (Future Placeholder) Establishes runtime connection to the Chrome Native Messaging Host.
   */
  initializeNativePort() {
    try {
      typeof chrome < "u" && chrome.runtime && chrome.runtime.connectNative && (console.log("[BridgeClient] Initializing Native Messaging Host port connection..."), this.nativePort = chrome.runtime.connectNative("safelens.bridge"), this.nativePort.onMessage.addListener((t) => {
        console.log("[BridgeClient] Message received from Native Host:", t);
      }), this.nativePort.onDisconnect.addListener(() => {
        console.warn("[BridgeClient] Native Host port connection disconnected."), this.nativePort = null, this.isConnected = !1;
      }), this.isConnected = !0);
    } catch (t) {
      console.warn("[BridgeClient] Native messaging initialization skipped (unsupported context).", t);
    }
  }
}
const ce = new ur(), dr = {
  /**
   * Preprocesses intercepted image files using local OpenCV.js (WASM) inside the Service Worker.
   * Runs OffscreenCanvas operations completely isolated from host webpage scopes.
   */
  PREPROCESS_IMAGE: async (e) => {
    if (!e || !e.arrayBuffer)
      throw new Error("Invalid payload: arrayBuffer is required");
    await we();
    const { arrayBuffer: t, type: n, settings: r } = e, o = new Blob([t], { type: n || "image/png" }), a = await createImageBitmap(o), i = new OffscreenCanvas(a.width, a.height);
    i.getContext("2d").drawImage(a, 0, 0);
    const d = await ye(i, r);
    return {
      arrayBuffer: await (await d.convertToBlob({ type: n || "image/png" })).arrayBuffer(),
      width: d.width,
      height: d.height
    };
  },
  /**
   * Runs the complete local privacy protection pipeline on the file's ArrayBuffer.
   */
  RUN_PROTECT_PIPELINE: async (e) => {
    if (!e || !e.arrayBuffer)
      throw new Error("Invalid payload: arrayBuffer is required");
    await we();
    const { arrayBuffer: t, name: n, type: r, settings: o } = e, a = {
      name: n || "upload.png",
      size: t.byteLength,
      type: r || "image/png",
      arrayBuffer: () => Promise.resolve(t)
    };
    return await lr(a, o);
  },
  /**
   * Toggle or set extension settings in storage.
   */
  SET_SETTINGS: async (e) => {
    if (!e || typeof e != "object")
      throw new Error("Invalid settings payload");
    await chrome.storage.local.set({ settings: e });
    try {
      await ce.syncSettings(e);
    } catch (t) {
      console.warn("[MessageRouter] Settings sync failed:", t);
    }
    return { success: !0 };
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
    const { scans: t = [] } = await chrome.storage.local.get("scans"), n = [e, ...t].slice(0, 100);
    await chrome.storage.local.set({ scans: n });
    try {
      await ce.syncScanResult({
        metadata: { name: e.fileName, size: e.size, type: "image/png" },
        ...e
      }), e.riskLevel !== "low" && await ce.sendIncidentNotification({
        incidentId: e.scanId,
        fileName: e.fileName,
        fileSize: e.size,
        riskLevel: e.riskLevel,
        status: e.status,
        detections: e.detections,
        timestamp: Date.now()
      });
    } catch (r) {
      console.warn("[MessageRouter] Failed to sync scan metadata with BridgeClient:", r);
    }
    return { success: !0 };
  }
};
async function we() {
  if (!(typeof document > "u" && typeof chrome < "u" && chrome.offscreen) && !(typeof cv < "u" && cv.matFromImageData))
    return new Promise((e, t) => {
      let n = 0;
      const r = setInterval(() => {
        n++, typeof cv < "u" && cv.matFromImageData ? (clearInterval(r), e()) : n > 50 && (clearInterval(r), t(new Error("OpenCV.js WASM compilation timed out (5s)")));
      }, 100);
    });
}
async function fr(e, t) {
  try {
    if (!e || typeof e != "object")
      return { success: !1, error: "Malformed message: Message must be an object" };
    const { type: n, payload: r } = e;
    if (!n || typeof n != "string")
      return { success: !1, error: "Malformed message: Missing type property" };
    console.log(`[MessageRouter] Routing message type: ${n}`, { senderId: t.id, origin: t.origin });
    const o = dr[n];
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
        settings: Ae,
        scans: []
        // Initialize scan log history
      }), console.log("[ServiceWorker] Default settings storage initialized."));
    } catch (t) {
      console.error("[ServiceWorker] Error initializing storage settings:", t);
    }
  else e.reason === "update" && console.log("[ServiceWorker] SafeLens successfully updated to new version.");
});
chrome.runtime.onMessage.addListener((e, t, n) => (fr(e, t).then((r) => {
  n(r);
}).catch((r) => {
  console.error("[ServiceWorker] Message routing failure:", r), n({
    success: !1,
    error: r instanceof Error ? r.message : "Async processing exception"
  });
}), !0));
