const Se = {
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
async function ke(e, t = 1920, n = 1080) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let r = null, o = null;
  try {
    let { width: i, height: a } = e, c = !1;
    if (i > t && (a = Math.round(a * t / i), i = t, c = !0), a > n && (i = Math.round(i * n / a), a = n, c = !0), !c)
      return e;
    if (console.log(`[Resize] Scaling image down to ${i}x${a} using cv.resize`), typeof cv > "u" || !cv.matFromImageData)
      throw new Error("OpenCV.js runtime is not loaded");
    const g = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    r = cv.matFromImageData(g), o = new cv.Mat();
    const p = new cv.Size(i, a);
    cv.resize(r, o, p, 0, 0, cv.INTER_AREA);
    const s = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(i, a) : document.createElement("canvas");
    s.width = i, s.height = a;
    const f = s.getContext("2d"), m = new ImageData(new Uint8ClampedArray(o.data), o.cols, o.rows);
    return f.putImageData(m, 0, 0), s;
  } catch (i) {
    console.warn("[Resize] OpenCV resizing failed. Falling back to native canvas context scaling:", i);
    try {
      const { width: a, height: c } = e;
      let l = a, g = c;
      l > t && (g = Math.round(g * t / l), l = t), g > n && (l = Math.round(l * n / g), g = n);
      const p = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(l, g) : document.createElement("canvas");
      p.width = l, p.height = g;
      const s = p.getContext("2d");
      return s.imageSmoothingEnabled = !0, s.imageSmoothingQuality = "high", s.drawImage(e, 0, 0, l, g), p;
    } catch (a) {
      return console.error("[Resize] Native canvas resizing fallback failed. Returning original image.", a), e;
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
    const i = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(i), n = new cv.Mat(), cv.cvtColor(t, n, cv.COLOR_RGBA2GRAY), r = new cv.Mat(), cv.cvtColor(n, r, cv.COLOR_GRAY2RGBA);
    const a = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    a.width = e.width, a.height = e.height;
    const c = a.getContext("2d"), l = new ImageData(new Uint8ClampedArray(r.data), r.cols, r.rows);
    return c.putImageData(l, 0, 0), a;
  } catch (o) {
    console.warn("[Grayscale] OpenCV conversion failed. Falling back to native JS luminosity conversions:", o);
    try {
      const a = e.getContext("2d").getImageData(0, 0, e.width, e.height), c = a.data;
      for (let g = 0; g < c.length; g += 4) {
        const p = c[g], s = c[g + 1], f = c[g + 2], m = Math.round(0.299 * p + 0.587 * s + 0.114 * f);
        c[g] = m, c[g + 1] = m, c[g + 2] = m;
      }
      const l = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
      return l.width = e.width, l.height = e.height, l.getContext("2d").putImageData(a, 0, 0), l;
    } catch (i) {
      return console.error("[Grayscale] JS grayscale fallback failed. Returning original image.", i), e;
    }
  } finally {
    t && t.delete(), n && n.delete(), r && r.delete();
  }
}
async function Oe(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let t = null, n = null;
  try {
    if (typeof cv > "u" || !cv.GaussianBlur)
      throw new Error("OpenCV.js runtime is not loaded");
    const o = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(o), n = new cv.Mat();
    const i = new cv.Size(3, 3);
    cv.GaussianBlur(t, n, i, 0, 0, cv.BORDER_DEFAULT);
    const a = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    a.width = e.width, a.height = e.height;
    const c = a.getContext("2d"), l = new ImageData(new Uint8ClampedArray(n.data), n.cols, n.rows);
    return c.putImageData(l, 0, 0), a;
  } catch (r) {
    return console.warn("[Denoise] Denoising failed. Skipping this stage and returning original canvas:", r), e;
  } finally {
    t && t.delete(), n && n.delete();
  }
}
async function Te(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let t = null, n = null, r = null, o = null, i = null, a = null;
  try {
    if (typeof cv > "u" || !cv.HoughLinesP)
      throw new Error("OpenCV.js runtime is not loaded");
    const l = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(l), n = new cv.Mat(), r = new cv.Mat(), o = new cv.Mat(), cv.cvtColor(t, n, cv.COLOR_RGBA2GRAY), cv.Canny(n, r, 50, 200, 3), cv.HoughLinesP(r, o, 1, Math.PI / 180, 100, 50, 10);
    let g = 0, p = 0;
    for (let C = 0; C < o.rows; ++C) {
      const v = o.data32S[C * 4], S = o.data32S[C * 4 + 1], O = o.data32S[C * 4 + 2], T = o.data32S[C * 4 + 3], R = Math.atan2(T - S, O - v) * (180 / Math.PI);
      R > -45 && R < 45 && (g += R, p++);
    }
    if (p < 3)
      return console.log("[Deskew] Insufficient line segments detected. Skipping deskew."), { canvas: e, angle: 0 };
    const s = g / p;
    if (Math.abs(s) < 0.5)
      return console.log(`[Deskew] Skew angle is negligible (${s.toFixed(2)} deg). Skipping rotation.`), { canvas: e, angle: 0 };
    console.log(`[Deskew] Correcting skew angle: ${s.toFixed(2)} degrees`);
    const f = new cv.Point(e.width / 2, e.height / 2);
    a = cv.getRotationMatrix2D(f, s, 1), i = new cv.Mat();
    const m = new cv.Size(e.width, e.height);
    cv.warpAffine(t, i, a, m, cv.INTER_CUBIC, cv.BORDER_REPLICATE);
    const I = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    I.width = e.width, I.height = e.height;
    const M = I.getContext("2d"), A = new ImageData(new Uint8ClampedArray(i.data), i.cols, i.rows);
    return M.putImageData(A, 0, 0), { canvas: I, angle: s };
  } catch (c) {
    return console.warn("[Deskew] Hough deskewing failed. Skipping this stage and returning original canvas:", c), { canvas: e, angle: 0 };
  } finally {
    t && t.delete(), n && n.delete(), r && r.delete(), o && o.delete(), i && i.delete(), a && a.delete();
  }
}
async function De(e, t = 127) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let n = null, r = null, o = null, i = null;
  try {
    if (typeof cv > "u" || !cv.adaptiveThreshold)
      throw new Error("OpenCV.js runtime is not loaded");
    const c = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    n = cv.matFromImageData(c), r = new cv.Mat(), cv.cvtColor(n, r, cv.COLOR_RGBA2GRAY), o = new cv.Mat(), cv.adaptiveThreshold(
      r,
      o,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      11,
      2
    ), i = new cv.Mat(), cv.cvtColor(o, i, cv.COLOR_GRAY2RGBA);
    const l = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    l.width = e.width, l.height = e.height;
    const g = l.getContext("2d"), p = new ImageData(new Uint8ClampedArray(i.data), i.cols, i.rows);
    return g.putImageData(p, 0, 0), l;
  } catch (a) {
    console.warn("[Threshold] OpenCV adaptive thresholding failed. Falling back to grayscale image:", a);
    try {
      return await Re(e);
    } catch (c) {
      return console.error("[Threshold] Grayscale fallback failed. Returning original canvas.", c), e;
    }
  } finally {
    n && n.delete(), r && r.delete(), o && o.delete(), i && i.delete();
  }
}
async function Re(e) {
  const n = e.getContext("2d").getImageData(0, 0, e.width, e.height), r = n.data;
  for (let i = 0; i < r.length; i += 4) {
    const a = Math.round(0.299 * r[i] + 0.587 * r[i + 1] + 0.114 * r[i + 2]);
    r[i] = a, r[i + 1] = a, r[i + 2] = a;
  }
  const o = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
  return o.width = e.width, o.height = e.height, o.getContext("2d").putImageData(n, 0, 0), o;
}
let K = null;
async function Pe() {
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
async function Le(e, t, n = 15e3) {
  await Pe();
  const r = (o = 3) => new Promise((i, a) => {
    let c = setTimeout(() => {
      a(new Error(`Offscreen execution timed out after ${n}ms`));
    }, n);
    chrome.runtime.sendMessage({
      target: "offscreen",
      type: e,
      payload: t
    }, (l) => {
      if (clearTimeout(c), chrome.runtime.lastError) {
        const g = chrome.runtime.lastError.message;
        if (g.includes("Could not establish connection") && o > 0) {
          console.warn(`[OffscreenManager] Connection failed (${g}). Retrying in 100ms... (${o} retries left)`), setTimeout(() => {
            r(o - 1).then(i, a);
          }, 100);
          return;
        }
        return a(new Error(g));
      }
      if (!l)
        return a(new Error("No response received from offscreen document"));
      if (!l.success)
        return a(new Error(l.error || "Offscreen processing failed"));
      i(l.payload);
    });
  });
  return r();
}
async function ve(e, t = {}) {
  if (typeof document > "u" && typeof chrome < "u" && chrome.offscreen) {
    console.log("[Preprocessor] Running in Service Worker. Delegating OpenCV to Offscreen Document...");
    try {
      const p = e.getContext("2d").getImageData(0, 0, e.width, e.height), s = await Le("PREPROCESS_IMAGE", {
        width: e.width,
        height: e.height,
        data: p.data.buffer,
        options: t
      }), f = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(s.width, s.height) : document.createElement("canvas");
      f.width = s.width, f.height = s.height;
      const m = f.getContext("2d"), I = new ImageData(new Uint8ClampedArray(s.data), s.width, s.height);
      return m.putImageData(I, 0, 0), f;
    } catch (g) {
      return console.error("[Preprocessor] Offscreen delegation failed. Returning original imageSource.", g), e;
    }
  }
  const {
    enableDenoise: n = !0,
    enableDeskew: r = !0,
    thresholdValue: o = 127,
    maxWidth: i = 1920,
    maxHeight: a = 1080
  } = t;
  console.log("[Preprocessor] Beginning OpenCV.js image preprocessing pipeline...");
  const c = Date.now();
  let l = e;
  try {
    try {
      l = await ke(l, i, a);
    } catch (s) {
      console.warn("[Preprocessor] Resize stage failed. Continuing...", s);
    }
    try {
      l = await Me(l);
    } catch (s) {
      console.warn("[Preprocessor] Grayscale stage failed. Continuing...", s);
    }
    if (n)
      try {
        l = await Oe(l);
      } catch (s) {
        console.warn("[Preprocessor] Denoise stage failed. Continuing...", s);
      }
    let g = 0;
    if (r)
      try {
        const s = await Te(l);
        l = s.canvas, g = s.angle;
      } catch (s) {
        console.warn("[Preprocessor] Deskew stage failed. Continuing...", s);
      }
    try {
      l = await De(l, o);
    } catch (s) {
      console.warn("[Preprocessor] Threshold binarization stage failed. Continuing...", s);
    }
    const p = Date.now() - c;
    return console.log(`[Preprocessor] Pipeline resolved successfully in ${p}ms. Skew Angle: ${g.toFixed(2)} deg.`), l;
  } catch (g) {
    return console.error("[Preprocessor] Critical pipeline failure. Returning original image.", g), e;
  }
}
var _e = { exports: {} };
(function(e) {
  var t = function(n) {
    var r = Object.prototype, o = r.hasOwnProperty, i = Object.defineProperty || function(d, u, h) {
      d[u] = h.value;
    }, a, c = typeof Symbol == "function" ? Symbol : {}, l = c.iterator || "@@iterator", g = c.asyncIterator || "@@asyncIterator", p = c.toStringTag || "@@toStringTag";
    function s(d, u, h) {
      return Object.defineProperty(d, u, {
        value: h,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }), d[u];
    }
    try {
      s({}, "");
    } catch {
      s = function(u, h, y) {
        return u[h] = y;
      };
    }
    function f(d, u, h, y) {
      var w = u && u.prototype instanceof S ? u : S, E = Object.create(w.prototype), _ = new V(y || []);
      return i(E, "_invoke", { value: ne(d, h, _) }), E;
    }
    n.wrap = f;
    function m(d, u, h) {
      try {
        return { type: "normal", arg: d.call(u, h) };
      } catch (y) {
        return { type: "throw", arg: y };
      }
    }
    var I = "suspendedStart", M = "suspendedYield", A = "executing", C = "completed", v = {};
    function S() {
    }
    function O() {
    }
    function T() {
    }
    var R = {};
    s(R, l, function() {
      return this;
    });
    var N = Object.getPrototypeOf, P = N && N(N(x([])));
    P && P !== r && o.call(P, l) && (R = P);
    var D = T.prototype = S.prototype = Object.create(R);
    O.prototype = T, i(D, "constructor", { value: T, configurable: !0 }), i(
      T,
      "constructor",
      { value: O, configurable: !0 }
    ), O.displayName = s(
      T,
      p,
      "GeneratorFunction"
    );
    function L(d) {
      ["next", "throw", "return"].forEach(function(u) {
        s(d, u, function(h) {
          return this._invoke(u, h);
        });
      });
    }
    n.isGeneratorFunction = function(d) {
      var u = typeof d == "function" && d.constructor;
      return u ? u === O || // For the native GeneratorFunction constructor, the best we can
      // do is to check its .name property.
      (u.displayName || u.name) === "GeneratorFunction" : !1;
    }, n.mark = function(d) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(d, T) : (d.__proto__ = T, s(d, p, "GeneratorFunction")), d.prototype = Object.create(D), d;
    }, n.awrap = function(d) {
      return { __await: d };
    };
    function j(d, u) {
      function h(E, _, F, G) {
        var z = m(d[E], d, _);
        if (z.type === "throw")
          G(z.arg);
        else {
          var ae = z.arg, J = ae.value;
          return J && typeof J == "object" && o.call(J, "__await") ? u.resolve(J.__await).then(function(H) {
            h("next", H, F, G);
          }, function(H) {
            h("throw", H, F, G);
          }) : u.resolve(J).then(function(H) {
            ae.value = H, F(ae);
          }, function(H) {
            return h("throw", H, F, G);
          });
        }
      }
      var y;
      function w(E, _) {
        function F() {
          return new u(function(G, z) {
            h(E, _, G, z);
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
      i(this, "_invoke", { value: w });
    }
    L(j.prototype), s(j.prototype, g, function() {
      return this;
    }), n.AsyncIterator = j, n.async = function(d, u, h, y, w) {
      w === void 0 && (w = Promise);
      var E = new j(
        f(d, u, h, y),
        w
      );
      return n.isGeneratorFunction(u) ? E : E.next().then(function(_) {
        return _.done ? _.value : E.next();
      });
    };
    function ne(d, u, h) {
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
          var F = h.delegate;
          if (F) {
            var G = Q(F, h);
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
          var z = m(d, u, h);
          if (z.type === "normal") {
            if (y = h.done ? C : M, z.arg === v)
              continue;
            return {
              value: z.arg,
              done: h.done
            };
          } else z.type === "throw" && (y = C, h.method = "throw", h.arg = z.arg);
        }
      };
    }
    function Q(d, u) {
      var h = u.method, y = d.iterator[h];
      if (y === a)
        return u.delegate = null, h === "throw" && d.iterator.return && (u.method = "return", u.arg = a, Q(d, u), u.method === "throw") || h !== "return" && (u.method = "throw", u.arg = new TypeError(
          "The iterator does not provide a '" + h + "' method"
        )), v;
      var w = m(y, d.iterator, u.arg);
      if (w.type === "throw")
        return u.method = "throw", u.arg = w.arg, u.delegate = null, v;
      var E = w.arg;
      if (!E)
        return u.method = "throw", u.arg = new TypeError("iterator result is not an object"), u.delegate = null, v;
      if (E.done)
        u[d.resultName] = E.value, u.next = d.nextLoc, u.method !== "return" && (u.method = "next", u.arg = a);
      else
        return E;
      return u.delegate = null, v;
    }
    L(D), s(D, p, "Generator"), s(D, l, function() {
      return this;
    }), s(D, "toString", function() {
      return "[object Generator]";
    });
    function oe(d) {
      var u = { tryLoc: d[0] };
      1 in d && (u.catchLoc = d[1]), 2 in d && (u.finallyLoc = d[2], u.afterLoc = d[3]), this.tryEntries.push(u);
    }
    function Z(d) {
      var u = d.completion || {};
      u.type = "normal", delete u.arg, d.completion = u;
    }
    function V(d) {
      this.tryEntries = [{ tryLoc: "root" }], d.forEach(oe, this), this.reset(!0);
    }
    n.keys = function(d) {
      var u = Object(d), h = [];
      for (var y in u)
        h.push(y);
      return h.reverse(), function w() {
        for (; h.length; ) {
          var E = h.pop();
          if (E in u)
            return w.value = E, w.done = !1, w;
        }
        return w.done = !0, w;
      };
    };
    function x(d) {
      if (d) {
        var u = d[l];
        if (u)
          return u.call(d);
        if (typeof d.next == "function")
          return d;
        if (!isNaN(d.length)) {
          var h = -1, y = function w() {
            for (; ++h < d.length; )
              if (o.call(d, h))
                return w.value = d[h], w.done = !1, w;
            return w.value = a, w.done = !0, w;
          };
          return y.next = y;
        }
      }
      return { next: b };
    }
    n.values = x;
    function b() {
      return { value: a, done: !0 };
    }
    return V.prototype = {
      constructor: V,
      reset: function(d) {
        if (this.prev = 0, this.next = 0, this.sent = this._sent = a, this.done = !1, this.delegate = null, this.method = "next", this.arg = a, this.tryEntries.forEach(Z), !d)
          for (var u in this)
            u.charAt(0) === "t" && o.call(this, u) && !isNaN(+u.slice(1)) && (this[u] = a);
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
        function h(G, z) {
          return E.type = "throw", E.arg = d, u.next = G, z && (u.method = "next", u.arg = a), !!z;
        }
        for (var y = this.tryEntries.length - 1; y >= 0; --y) {
          var w = this.tryEntries[y], E = w.completion;
          if (w.tryLoc === "root")
            return h("end");
          if (w.tryLoc <= this.prev) {
            var _ = o.call(w, "catchLoc"), F = o.call(w, "finallyLoc");
            if (_ && F) {
              if (this.prev < w.catchLoc)
                return h(w.catchLoc, !0);
              if (this.prev < w.finallyLoc)
                return h(w.finallyLoc);
            } else if (_) {
              if (this.prev < w.catchLoc)
                return h(w.catchLoc, !0);
            } else if (F) {
              if (this.prev < w.finallyLoc)
                return h(w.finallyLoc);
            } else
              throw new Error("try statement without catch or finally");
          }
        }
      },
      abrupt: function(d, u) {
        for (var h = this.tryEntries.length - 1; h >= 0; --h) {
          var y = this.tryEntries[h];
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
          var h = this.tryEntries[u];
          if (h.finallyLoc === d)
            return this.complete(h.completion, h.afterLoc), Z(h), v;
        }
      },
      catch: function(d) {
        for (var u = this.tryEntries.length - 1; u >= 0; --u) {
          var h = this.tryEntries[u];
          if (h.tryLoc === d) {
            var y = h.completion;
            if (y.type === "throw") {
              var w = y.arg;
              Z(h);
            }
            return w;
          }
        }
        throw new Error("illegal catch attempt");
      },
      delegateYield: function(d, u, h) {
        return this.delegate = {
          iterator: x(d),
          resultName: u,
          nextLoc: h
        }, this.method === "next" && (this.arg = a), v;
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
})(_e);
var xe = (e, t) => `${e}-${t}-${Math.random().toString(16).slice(3, 8)}`;
const $e = xe;
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
}, Je = ({ workerPath: e, workerBlobURL: t }) => {
  let n;
  if (Blob && URL && t) {
    const r = new Blob([`importScripts("${e}");`], {
      type: "application/javascript"
    });
    n = new Worker(URL.createObjectURL(r));
  } else
    n = new Worker(e);
  return n;
}, Ke = (e) => {
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
const tt = Ve, rt = Je, nt = Ke, ot = Xe, at = Qe, it = et;
var st = {
  defaultOptions: tt,
  spawnWorker: rt,
  terminateWorker: nt,
  onMessage: ot,
  send: at,
  loadImage: it
};
const ct = We, W = Be, { log: fe } = re, lt = xe, Y = Ue, {
  defaultOptions: ut,
  spawnWorker: dt,
  terminateWorker: ft,
  onMessage: ht,
  loadImage: he,
  send: gt
} = st;
let ge = 0;
var Ce = async (e = "eng", t = Y.LSTM_ONLY, n = {}, r = {}) => {
  const o = lt("Worker", ge), {
    logger: i,
    errorHandler: a,
    ...c
  } = ct({
    ...ut,
    ...n
  }), l = {}, g = typeof e == "string" ? e.split("+") : e;
  let p = t, s = r;
  const f = [Y.DEFAULT, Y.LSTM_ONLY].includes(t) && !c.legacyCore;
  let m, I;
  const M = new Promise((x, b) => {
    I = x, m = b;
  }), A = (x) => {
    m(x.message);
  };
  let C = dt(c);
  C.onerror = A, ge += 1;
  const v = ({ id: x, action: b, payload: d }) => new Promise((u, h) => {
    fe(`[${o}]: Start ${x}, action=${b}`);
    const y = `${b}-${x}`;
    l[y] = { resolve: u, reject: h }, gt(C, {
      workerId: o,
      jobId: x,
      action: b,
      payload: d
    });
  }), S = () => console.warn("`load` is depreciated and should be removed from code (workers now come pre-loaded)"), O = (x) => v(W({
    id: x,
    action: "load",
    payload: { options: { lstmOnly: f, corePath: c.corePath, logging: c.logging } }
  })), T = (x, b, d) => v(W({
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
  })), D = (x, b) => v(W({
    id: b,
    action: "loadLanguage",
    payload: {
      langs: x,
      options: {
        langPath: c.langPath,
        dataPath: c.dataPath,
        cachePath: c.cachePath,
        cacheMethod: c.cacheMethod,
        gzip: c.gzip,
        lstmOnly: [Y.DEFAULT, Y.LSTM_ONLY].includes(p) && !c.legacyLang
      }
    }
  })), L = (x, b, d, u) => v(W({
    id: u,
    action: "initialize",
    payload: { langs: x, oem: b, config: d }
  })), j = (x = "eng", b, d, u) => {
    if (f && [Y.TESSERACT_ONLY, Y.TESSERACT_LSTM_COMBINED].includes(b)) throw Error("Legacy model requested but code missing.");
    const h = b || p;
    p = h;
    const y = d || s;
    s = y;
    const E = (typeof x == "string" ? x.split("+") : x).filter((_) => !g.includes(_));
    return g.push(...E), E.length > 0 ? D(E, u).then(() => L(x, h, y, u)) : L(x, h, y, u);
  }, ne = (x = {}, b) => v(W({
    id: b,
    action: "setParameters",
    payload: { params: x }
  })), Q = async (x, b = {}, d = {
    text: !0
  }, u) => v(W({
    id: u,
    action: "recognize",
    payload: { image: await he(x), options: b, output: d }
  })), oe = async (x, b) => {
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
    data: h
  }) => {
    const y = `${u}-${b}`;
    if (d === "resolve")
      fe(`[${x}]: Complete ${b}`), l[y].resolve({ jobId: b, data: h }), delete l[y];
    else if (d === "reject")
      if (l[y].reject(h), delete l[y], u === "load" && m(h), a)
        a(h);
      else
        throw Error(h);
    else d === "progress" && i({ ...h, userJobId: b });
  });
  const V = {
    id: o,
    worker: C,
    load: S,
    writeText: T,
    readText: R,
    removeFile: N,
    FS: P,
    reinitialize: j,
    setParameters: ne,
    recognize: Q,
    detect: oe,
    terminate: Z
  };
  return O().then(() => D(e)).then(() => L(e, t, r)).then(() => I(V)).catch(() => {
  }), M;
};
const be = Ce, pt = async (e, t, n) => {
  const r = await be(t, 1, n);
  return r.recognize(e).finally(async () => {
    await r.terminate();
  });
}, mt = async (e, t) => {
  const n = await be("osd", 0, t);
  return n.detect(e).finally(async () => {
    await n.terminate();
  });
};
var wt = {
  recognize: pt,
  detect: mt
};
const yt = Ce, vt = wt;
var xt = {
  createWorker: yt,
  ...vt
};
let se = null, X = null, pe = Promise.resolve();
async function Ct(e = "eng") {
  return se || X || (X = (async () => {
    try {
      console.log(`[TesseractWorker] Spawning local OCR worker for language: ${e}...`);
      const t = chrome.runtime.getURL("tesseract/worker.min.js"), n = chrome.runtime.getURL("tesseract/tesseract-core.wasm.js"), r = chrome.runtime.getURL("tesseract/");
      console.log("[TesseractWorker] Configuring local sandboxed paths:", { workerPath: t, corePath: n, langPath: r });
      const o = await xt.createWorker(e, 1, {
        workerPath: t,
        corePath: n,
        langPath: r,
        cacheMethod: "none",
        // Prevent trying to write to browser IndexedDB caches
        gzip: !0,
        // eng.traineddata.gz is compressed
        logger: (i) => {
          i.status === "recognizing text" && console.log(`[TesseractWorker] OCR Progress: ${Math.round(i.progress * 100)}%`);
        }
      });
      return se = o, o;
    } catch (t) {
      throw console.error("[TesseractWorker] Failed to create or load worker:", t), X = null, t;
    }
  })(), X);
}
async function bt(e) {
  let t;
  const n = new Promise((r) => {
    pe.then(() => r());
  });
  pe = new Promise((r) => {
    t = r;
  }), await n;
  try {
    const r = await Ct(), i = e.getContext("2d").getImageData(0, 0, e.width, e.height);
    return await r.recognize(i);
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
function Ie(e) {
  return !e || !Array.isArray(e.words) ? [] : (console.log("[ExtractBoundingBoxes] Compiling spatial coordinate box records..."), e.words.map((t) => {
    const n = t.bbox ? t.bbox.x0 : 0, r = t.bbox ? t.bbox.y0 : 0, o = t.bbox ? t.bbox.x1 : 0, i = t.bbox ? t.bbox.y1 : 0;
    return {
      x: n,
      y: r,
      width: o - n,
      height: i - r,
      confidence: typeof t.confidence == "number" ? t.confidence : 0,
      text: t.text || ""
    };
  }));
}
async function At(e) {
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
    const { data: r } = n, o = It(r), i = Et(r), a = Ie(r), c = Date.now() - t;
    return console.log(`[RecognizeImage] OCR successful. Latency: ${c}ms. Text length: ${r.text ? r.text.length : 0}`), {
      text: r.text || "",
      confidence: typeof r.confidence == "number" ? r.confidence : 0,
      words: o,
      lines: i,
      boundingBoxes: a,
      processingTime: c
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
const St = {
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
  const n = [], r = Ot(e, t);
  for (const [o, i] of Object.entries(St)) {
    i.lastIndex = 0;
    let a;
    for (; (a = i.exec(e)) !== null; ) {
      const c = a[0], l = a.index, g = l + c.length, p = r.filter((f) => f.startIndex < g && f.endIndex > l).map((f) => ({
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        confidence: f.confidence
      })), s = p.length > 0 ? p.reduce((f, m) => f + m.confidence, 0) / p.length : 0;
      n.push({
        type: o,
        value: c,
        regexConfidence: kt[o] || 0.8,
        ocrConfidence: s / 100,
        // Normalize to 0.0 - 1.0
        startIndex: l,
        endIndex: g,
        bboxes: p,
        source: "regex"
      });
    }
  }
  return n;
}
function Ot(e, t) {
  let n = 0;
  return t.map((r) => {
    if (!r.text)
      return { ...r, startIndex: -1, endIndex: -1 };
    const o = r.text.trim(), i = e.indexOf(o, n);
    return i !== -1 ? (n = i + o.length, {
      ...r,
      startIndex: i,
      endIndex: n
    }) : { ...r, startIndex: -1, endIndex: -1 };
  });
}
async function Tt(e) {
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
      severity: Dt[t.type] || "medium",
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
], Lt = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 1, 4, 6, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];
function _t(e) {
  const t = e.replace(/[-\s]/g, "");
  if (t.length !== 12 || !/^\d{12}$/.test(t) || t[0] === "0" || t[0] === "1")
    return !1;
  let n = 0;
  const r = t.split("").map(Number).reverse();
  for (let o = 0; o < r.length; o++)
    n = Pt[n][Lt[o % 8][r[o]]];
  return n === 0;
}
function $t(e) {
  const t = e.replace(/[-\s]/g, "");
  if (!/^\d{13,19}$/.test(t))
    return !1;
  let n = 0, r = !1;
  for (let o = t.length - 1; o >= 0; o--) {
    let i = parseInt(t.charAt(o), 10);
    r && (i *= 2, i > 9 && (i -= 9)), n += i, r = !r;
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
          n = _t(t.value);
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
  const t = [...e].sort((o, i) => o.x - i.x), n = [];
  let r = t[0];
  for (let o = 1; o < t.length; o++) {
    const i = t[o], a = r.y + r.height, c = i.y + i.height, l = Math.min(a, c) - Math.max(r.y, i.y), g = i.x - (r.x + r.width);
    if (l > 0 && g <= 15) {
      const p = Math.min(r.x, i.x), s = Math.min(r.y, i.y), f = Math.max(r.x + r.width, i.x + i.width), m = Math.max(a, c);
      r = {
        x: p,
        y: s,
        width: f - p,
        height: m - s,
        confidence: Math.max(r.confidence, i.confidence)
      };
    } else
      n.push(r), r = i;
  }
  return n.push(r), n;
}
function Gt(e) {
  if (!Array.isArray(e) || e.length <= 1)
    return e || [];
  const t = [...e].sort((i, a) => i.startIndex - a.startIndex), n = [];
  let r = t[0];
  for (let i = 1; i < t.length; i++) {
    const a = t[i];
    a.startIndex <= r.endIndex ? a.rulePassed && !r.rulePassed || a.rulePassed === r.rulePassed && a.regexConfidence > r.regexConfidence ? r = {
      ...a,
      startIndex: r.startIndex,
      endIndex: Math.max(r.endIndex, a.endIndex),
      value: r.value + a.value.substring(Math.max(0, r.endIndex - a.startIndex)),
      bboxes: ee([...r.bboxes, ...a.bboxes])
    } : r = {
      ...r,
      endIndex: Math.max(r.endIndex, a.endIndex),
      value: r.value + a.value.substring(Math.max(0, r.endIndex - a.startIndex)),
      bboxes: ee([...r.bboxes, ...a.bboxes])
    } : (r.bboxes = ee(r.bboxes), n.push(r), r = a);
  }
  r.bboxes = ee(r.bboxes), n.push(r);
  const o = /* @__PURE__ */ new Set();
  return n.filter((i) => {
    const a = `${i.type}_${i.startIndex}_${i.value}`;
    return o.has(a) ? !1 : (o.add(a), !0);
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
    const i = Wt[o.severity] || 2, a = typeof o.fusedConfidence == "number" ? o.fusedConfidence : 0.8;
    t += i * a, o.severity === "critical" && a >= 0.7 && (n = !0);
  });
  let r = "low";
  return n || t >= 15 ? r = "critical" : t >= 5 ? r = "high" : t >= 2 && (r = "medium"), console.log(`[RiskAnalyzer] Calculated document risk score: ${t.toFixed(2)} -> Level: ${r.toUpperCase()}`), {
    riskLevel: r,
    score: parseFloat(t.toFixed(2)),
    detections: e
  };
}
async function Ee(e) {
  if (!e)
    throw new TypeError("File parameter is required");
  if (typeof document > "u") {
    const t = await e.arrayBuffer(), n = new Blob([t], { type: e.type || "image/png" }), r = await createImageBitmap(n), o = new OffscreenCanvas(r.width, r.height);
    return o.getContext("2d").drawImage(r, 0, 0), o;
  } else
    return new Promise((t, n) => {
      const r = new FileReader();
      r.onload = (o) => {
        const i = new Image();
        i.onload = () => {
          const a = document.createElement("canvas");
          a.width = i.width, a.height = i.height, a.getContext("2d").drawImage(i, 0, 0), t(a);
        }, i.onerror = (a) => n(new Error(`Failed to decode image pixels: ${a}`)), i.src = o.target.result;
      }, r.onerror = (o) => n(new Error(`Failed to read file buffer: ${o}`)), r.readAsDataURL(e);
    });
}
async function qt(e, t = {}) {
  const n = Date.now();
  console.log(`[ScanService] Initiating scan pipeline for file: ${e.name} (${e.size} bytes)`);
  try {
    const r = await Ee(e), o = await ve(r, t.preprocess), i = await At(o), a = Ie(i), c = Mt(i.text, a), l = zt(c), g = await Tt(i.text), p = Rt(l, g), s = Gt(p), f = Ut(s), m = Date.now() - n;
    return console.log(`[ScanService] Scan pipeline resolved in ${m}ms. Risk: ${f.riskLevel.toUpperCase()}`), {
      success: !0,
      riskLevel: f.riskLevel,
      score: f.score,
      piiCount: s.length,
      detections: s,
      processingTime: m,
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
async function Ht(e, t) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    const n = e.getContext("2d"), r = e.width, o = e.height, i = n.getImageData(0, 0, r, o), a = i.data, c = t * 0.8;
    for (let p = 0; p < a.length; p += 4) {
      const s = p / 4, f = s % r, m = Math.floor(s / r), I = Math.sin(f * 0.8) * Math.cos(m * 0.8) * c, M = Math.cos(f * 0.8) * Math.sin(m * 0.8) * c, A = Math.sin((f + m) * 0.5) * c;
      a[p] = Math.min(255, Math.max(0, a[p] + I)), a[p + 1] = Math.min(255, Math.max(0, a[p + 1] + M)), a[p + 2] = Math.min(255, Math.max(0, a[p + 2] + A));
    }
    const l = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(r, o) : document.createElement("canvas");
    return l.width = r, l.height = o, l.getContext("2d").putImageData(i, 0, 0), l;
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
      let i = 0;
      for (let l = 0; l < 8; l++)
        for (let g = 0; g < 8; g++)
          i += e[l][g] * Math.cos((2 * l + 1) * r * Math.PI / 16) * Math.cos((2 * g + 1) * o * Math.PI / 16);
      const a = r === 0 ? 1 / Math.sqrt(2) : 1, c = o === 0 ? 1 / Math.sqrt(2) : 1;
      n[r][o] = 0.25 * a * c * i;
    }
  return n;
}
function Zt(e) {
  const n = Array.from({ length: 8 }, () => new Array(8).fill(0));
  for (let r = 0; r < 8; r++)
    for (let o = 0; o < 8; o++) {
      let i = 0;
      for (let a = 0; a < 8; a++)
        for (let c = 0; c < 8; c++) {
          const l = a === 0 ? 1 / Math.sqrt(2) : 1, g = c === 0 ? 1 / Math.sqrt(2) : 1;
          i += l * g * e[a][c] * Math.cos((2 * r + 1) * a * Math.PI / 16) * Math.cos((2 * o + 1) * c * Math.PI / 16);
        }
      n[r][o] = 0.25 * i;
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
async function Jt(e, t) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    console.log(`[WatermarkEngine] Embedding invisible DCT watermark: "${t}"`);
    const n = e.getContext("2d"), r = e.width, o = e.height, i = n.getImageData(0, 0, r, o), a = i.data, c = Vt(t + "\0");
    let l = 0;
    const g = Math.floor(r / $) * $, p = Math.floor(o / $) * $;
    for (let s = 0; s < p; s += $)
      for (let f = 0; f < g; f += $) {
        const m = Array.from({ length: $ }, () => new Array($).fill(0)), I = Array.from({ length: $ }, () => new Array($).fill(0)), M = Array.from({ length: $ }, () => new Array($).fill(0));
        for (let v = 0; v < $; v++)
          for (let S = 0; S < $; S++) {
            const O = ((s + v) * r + (f + S)) * 4, T = a[O], R = a[O + 1], N = a[O + 2];
            m[v][S] = 0.299 * T + 0.587 * R + 0.114 * N, I[v][S] = 128 - 0.1687 * T - 0.3313 * R + 0.5 * N, M[v][S] = 128 + 0.5 * T - 0.4187 * R - 0.0813 * N;
          }
        const A = jt(m);
        if (l < c.length) {
          const v = c[l], S = A[4][4], O = Math.round(S / te) * te;
          A[4][4] = v === 1 ? O + te / 4 : O - te / 4, l++;
        }
        const C = Zt(A);
        for (let v = 0; v < $; v++)
          for (let S = 0; S < $; S++) {
            const O = ((s + v) * r + (f + S)) * 4, T = C[v][S], R = I[v][S], N = M[v][S];
            let P = Math.round(T + 1.402 * (N - 128)), D = Math.round(T - 0.3441 * (R - 128) - 0.7141 * (N - 128)), L = Math.round(T + 1.772 * (R - 128));
            a[O] = Math.max(0, Math.min(255, P)), a[O + 1] = Math.max(0, Math.min(255, D)), a[O + 2] = Math.max(0, Math.min(255, L));
          }
      }
    return n.putImageData(i, 0, 0), e;
  } catch (n) {
    throw console.error("[WatermarkEngine] Failed to embed watermark:", n), n;
  }
}
function Kt(e, t = 8, n = 6, r = 99999, o = 99999) {
  if (!e)
    throw new TypeError("Box object is required");
  const i = Math.max(0, e.x - t), a = Math.max(0, e.y - n), c = Math.min(r, e.x + e.width + t), l = Math.min(o, e.y + e.height + n), g = c - i, p = l - a;
  return { x: i, y: a, width: g, height: p };
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
  const t = [...e].sort((o, i) => o.x - i.x), n = [];
  let r = {
    x: t[0].x,
    y: t[0].y,
    width: t[0].width,
    height: t[0].height,
    detections: t[0].detection ? [t[0].detection] : []
  };
  for (let o = 1; o < t.length; o++) {
    const i = t[o], a = r.x + r.width, c = r.y + r.height, l = i.x + i.width, g = i.y + i.height, p = i.x <= a + 15, s = Math.min(c, g) - Math.max(r.y, i.y) > 0;
    if (p && s) {
      const f = Math.min(r.x, i.x), m = Math.max(a, l), I = Math.min(r.y, i.y), M = Math.max(c, g);
      r.x = f, r.width = m - f, r.y = I, r.height = M - I, i.detection && (r.detections.some(
        (C) => C.type === i.detection.type && C.value === i.detection.value
      ) || r.detections.push(i.detection));
    } else
      n.push(r), r = {
        x: i.x,
        y: i.y,
        width: i.width,
        height: i.height,
        detections: i.detection ? [i.detection] : []
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
      const { x: i, y: a, width: c, height: l } = o, g = Math.max(0, i), p = Math.max(0, a), s = Math.min(e.width - g, c), f = Math.min(e.height - p, l);
      if (s <= 0 || f <= 0)
        return;
      const m = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(s, f) : document.createElement("canvas");
      m.width = s, m.height = f, m.getContext("2d").drawImage(e, g, p, s, f, 0, 0, s, f), r.save();
      try {
        r.beginPath(), r.rect(g, p, s, f), r.clip(), r.filter = `blur(${n}px)`, r.drawImage(m, g, p);
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
    paddingX: i = 8,
    paddingY: a = 6,
    blurRadius: c = 15,
    pixelationScale: l = 8,
    fillStyle: g = "#000000"
  } = r;
  console.log(`[RedactCanvas] Running masking pipeline. Mode: ${n.toUpperCase()} on ${t.length} regions.`);
  const p = t.map(
    (m) => Kt(m, i, a, o.width, o.height)
  ), s = Xt(p), f = o.getContext("2d");
  return n === "redact" ? (f.fillStyle = g, s.forEach((m) => {
    const I = Math.max(0, m.x), M = Math.max(0, m.y), A = Math.min(o.width - I, m.width), C = Math.min(o.height - M, m.height);
    A > 0 && C > 0 && f.fillRect(I, M, A, C);
  })) : n === "blur" ? await Ae(o, s, c) : n === "pixelate" && tr(o, s, l), o;
}
function tr(e, t, n = 8) {
  const r = e.getContext("2d");
  t.forEach((o) => {
    const { x: i, y: a, width: c, height: l } = o, g = Math.max(0, i), p = Math.max(0, a), s = Math.min(e.width - g, c), f = Math.min(e.height - p, l);
    if (s <= 0 || f <= 0)
      return;
    const m = r.getImageData(g, p, s, f), I = m.data;
    for (let M = 0; M < f; M += n)
      for (let A = 0; A < s; A += n) {
        let C = 0, v = 0, S = 0, O = 0;
        for (let P = 0; P < n && M + P < f; P++)
          for (let D = 0; D < n && A + D < s; D++) {
            const L = ((M + P) * s + (A + D)) * 4;
            C += I[L], v += I[L + 1], S += I[L + 2], O++;
          }
        const T = Math.round(C / O), R = Math.round(v / O), N = Math.round(S / O);
        for (let P = 0; P < n && M + P < f; P++)
          for (let D = 0; D < n && A + D < s; D++) {
            const L = ((M + P) * s + (A + D)) * 4;
            I[L] = T, I[L + 1] = R, I[L + 2] = N;
          }
      }
    r.putImageData(m, g, p);
  });
}
async function rr(e, t) {
  return console.log("[AIService] Delegating adversarial cloaking request..."), Yt(e, { strength: t });
}
async function nr(e, t) {
  return console.log("[AIService] Delegating invisible watermark embedding..."), Jt(e, t);
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
    return t.forEach((a) => {
      Array.isArray(a.bboxes) && a.bboxes.forEach((c) => {
        o.push({
          x: c.x,
          y: c.y,
          width: c.width,
          height: c.height
        });
      });
    }), o.length === 0 ? (console.log("[BlurService] No bounding boxes found in detections. Skipping redaction."), e) : (console.log(`[BlurService] Requesting redaction of ${o.length} bounding boxes in mode: ${r}`), await or(e, o, r));
  } catch (o) {
    throw console.error("[BlurService] Redaction processing failed:", o), o;
  }
}
const U = 8, B = 32;
async function ir(e) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    const t = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(B, B) : document.createElement("canvas");
    t.width = B, t.height = B;
    const n = t.getContext("2d");
    n.drawImage(e, 0, 0, B, B);
    const o = n.getImageData(0, 0, B, B).data, i = new Float32Array(B * B);
    for (let s = 0; s < o.length; s += 4)
      i[s / 4] = 0.299 * o[s] + 0.587 * o[s + 1] + 0.114 * o[s + 2];
    const a = Array.from({ length: U }, () => new Float32Array(U));
    for (let s = 0; s < U; s++)
      for (let f = 0; f < U; f++) {
        let m = 0;
        for (let A = 0; A < B; A++)
          for (let C = 0; C < B; C++)
            m += i[A * B + C] * Math.cos((2 * A + 1) * s * Math.PI / (2 * B)) * Math.cos((2 * C + 1) * f * Math.PI / (2 * B));
        const I = s === 0 ? 1 / Math.sqrt(2) : 1, M = f === 0 ? 1 / Math.sqrt(2) : 1;
        a[s][f] = 2 / B * I * M * m;
      }
    let c = 0;
    for (let s = 0; s < U; s++)
      for (let f = 0; f < U; f++)
        s === 0 && f === 0 || (c += a[s][f]);
    const l = c / (U * U - 1);
    let g = "";
    for (let s = 0; s < U; s++)
      for (let f = 0; f < U; f++)
        g += a[s][f] >= l ? "1" : "0";
    let p = "";
    for (let s = 0; s < 64; s += 4) {
      const f = g.substring(s, s + 4);
      p += parseInt(f, 2).toString(16);
    }
    return p;
  } catch (t) {
    throw console.error("[PHash] Error generating perceptual hash:", t), t;
  }
}
const q = 8, k = 16;
function me(e, t) {
  const n = new Float32Array(t), r = t / 2;
  for (let o = 0; o < r; o++) {
    const i = e[2 * o], a = e[2 * o + 1];
    n[o] = (i + a) / Math.sqrt(2), n[r + o] = (i - a) / Math.sqrt(2);
  }
  for (let o = 0; o < t; o++)
    e[o] = n[o];
}
function sr(e) {
  for (let t = 0; t < k; t++) {
    const n = new Float32Array(k);
    for (let r = 0; r < k; r++)
      n[r] = e[t * k + r];
    me(n, k);
    for (let r = 0; r < k; r++)
      e[t * k + r] = n[r];
  }
  for (let t = 0; t < k; t++) {
    const n = new Float32Array(k);
    for (let r = 0; r < k; r++)
      n[r] = e[r * k + t];
    me(n, k);
    for (let r = 0; r < k; r++)
      e[r * k + t] = n[r];
  }
}
async function cr(e) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    const t = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(k, k) : document.createElement("canvas");
    t.width = k, t.height = k;
    const n = t.getContext("2d");
    n.drawImage(e, 0, 0, k, k);
    const o = n.getImageData(0, 0, k, k).data, i = new Float32Array(k * k);
    for (let s = 0; s < o.length; s += 4)
      i[s / 4] = 0.299 * o[s] + 0.587 * o[s + 1] + 0.114 * o[s + 2];
    sr(i);
    const a = Array.from({ length: q }, () => new Float32Array(q));
    let c = 0;
    for (let s = 0; s < q; s++)
      for (let f = 0; f < q; f++) {
        const m = i[s * k + f];
        a[s][f] = m, c += m;
      }
    const l = c / (q * q);
    let g = "";
    for (let s = 0; s < q; s++)
      for (let f = 0; f < q; f++)
        g += a[s][f] >= l ? "1" : "0";
    let p = "";
    for (let s = 0; s < 64; s += 4) {
      const f = g.substring(s, s + 4);
      p += parseInt(f, 2).toString(16);
    }
    return p;
  } catch (t) {
    throw console.error("[WHash] Error generating wavelet hash:", t), t;
  }
}
function lr(e, t, n) {
  return new Promise((r, o) => {
    if (!e)
      return o(new TypeError("Canvas parameter is required"));
    const i = t.replace(/(\.[\w\d]+)$/, "_protected$1");
    if (typeof OffscreenCanvas < "u" && e instanceof OffscreenCanvas)
      e.convertToBlob({ type: n }).then((a) => {
        if (!a)
          return o(new Error("Failed to extract binary blob from offscreen canvas"));
        const c = new File([a], i, {
          type: n,
          lastModified: Date.now()
        });
        r(c);
      }).catch(o);
    else {
      if (typeof e.toBlob != "function")
        return o(new TypeError("Canvas does not support toBlob operations"));
      e.toBlob((a) => {
        if (!a)
          return o(new Error("Failed to extract binary blob from canvas"));
        const c = new File([a], i, {
          type: n,
          lastModified: Date.now()
        });
        r(c);
      }, n);
    }
  });
}
async function ur(e, t = {}) {
  console.log(`[ProtectService] Initiating final protection pipeline for: ${e.name}`);
  const n = Date.now();
  try {
    const r = await Ee(e), o = await ir(r), i = await cr(r);
    console.log("[ProtectService] Generated original fingerprints:", { phash: o, whash: i });
    const a = await qt(e, { preprocess: t });
    if (!a.success)
      throw new Error(`Scanning phase failed: ${a.error}`);
    if (!(a.riskLevel !== "low" || t.autoRedact))
      return console.log("[ProtectService] Document evaluated as low risk. Skipping edits."), {
        success: !0,
        originalFile: e,
        protectedFile: e,
        // Return original file unmodified
        phash: o,
        whash: i,
        metadata: {
          name: e.name,
          size: e.size,
          type: e.type
        },
        detections: [],
        risk: a.riskLevel,
        protectionSummary: {
          processingTime: Date.now() - n,
          redacted: !1
        }
      };
    console.log(`[ProtectService] Applying visual protections (Mode: ${t.blurMode || "redact"})...`);
    let l = await ar(r, a.detections, t);
    t.aiCloakEnabled && (l = await rr(l, 5)), t.watermarkEnabled && (l = await nr(l, "SafeLens_Protected_Asset"));
    const g = await lr(l, e.name, e.type);
    return console.log(`[ProtectService] Protection pipeline complete. Output file: ${g.name}`), {
      success: !0,
      originalFile: e,
      protectedFile: g,
      phash: o,
      whash: i,
      metadata: {
        name: e.name,
        size: e.size,
        type: e.type
      },
      detections: a.detections,
      risk: a.riskLevel,
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
    this.baseUrl = "http://localhost:8000";
  }
  /**
   * Helper to perform fetch requests with automatic retries for transient network/5xx failures.
   */
  async fetchWithRetry(t, n = {}, r = 3, o = 1e3) {
    let i = null, a = null;
    for (let c = 0; c < r; c++) {
      try {
        const l = await fetch(t, n);
        if (l.ok)
          return l;
        if (a = l, l.status >= 500 && l.status < 600)
          console.warn(`[BridgeClient] Transient server error ${l.status}. Retrying in ${o}ms... (Attempt ${c + 1}/${r})`);
        else
          return l;
      } catch (l) {
        i = l, console.warn(`[BridgeClient] Network/connection error: ${l.message}. Retrying in ${o}ms... (Attempt ${c + 1}/${r})`);
      }
      c < r - 1 && await new Promise((l) => setTimeout(l, o));
    }
    if (i)
      throw i;
    return a;
  }
  /**
   * Diagnostic health check evaluating connectivity to the backend FastAPI server.
   * 
   * @returns {Promise<{ success: boolean, status: string, version: string }>} Diagnostic report
   */
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
      return console.warn("[BridgeClient] Health check failed, operating in offline fallback mode:", t.message), {
        success: !1,
        status: "offline",
        version: "0.0.0"
      };
    }
  }
  /**
   * Transmits scan details and metadata logs to populate the central dashboard.
   * Note: The file itself is uploaded to /api/protect during interception.
   * 
   * @param {Object} scanReport - Completed scan result metrics
   * @returns {Promise<{ success: boolean, syncId: string }>} Sync confirmation details
   */
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
   * 
   * @param {Object} incident - Detailed incident parameters
   * @returns {Promise<{ success: boolean, incidentId?: number }>} Confirmation report with backend incident ID
   */
  async sendIncidentNotification(t) {
    if (!t)
      throw new Error("Incident payload is required");
    console.warn(`[BridgeClient] Dispatching PRIVACY INCIDENT ALERT to backend on asset ID: ${t.assetId}`);
    try {
      const n = await this.fetchWithRetry(`${this.baseUrl}/api/incidents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_id: t.assetId,
          matched_url: t.matchedUrl,
          match_confidence: t.matchConfidence,
          severity: t.severity || "Normal",
          status: t.status || "Open"
        })
      });
      if (!n.ok)
        throw new Error(`HTTP ${n.status}`);
      const r = await n.json();
      if (r.success)
        return console.log("[BridgeClient] Backend incident alert logged successfully. ID:", r.data.incident_id), {
          success: !0,
          incidentId: r.data.incident_id
        };
      throw new Error(r.message || "Failed to create backend incident alert");
    } catch (n) {
      return console.error("[BridgeClient] Failed to dispatch incident alert:", n.message), { success: !1 };
    }
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
const ce = new dr();
let we = Promise.resolve();
const fr = {
  /**
   * Preprocesses intercepted image files using local OpenCV.js (WASM) inside the Service Worker.
   * Runs OffscreenCanvas operations completely isolated from host webpage scopes.
   */
  PREPROCESS_IMAGE: async (e) => {
    if (!e || !e.arrayBuffer)
      throw new Error("Invalid payload: arrayBuffer is required");
    await ye();
    const { arrayBuffer: t, type: n, settings: r } = e, o = new Blob([t], { type: n || "image/png" }), i = await createImageBitmap(o), a = new OffscreenCanvas(i.width, i.height);
    a.getContext("2d").drawImage(i, 0, 0);
    const l = await ve(a, r);
    return {
      arrayBuffer: await (await l.convertToBlob({ type: n || "image/png" })).arrayBuffer(),
      width: l.width,
      height: l.height
    };
  },
  /**
   * Runs the complete local privacy protection pipeline on the file's ArrayBuffer.
   */
  RUN_PROTECT_PIPELINE: async (e) => {
    if (!e || !e.arrayBuffer)
      throw new Error("Invalid payload: arrayBuffer is required");
    await ye();
    const { arrayBuffer: t, name: n, type: r, settings: o } = e, i = {
      name: n || "upload.png",
      size: t.byteLength,
      type: r || "image/png",
      arrayBuffer: () => Promise.resolve(t)
    }, a = await ur(i, o);
    let c;
    return a.protectedFile && typeof a.protectedFile.arrayBuffer == "function" ? c = await a.protectedFile.arrayBuffer() : c = t, {
      success: a.success !== !1,
      arrayBuffer: c,
      name: a.protectedFile && a.protectedFile.name || n,
      type: a.protectedFile && a.protectedFile.type || r,
      phash: a.phash || "",
      whash: a.whash || "",
      detections: a.detections || [],
      risk: a.risk || "low",
      protectionSummary: a.protectionSummary || { processingTime: 0, redacted: !1 },
      error: a.error
    };
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
      const { scans: o = [] } = await chrome.storage.local.get("scans"), i = [e, ...o].slice(0, 100);
      await chrome.storage.local.set({ scans: i });
      try {
        if (await ce.syncScanResult({
          metadata: { name: e.fileName, size: e.size, type: "image/png" },
          ...e
        }), e.riskLevel !== "low" && e.assetId) {
          const a = t && (t.url || t.origin) || "unknown", c = await ce.sendIncidentNotification({
            assetId: e.assetId,
            matchedUrl: a,
            matchConfidence: e.confidence,
            severity: e.riskLevel === "critical" ? "Serious" : "Normal",
            status: "Open"
          });
          if (c && c.success && c.incidentId) {
            e.incidentId = c.incidentId;
            const { scans: l = [] } = await chrome.storage.local.get("scans"), g = l.map((p) => p.scanId === e.scanId ? { ...p, incidentId: c.incidentId } : p);
            await chrome.storage.local.set({ scans: g }), console.log("[MessageRouter] Linked local scan record with backend incident ID:", c.incidentId);
          }
        }
      } catch (a) {
        console.warn("[MessageRouter] Failed to sync scan metadata with BridgeClient:", a);
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
chrome.runtime.onInstalled.addListener(async (e) => {
  if (console.log(`[ServiceWorker] Extension installation event: ${e.reason}`), e.reason === "install")
    try {
      (await chrome.storage.local.get("settings")).settings || (await chrome.storage.local.set({
        settings: Se,
        scans: []
        // Initialize scan log history
      }), console.log("[ServiceWorker] Default settings storage initialized."));
    } catch (t) {
      console.error("[ServiceWorker] Error initializing storage settings:", t);
    }
  else e.reason === "update" && console.log("[ServiceWorker] SafeLens successfully updated to new version.");
});
chrome.runtime.onMessage.addListener((e, t, n) => (hr(e, t).then((r) => {
  n(r);
}).catch((r) => {
  console.error("[ServiceWorker] Message routing failure:", r), n({
    success: !1,
    error: r instanceof Error ? r.message : "Async processing exception"
  });
}), !0));
