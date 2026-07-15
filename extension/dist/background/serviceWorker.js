const Oe = {
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
async function De(e, t = 1920, n = 1080) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let r = null, o = null;
  try {
    let { width: a, height: i } = e, s = !1;
    if (a > t && (i = Math.round(i * t / a), a = t, s = !0), i > n && (a = Math.round(a * n / i), i = n, s = !0), !s)
      return e;
    if (console.log(`[Resize] Scaling image down to ${a}x${i} using cv.resize`), typeof cv > "u" || !cv.matFromImageData)
      throw new Error("OpenCV.js runtime is not loaded");
    const f = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height);
    r = cv.matFromImageData(f), o = new cv.Mat();
    const w = new cv.Size(a, i);
    cv.resize(r, o, w, 0, 0, cv.INTER_AREA);
    const c = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(a, i) : document.createElement("canvas");
    c.width = a, c.height = i;
    const g = c.getContext("2d", { willReadFrequently: !0 }), m = new ImageData(new Uint8ClampedArray(o.data), o.cols, o.rows);
    return g.putImageData(m, 0, 0), c;
  } catch (a) {
    console.warn("[Resize] OpenCV resizing failed. Falling back to native canvas context scaling:", a);
    try {
      const { width: i, height: s } = e;
      let l = i, f = s;
      l > t && (f = Math.round(f * t / l), l = t), f > n && (l = Math.round(l * n / f), f = n);
      const w = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(l, f) : document.createElement("canvas");
      w.width = l, w.height = f;
      const c = w.getContext("2d", { willReadFrequently: !0 });
      return c.imageSmoothingEnabled = !0, c.imageSmoothingQuality = "high", c.drawImage(e, 0, 0, l, f), w;
    } catch (i) {
      return console.error("[Resize] Native canvas resizing fallback failed. Returning original image.", i), e;
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
    const a = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(a), n = new cv.Mat(), cv.cvtColor(t, n, cv.COLOR_RGBA2GRAY), r = new cv.Mat(), cv.cvtColor(n, r, cv.COLOR_GRAY2RGBA);
    const i = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    i.width = e.width, i.height = e.height;
    const s = i.getContext("2d", { willReadFrequently: !0 }), l = new ImageData(new Uint8ClampedArray(r.data), r.cols, r.rows);
    return s.putImageData(l, 0, 0), i;
  } catch (o) {
    console.warn("[Grayscale] OpenCV conversion failed. Falling back to native JS luminosity conversions:", o);
    try {
      const i = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height), s = i.data;
      for (let f = 0; f < s.length; f += 4) {
        const w = s[f], c = s[f + 1], g = s[f + 2], m = Math.round(0.299 * w + 0.587 * c + 0.114 * g);
        s[f] = m, s[f + 1] = m, s[f + 2] = m;
      }
      const l = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
      return l.width = e.width, l.height = e.height, l.getContext("2d", { willReadFrequently: !0 }).putImageData(i, 0, 0), l;
    } catch (a) {
      return console.error("[Grayscale] JS grayscale fallback failed. Returning original image.", a), e;
    }
  } finally {
    t && t.delete(), n && n.delete(), r && r.delete();
  }
}
async function Pe(e) {
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
    const s = i.getContext("2d", { willReadFrequently: !0 }), l = new ImageData(new Uint8ClampedArray(n.data), n.cols, n.rows);
    return s.putImageData(l, 0, 0), i;
  } catch (r) {
    return console.warn("[Denoise] Denoising failed. Skipping this stage and returning original canvas:", r), e;
  } finally {
    t && t.delete(), n && n.delete();
  }
}
async function _e(e) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  let t = null, n = null, r = null, o = null, a = null, i = null;
  try {
    if (typeof cv > "u" || !cv.HoughLinesP)
      throw new Error("OpenCV.js runtime is not loaded");
    const l = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height);
    t = cv.matFromImageData(l), n = new cv.Mat(), r = new cv.Mat(), o = new cv.Mat(), cv.cvtColor(t, n, cv.COLOR_RGBA2GRAY), cv.Canny(n, r, 50, 200, 3), cv.HoughLinesP(r, o, 1, Math.PI / 180, 100, 50, 10);
    let f = 0, w = 0;
    for (let b = 0; b < o.rows; ++b) {
      const v = o.data32S[b * 4], A = o.data32S[b * 4 + 1], M = o.data32S[b * 4 + 2], O = o.data32S[b * 4 + 3], T = Math.atan2(O - A, M - v) * (180 / Math.PI);
      T > -45 && T < 45 && (f += T, w++);
    }
    if (w < 3)
      return console.log("[Deskew] Insufficient line segments detected. Skipping deskew."), { canvas: e, angle: 0 };
    const c = f / w;
    if (Math.abs(c) < 0.5)
      return console.log(`[Deskew] Skew angle is negligible (${c.toFixed(2)} deg). Skipping rotation.`), { canvas: e, angle: 0 };
    console.log(`[Deskew] Correcting skew angle: ${c.toFixed(2)} degrees`);
    const g = new cv.Point(e.width / 2, e.height / 2);
    i = cv.getRotationMatrix2D(g, c, 1), a = new cv.Mat();
    const m = new cv.Size(e.width, e.height);
    cv.warpAffine(t, a, i, m, cv.INTER_CUBIC, cv.BORDER_REPLICATE);
    const C = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    C.width = e.width, C.height = e.height;
    const k = C.getContext("2d", { willReadFrequently: !0 }), S = new ImageData(new Uint8ClampedArray(a.data), a.cols, a.rows);
    return k.putImageData(S, 0, 0), { canvas: C, angle: c };
  } catch (s) {
    return console.warn("[Deskew] Hough deskewing failed. Skipping this stage and returning original canvas:", s), { canvas: e, angle: 0 };
  } finally {
    t && t.delete(), n && n.delete(), r && r.delete(), o && o.delete(), a && a.delete(), i && i.delete();
  }
}
async function Le(e, t = 127) {
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
    const l = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
    l.width = e.width, l.height = e.height;
    const f = l.getContext("2d", { willReadFrequently: !0 }), w = new ImageData(new Uint8ClampedArray(a.data), a.cols, a.rows);
    return f.putImageData(w, 0, 0), l;
  } catch (i) {
    console.warn("[Threshold] OpenCV adaptive thresholding failed. Falling back to grayscale image:", i);
    try {
      return await Be(e);
    } catch (s) {
      return console.error("[Threshold] Grayscale fallback failed. Returning original canvas.", s), e;
    }
  } finally {
    n && n.delete(), r && r.delete(), o && o.delete(), a && a.delete();
  }
}
async function Be(e) {
  const n = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height), r = n.data;
  for (let a = 0; a < r.length; a += 4) {
    const i = Math.round(0.299 * r[a] + 0.587 * r[a + 1] + 0.114 * r[a + 2]);
    r[a] = i, r[a + 1] = i, r[a + 2] = i;
  }
  const o = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
  return o.width = e.width, o.height = e.height, o.getContext("2d", { willReadFrequently: !0 }).putImageData(n, 0, 0), o;
}
let X = null;
async function Fe() {
  const e = "public/offscreen.html";
  (await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"], documentUrls: [chrome.runtime.getURL(e)] })).length > 0 || (X && await X, X = chrome.offscreen.createDocument({
    url: e,
    reasons: ["DOM_SCRAPING"],
    justification: "OpenCV image preprocessing"
  }), await X, X = null);
}
async function Ee(e, t) {
  return await Fe(), new Promise((n, r) => {
    const o = chrome.runtime.connect({ name: "offscreen-channel" }), a = setTimeout(() => {
      o.disconnect(), r(new Error("Offscreen Timeout"));
    }, 3e4);
    o.onMessage.addListener((s) => {
      clearTimeout(a), o.disconnect(), s.success ? n(s.data) : r(new Error(s.error));
    });
    const i = t.data instanceof ArrayBuffer ? [t.data] : [];
    o.postMessage({ type: e, payload: t }, i);
  });
}
async function Ie(e, t = {}) {
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
    return s = await De(s, a, i), s = await Te(s), n && (s = await Pe(s)), r && (s = (await _e(s)).canvas), o > 0 && (s = await Le(s, o)), s;
  } catch (l) {
    return console.error("[Preprocessor] Pipeline failure, returning raw.", l), e;
  }
}
var $e = { exports: {} };
(function(e) {
  var t = function(n) {
    var r = Object.prototype, o = r.hasOwnProperty, a = Object.defineProperty || function(d, u, h) {
      d[u] = h.value;
    }, i, s = typeof Symbol == "function" ? Symbol : {}, l = s.iterator || "@@iterator", f = s.asyncIterator || "@@asyncIterator", w = s.toStringTag || "@@toStringTag";
    function c(d, u, h) {
      return Object.defineProperty(d, u, {
        value: h,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }), d[u];
    }
    try {
      c({}, "");
    } catch {
      c = function(u, h, y) {
        return u[h] = y;
      };
    }
    function g(d, u, h, y) {
      var p = u && u.prototype instanceof A ? u : A, I = Object.create(p.prototype), L = new Z(y || []);
      return a(I, "_invoke", { value: oe(d, h, L) }), I;
    }
    n.wrap = g;
    function m(d, u, h) {
      try {
        return { type: "normal", arg: d.call(u, h) };
      } catch (y) {
        return { type: "throw", arg: y };
      }
    }
    var C = "suspendedStart", k = "suspendedYield", S = "executing", b = "completed", v = {};
    function A() {
    }
    function M() {
    }
    function O() {
    }
    var T = {};
    c(T, l, function() {
      return this;
    });
    var $ = Object.getPrototypeOf, P = $ && $($(x([])));
    P && P !== r && o.call(P, l) && (T = P);
    var D = O.prototype = A.prototype = Object.create(T);
    M.prototype = O, a(D, "constructor", { value: O, configurable: !0 }), a(
      O,
      "constructor",
      { value: M, configurable: !0 }
    ), M.displayName = c(
      O,
      w,
      "GeneratorFunction"
    );
    function _(d) {
      ["next", "throw", "return"].forEach(function(u) {
        c(d, u, function(h) {
          return this._invoke(u, h);
        });
      });
    }
    n.isGeneratorFunction = function(d) {
      var u = typeof d == "function" && d.constructor;
      return u ? u === M || // For the native GeneratorFunction constructor, the best we can
      // do is to check its .name property.
      (u.displayName || u.name) === "GeneratorFunction" : !1;
    }, n.mark = function(d) {
      return Object.setPrototypeOf ? Object.setPrototypeOf(d, O) : (d.__proto__ = O, c(d, w, "GeneratorFunction")), d.prototype = Object.create(D), d;
    }, n.awrap = function(d) {
      return { __await: d };
    };
    function Y(d, u) {
      function h(I, L, N, q) {
        var G = m(d[I], d, L);
        if (G.type === "throw")
          q(G.arg);
        else {
          var ie = G.arg, K = ie.value;
          return K && typeof K == "object" && o.call(K, "__await") ? u.resolve(K.__await).then(function(H) {
            h("next", H, N, q);
          }, function(H) {
            h("throw", H, N, q);
          }) : u.resolve(K).then(function(H) {
            ie.value = H, N(ie);
          }, function(H) {
            return h("throw", H, N, q);
          });
        }
      }
      var y;
      function p(I, L) {
        function N() {
          return new u(function(q, G) {
            h(I, L, q, G);
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
      a(this, "_invoke", { value: p });
    }
    _(Y.prototype), c(Y.prototype, f, function() {
      return this;
    }), n.AsyncIterator = Y, n.async = function(d, u, h, y, p) {
      p === void 0 && (p = Promise);
      var I = new Y(
        g(d, u, h, y),
        p
      );
      return n.isGeneratorFunction(u) ? I : I.next().then(function(L) {
        return L.done ? L.value : I.next();
      });
    };
    function oe(d, u, h) {
      var y = C;
      return function(I, L) {
        if (y === S)
          throw new Error("Generator is already running");
        if (y === b) {
          if (I === "throw")
            throw L;
          return E();
        }
        for (h.method = I, h.arg = L; ; ) {
          var N = h.delegate;
          if (N) {
            var q = Q(N, h);
            if (q) {
              if (q === v) continue;
              return q;
            }
          }
          if (h.method === "next")
            h.sent = h._sent = h.arg;
          else if (h.method === "throw") {
            if (y === C)
              throw y = b, h.arg;
            h.dispatchException(h.arg);
          } else h.method === "return" && h.abrupt("return", h.arg);
          y = S;
          var G = m(d, u, h);
          if (G.type === "normal") {
            if (y = h.done ? b : k, G.arg === v)
              continue;
            return {
              value: G.arg,
              done: h.done
            };
          } else G.type === "throw" && (y = b, h.method = "throw", h.arg = G.arg);
        }
      };
    }
    function Q(d, u) {
      var h = u.method, y = d.iterator[h];
      if (y === i)
        return u.delegate = null, h === "throw" && d.iterator.return && (u.method = "return", u.arg = i, Q(d, u), u.method === "throw") || h !== "return" && (u.method = "throw", u.arg = new TypeError(
          "The iterator does not provide a '" + h + "' method"
        )), v;
      var p = m(y, d.iterator, u.arg);
      if (p.type === "throw")
        return u.method = "throw", u.arg = p.arg, u.delegate = null, v;
      var I = p.arg;
      if (!I)
        return u.method = "throw", u.arg = new TypeError("iterator result is not an object"), u.delegate = null, v;
      if (I.done)
        u[d.resultName] = I.value, u.next = d.nextLoc, u.method !== "return" && (u.method = "next", u.arg = i);
      else
        return I;
      return u.delegate = null, v;
    }
    _(D), c(D, w, "Generator"), c(D, l, function() {
      return this;
    }), c(D, "toString", function() {
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
    n.keys = function(d) {
      var u = Object(d), h = [];
      for (var y in u)
        h.push(y);
      return h.reverse(), function p() {
        for (; h.length; ) {
          var I = h.pop();
          if (I in u)
            return p.value = I, p.done = !1, p;
        }
        return p.done = !0, p;
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
          var h = -1, y = function p() {
            for (; ++h < d.length; )
              if (o.call(d, h))
                return p.value = d[h], p.done = !1, p;
            return p.value = i, p.done = !0, p;
          };
          return y.next = y;
        }
      }
      return { next: E };
    }
    n.values = x;
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
        function h(q, G) {
          return I.type = "throw", I.arg = d, u.next = q, G && (u.method = "next", u.arg = i), !!G;
        }
        for (var y = this.tryEntries.length - 1; y >= 0; --y) {
          var p = this.tryEntries[y], I = p.completion;
          if (p.tryLoc === "root")
            return h("end");
          if (p.tryLoc <= this.prev) {
            var L = o.call(p, "catchLoc"), N = o.call(p, "finallyLoc");
            if (L && N) {
              if (this.prev < p.catchLoc)
                return h(p.catchLoc, !0);
              if (this.prev < p.finallyLoc)
                return h(p.finallyLoc);
            } else if (L) {
              if (this.prev < p.catchLoc)
                return h(p.catchLoc, !0);
            } else if (N) {
              if (this.prev < p.finallyLoc)
                return h(p.finallyLoc);
            } else
              throw new Error("try statement without catch or finally");
          }
        }
      },
      abrupt: function(d, u) {
        for (var h = this.tryEntries.length - 1; h >= 0; --h) {
          var y = this.tryEntries[h];
          if (y.tryLoc <= this.prev && o.call(y, "finallyLoc") && this.prev < y.finallyLoc) {
            var p = y;
            break;
          }
        }
        p && (d === "break" || d === "continue") && p.tryLoc <= u && u <= p.finallyLoc && (p = null);
        var I = p ? p.completion : {};
        return I.type = d, I.arg = u, p ? (this.method = "next", this.next = p.finallyLoc, v) : this.complete(I);
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
            return this.complete(h.completion, h.afterLoc), V(h), v;
        }
      },
      catch: function(d) {
        for (var u = this.tryEntries.length - 1; u >= 0; --u) {
          var h = this.tryEntries[u];
          if (h.tryLoc === d) {
            var y = h.completion;
            if (y.type === "throw") {
              var p = y.arg;
              V(h);
            }
            return p;
          }
        }
        throw new Error("illegal catch attempt");
      },
      delegateYield: function(d, u, h) {
        return this.delegate = {
          iterator: x(d),
          resultName: u,
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
})($e);
var Se = (e, t) => `${e}-${t}-${Math.random().toString(16).slice(3, 8)}`;
const Ne = Se;
let de = 0;
var Ge = ({
  id: e,
  action: t,
  payload: n = {}
}) => {
  let r = e;
  return typeof r > "u" && (r = Ne("Job", de), de += 1), {
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
function qe(e) {
  throw new Error('Could not dynamically require "' + e + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var ze = (e) => {
  const t = {};
  return typeof WorkerGlobalScope < "u" ? t.type = "webworker" : typeof document == "object" ? t.type = "browser" : typeof process == "object" && typeof qe == "function" && (t.type = "node"), typeof e > "u" ? t : t[e];
};
const Ue = ze("type") === "browser", We = Ue ? (e) => new URL(e, window.location.href).href : (e) => e;
var He = (e) => {
  const t = { ...e };
  return ["corePath", "workerPath", "langPath"].forEach((n) => {
    e[n] && (t[n] = We(t[n]));
  }), t;
}, je = {
  TESSERACT_ONLY: 0,
  LSTM_ONLY: 1,
  TESSERACT_LSTM_COMBINED: 2,
  DEFAULT: 3
};
const Ye = "7.0.0", Ve = {
  version: Ye
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
  let n;
  if (Blob && URL && t) {
    const r = new Blob([`importScripts("${e}");`], {
      type: "application/javascript"
    });
    n = new Worker(URL.createObjectURL(r));
  } else
    n = new Worker(e);
  return n;
}, et = (e) => {
  e.terminate();
}, tt = (e, t) => {
  e.onmessage = ({ data: n }) => {
    t(n);
  };
}, rt = async (e, t) => {
  e.postMessage(t);
};
const se = (e) => new Promise((t, n) => {
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
        t = await se(r), n();
      });
    });
  else if (typeof OffscreenCanvas < "u" && e instanceof OffscreenCanvas) {
    const n = await e.convertToBlob();
    t = await se(n);
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
const dt = He, z = Ge, { log: fe } = ne, ft = Se, j = je, {
  defaultOptions: ht,
  spawnWorker: gt,
  terminateWorker: wt,
  onMessage: mt,
  loadImage: he,
  send: pt
} = ut;
let ge = 0;
var Ae = async (e = "eng", t = j.LSTM_ONLY, n = {}, r = {}) => {
  const o = ft("Worker", ge), {
    logger: a,
    errorHandler: i,
    ...s
  } = dt({
    ...ht,
    ...n
  }), l = {}, f = typeof e == "string" ? e.split("+") : e;
  let w = t, c = r;
  const g = [j.DEFAULT, j.LSTM_ONLY].includes(t) && !s.legacyCore;
  let m, C;
  const k = new Promise((x, E) => {
    C = x, m = E;
  }), S = (x) => {
    m(x.message);
  };
  let b = gt(s);
  b.onerror = S, ge += 1;
  const v = ({ id: x, action: E, payload: d }) => new Promise((u, h) => {
    fe(`[${o}]: Start ${x}, action=${E}`);
    const y = `${E}-${x}`;
    l[y] = { resolve: u, reject: h }, pt(b, {
      workerId: o,
      jobId: x,
      action: E,
      payload: d
    });
  }), A = () => console.warn("`load` is depreciated and should be removed from code (workers now come pre-loaded)"), M = (x) => v(z({
    id: x,
    action: "load",
    payload: { options: { lstmOnly: g, corePath: s.corePath, logging: s.logging } }
  })), O = (x, E, d) => v(z({
    id: d,
    action: "FS",
    payload: { method: "writeFile", args: [x, E] }
  })), T = (x, E) => v(z({
    id: E,
    action: "FS",
    payload: { method: "readFile", args: [x, { encoding: "utf8" }] }
  })), $ = (x, E) => v(z({
    id: E,
    action: "FS",
    payload: { method: "unlink", args: [x] }
  })), P = (x, E, d) => v(z({
    id: d,
    action: "FS",
    payload: { method: x, args: E }
  })), D = (x, E) => v(z({
    id: E,
    action: "loadLanguage",
    payload: {
      langs: x,
      options: {
        langPath: s.langPath,
        dataPath: s.dataPath,
        cachePath: s.cachePath,
        cacheMethod: s.cacheMethod,
        gzip: s.gzip,
        lstmOnly: [j.DEFAULT, j.LSTM_ONLY].includes(w) && !s.legacyLang
      }
    }
  })), _ = (x, E, d, u) => v(z({
    id: u,
    action: "initialize",
    payload: { langs: x, oem: E, config: d }
  })), Y = (x = "eng", E, d, u) => {
    if (g && [j.TESSERACT_ONLY, j.TESSERACT_LSTM_COMBINED].includes(E)) throw Error("Legacy model requested but code missing.");
    const h = E || w;
    w = h;
    const y = d || c;
    c = y;
    const I = (typeof x == "string" ? x.split("+") : x).filter((L) => !f.includes(L));
    return f.push(...I), I.length > 0 ? D(I, u).then(() => _(x, h, y, u)) : _(x, h, y, u);
  }, oe = (x = {}, E) => v(z({
    id: E,
    action: "setParameters",
    payload: { params: x }
  })), Q = async (x, E = {}, d = {
    text: !0
  }, u) => v(z({
    id: u,
    action: "recognize",
    payload: { image: await he(x), options: E, output: d }
  })), ae = async (x, E) => {
    if (g) throw Error("`worker.detect` requires Legacy model, which was not loaded.");
    return v(z({
      id: E,
      action: "detect",
      payload: { image: await he(x) }
    }));
  }, V = async () => (b !== null && (wt(b), b = null), Promise.resolve());
  mt(b, ({
    workerId: x,
    jobId: E,
    status: d,
    action: u,
    data: h
  }) => {
    const y = `${u}-${E}`;
    if (d === "resolve")
      fe(`[${x}]: Complete ${E}`), l[y].resolve({ jobId: E, data: h }), delete l[y];
    else if (d === "reject")
      if (l[y].reject(h), delete l[y], u === "load" && m(h), i)
        i(h);
      else
        throw Error(h);
    else d === "progress" && a({ ...h, userJobId: E });
  });
  const Z = {
    id: o,
    worker: b,
    load: A,
    writeText: O,
    readText: T,
    removeFile: $,
    FS: P,
    reinitialize: Y,
    setParameters: oe,
    recognize: Q,
    detect: ae,
    terminate: V
  };
  return M().then(() => D(e)).then(() => _(e, t, r)).then(() => C(Z)).catch(() => {
  }), k;
};
const Re = Ae, yt = async (e, t, n) => {
  const r = await Re(t, 1, n);
  return r.recognize(e).finally(async () => {
    await r.terminate();
  });
}, vt = async (e, t) => {
  const n = await Re("osd", 0, t);
  return n.detect(e).finally(async () => {
    await n.terminate();
  });
};
var Ct = {
  recognize: yt,
  detect: vt
};
const xt = Ae, bt = Ct;
var Et = {
  createWorker: xt,
  ...bt
};
let ce = null, J = null, we = Promise.resolve();
async function It(e = "eng") {
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
        tessedit_create_hocr: "1",
        tessedit_create_tsv: "1"
      }), ce = t, t;
    } catch (t) {
      throw console.error("[TesseractWorker] Failed to create worker:", t), J = null, t;
    }
  })(), J);
}
async function St(e) {
  let t;
  const n = new Promise((r) => {
    we.then(() => r());
  });
  we = new Promise((r) => {
    t = r;
  }), await n;
  try {
    return await (await It()).recognize(e, { tessjs_create_hocr: "1", tessjs_create_tsv: "1" });
  } finally {
    t();
  }
}
function At(e) {
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
function Rt(e) {
  const t = new Uint8Array(e);
  let n = "";
  const r = 8192;
  for (let o = 0; o < t.length; o += r)
    n += String.fromCharCode.apply(null, t.subarray(o, o + r));
  return btoa(n);
}
async function Mt(e) {
  try {
    if (typeof document > "u" && typeof chrome < "u" && chrome.offscreen) {
      if (!e.width || !e.height)
        throw new Error(`[RecognizeImage] Canvas dimensions are invalid (W:${e.width}, H:${e.height}) before OCR.`);
      const t = await e.convertToBlob({ type: "image/png" });
      if (!t || t.size === 0)
        throw new Error("[RecognizeImage] Canvas conversion to Blob failed (size: 0) before OCR.");
      const n = await t.arrayBuffer(), r = Rt(n);
      console.log(`[Pre-OCR Diagnostic] Sending image to OCR. Canvas W:${e.width}, H:${e.height}. Base64 sample: ${r.substring(0, 50)}... Total Length: ${r.length}`);
      const o = await Ee("RECOGNIZE_IMAGE", {
        width: e.width,
        height: e.height,
        base64Data: r
      });
      if (console.log(`[RecognizeImage] Received from Offscreen. Words count: ${o?.words?.length || 0}`), !o.text && (!o.words || o.words.length === 0))
        throw new Error("[RecognizeImage] OCR returned completely empty text and words array.");
      return {
        text: o.text || "",
        words: o.words || [],
        boundingBoxes: o.words || [],
        // Mapping words as boxes
        confidence: 0
      };
    } else {
      console.log("[RecognizeImage] Starting Tesseract OCR process...");
      const t = await St(e), n = t.data || t;
      let r = n.words || [];
      r.length === 0 && n.blocks && n.blocks.forEach((a) => {
        a.paragraphs?.forEach((i) => {
          i.lines?.forEach((s) => {
            s.words && r.push(...s.words);
          });
        });
      });
      const o = At({ ...n, words: r });
      return {
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
const kt = {
  // 🚀 FUZZY MATCHING: Uses Negative Lookbehinds/Lookaheads instead of strict \b boundaries.
  // This allows detection even if the text is surrounded by brackets, quotes, or OCR artifacts.
  EMAIL: /(?<![a-zA-Z0-9])[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?![a-zA-Z0-9])/g,
  PHONE: /(?<!\d)(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)/g,
  AADHAAR: /(?<!\d)(\d{4}[-\s]?\d{4}[-\s]?\d{4})(?!\d)/g,
  PAN: /(?<![A-Z0-9])([A-Z]{5}[0-9]{4}[A-Z])(?![A-Z0-9])/g,
  PASSPORT: /(?<![A-Z0-9])([A-Z][0-9]{7})(?![A-Z0-9])/g,
  CREDIT_CARD: /(?<!\d)((?:\d[ -]*?){13,19})(?!\d)/g,
  UPI_ID: /(?<![a-zA-Z0-9.\-_])[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}(?![a-zA-Z0-9])/g
}, me = (e) => (e || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
function Ot(e, t = []) {
  if (!e) return [];
  console.log("[RegexDetector] Inspecting first 3 wordBoxes structure:", t.slice(0, 3));
  const n = [];
  let r = 0;
  const o = t.map((a) => {
    const i = (a.text || a.word || a.value || a.content || "").toString();
    let s = -1, l = -1;
    return i && (s = e.indexOf(i, r), s !== -1 && (l = s + i.length, r = l)), {
      box: Dt(a),
      text: i,
      norm: me(i),
      start: s,
      end: l
    };
  });
  for (const [a, i] of Object.entries(kt)) {
    i.lastIndex = 0;
    let s;
    for (; (s = i.exec(e)) !== null; ) {
      const l = s[1] || s[0], f = me(l), w = s.index, c = s.index + s[0].length;
      let g = [];
      const m = o.filter((C) => C.start !== -1 && C.start < c && C.end > w);
      m.length > 0 ? g = m.map((C) => C.box) : g = o.filter((C) => C.norm.length > 0 && (f.includes(C.norm) || C.norm.includes(f))).map((C) => C.box), g.length === 0 ? console.warn(`[RegexDetector] Mapping FAILED for: "${l}". Regex found it in text, but couldn't link it to boxes.`) : console.log(`[RegexDetector] SUCCESS: Mapped "${l}" to ${g.length} bounding boxes.`), n.push({
        type: a,
        value: l,
        bboxes: g,
        source: "regex"
      });
    }
  }
  return n;
}
function Dt(e) {
  const t = e.bbox || e;
  return {
    x: t.x !== void 0 ? t.x : t.x0 || 0,
    y: t.y !== void 0 ? t.y : t.y0 || 0,
    width: t.width !== void 0 ? t.width : (t.x1 || 0) - (t.x0 || 0),
    height: t.height !== void 0 ? t.height : (t.y1 || 0) - (t.y0 || 0),
    confidence: e.confidence || 100
  };
}
function pe(e) {
  if (!Array.isArray(e) || e.length <= 1) return e;
  const t = [...e].sort((o, a) => o.x - a.x), n = [];
  let r = t[0];
  for (let o = 1; o < t.length; o++) {
    const a = t[o], i = r.y + r.height, s = a.y + a.height, l = Math.min(i, s) - Math.max(r.y, a.y), f = a.x - (r.x + r.width);
    if (l > 0 && f <= 150) {
      const w = Math.min(r.x, a.x), c = Math.min(r.y, a.y), g = Math.max(r.x + r.width, a.x + a.width), m = Math.max(i, s);
      r = {
        x: w,
        y: c,
        width: g - w,
        height: m - c,
        confidence: Math.max(r.confidence || 100, a.confidence || 100)
      };
    } else
      n.push(r), r = a;
  }
  return n.push(r), n;
}
function Tt(e) {
  if (!Array.isArray(e) || e.length === 0) return [];
  const n = e.map((a) => ({
    ...a,
    bboxes: pe(a.bboxes || [])
  })).sort((a, i) => (a.startIndex || 0) - (i.startIndex || 0)), r = [];
  if (n.length === 0) return [];
  let o = n[0];
  for (let a = 1; a < n.length; a++) {
    const i = n[a], s = o.endIndex || 0;
    (i.startIndex || 0) <= s + 5 ? o = {
      ...o,
      endIndex: Math.max(s, i.endIndex || 0),
      bboxes: pe([...o.bboxes || [], ...i.bboxes || []])
    } : (r.push(o), o = i);
  }
  return r.push(o), r;
}
const ye = {
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
}, Pt = {
  critical: 10,
  high: 5,
  medium: 2,
  low: 1
};
function _t(e) {
  if (!Array.isArray(e) || e.length === 0)
    return {
      riskLevel: "low",
      score: 0,
      detections: []
    };
  let t = 0, n = !1;
  e.forEach((o) => {
    const a = o.severity || ye[o.type] || ye.DEFAULT, i = Pt[a] || 2, s = typeof o.fusedConfidence == "number" ? o.fusedConfidence : 0.8;
    t += i * s, a === "critical" && s >= 0.5 && (n = !0);
  });
  let r = "low";
  return n || t >= 8 ? r = "critical" : t >= 4 ? r = "high" : t >= 2 && (r = "medium"), console.log(`[RiskAnalyzer] Calculated document risk score: ${t.toFixed(2)} -> Level: ${r.toUpperCase()}`), {
    riskLevel: r,
    score: parseFloat(t.toFixed(2)),
    detections: e
  };
}
async function Lt(e) {
  return !e || e.trim().length === 0 ? { topic: "Unknown", confidence: 0 } : new Promise((t, n) => {
    chrome.runtime.sendMessage({
      target: "offscreen",
      type: "CLASSIFY_TEXT",
      payload: { text: e.substring(0, 512) }
      // Reduced slightly to optimize single-thread CPU execution
    }, (r) => {
      if (chrome.runtime.lastError)
        return console.warn("[Classifier] Extension runtime error:", chrome.runtime.lastError.message), t({ topic: "Unknown", confidence: 0 });
      if (!r || !r.success || !r.result)
        return console.warn("[Classifier] Remote classification failed, using fallback."), t({ topic: "Unknown", confidence: 0 });
      try {
        const o = Array.isArray(r.result) ? r.result : [r.result];
        if (o.length > 0 && o[0]) {
          const a = o[0];
          t({
            topic: a.label || "Unknown",
            confidence: a.score || 0
          });
        } else
          t({ topic: "Unknown", confidence: 0 });
      } catch (o) {
        console.error("[Classifier] Parsing result crashed:", o), t({ topic: "Unknown", confidence: 0 });
      }
    });
  });
}
const Bt = {
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
function Ft(e, t) {
  const o = e.map((l) => {
    let f = typeof l.ocrConfidence == "number" ? l.ocrConfidence : 0.5, w = typeof l.regexConfidence == "number" ? l.regexConfidence : 0.8;
    l.rulePassed === !1 && (console.warn(`[ConfidenceFusion] Rule validation failed for [${l.type}]. Keeping for safety.`), f *= 0.1, w *= 0.1);
    let c = 0.7 * w + 0.3 * f;
    return c = Math.min(1, Math.max(0, c)), {
      ...l,
      fusedConfidence: parseFloat(c.toFixed(4)),
      severity: Bt[l.type] || "medium"
    };
  }), i = ["Government ID", "Financial Statement", "Medical Record", "Passport", "Aadhaar Card", "PAN Card"].includes(t.topic), s = i ? t.confidence : 0;
  return {
    fusedDetections: o,
    semanticContext: {
      topic: t.topic,
      confidence: t.confidence,
      isSensitive: i
    },
    finalGlobalScore: (o.length > 0 ? 0.9 : 0.1) * 0.6 + s * 0.4
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
      }, r.readAsDataURL(e);
    });
}
async function $t(e, t) {
  if (typeof document < "u" || !chrome.offscreen) return Ie(e, t);
  const r = e.getContext("2d", { willReadFrequently: !0 }).getImageData(0, 0, e.width, e.height), o = new Uint8Array(r.data.buffer);
  let a = "";
  const i = 8192;
  for (let m = 0; m < o.length; m += i) a += String.fromCharCode.apply(null, o.subarray(m, m + i));
  const s = btoa(a), l = await Ee("PREPROCESS_IMAGE", { width: e.width, height: e.height, base64Data: s, options: t });
  if (!l || !l.base64Data) throw new Error("Offscreen preprocessing failed.");
  const f = atob(l.base64Data), w = new Uint8Array(f.length);
  for (let m = 0; m < f.length; m++) w[m] = f.charCodeAt(m);
  const c = new OffscreenCanvas(l.width, l.height);
  return c.getContext("2d", { willReadFrequently: !0 }).putImageData(new ImageData(new Uint8ClampedArray(w.buffer), l.width, l.height), 0, 0), c;
}
async function Nt(e, t = {}) {
  const n = Date.now();
  try {
    const r = await Me(e), o = await $t(r, t.preprocess), a = await Mt(o), i = Tt(Ot(a.text, a.words)), l = [...Ft(i, await Lt(a.text)).fusedDetections], f = _t(l);
    return { success: !0, detections: l, riskLevel: f.riskLevel, processingTime: Date.now() - n };
  } catch (r) {
    return console.error("[ScanService] Pipeline failed:", r), { success: !1, detections: [], error: r.message };
  }
}
function Gt(e) {
  const n = Array.from({ length: 8 }, () => new Array(8).fill(0));
  for (let r = 0; r < 8; r++)
    for (let o = 0; o < 8; o++) {
      let a = 0;
      for (let l = 0; l < 8; l++)
        for (let f = 0; f < 8; f++)
          a += e[l][f] * Math.cos((2 * l + 1) * r * Math.PI / 16) * Math.cos((2 * f + 1) * o * Math.PI / 16);
      const i = r === 0 ? 1 / Math.sqrt(2) : 1, s = o === 0 ? 1 / Math.sqrt(2) : 1;
      n[r][o] = 0.25 * i * s * a;
    }
  return n;
}
function qt(e) {
  const n = Array.from({ length: 8 }, () => new Array(8).fill(0));
  for (let r = 0; r < 8; r++)
    for (let o = 0; o < 8; o++) {
      let a = 0;
      for (let i = 0; i < 8; i++)
        for (let s = 0; s < 8; s++) {
          const l = i === 0 ? 1 / Math.sqrt(2) : 1, f = s === 0 ? 1 / Math.sqrt(2) : 1;
          a += l * f * e[i][s] * Math.cos((2 * r + 1) * i * Math.PI / 16) * Math.cos((2 * o + 1) * s * Math.PI / 16);
        }
      n[r][o] = 0.25 * a;
    }
  return n;
}
const B = 8, ee = 20;
function zt(e) {
  const t = [];
  for (let n = 0; n < e.length; n++) {
    const r = e.charCodeAt(n);
    for (let o = 7; o >= 0; o--)
      t.push(r >> o & 1);
  }
  return t;
}
async function Ut(e, t) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    console.log(`[WatermarkEngine] Embedding invisible DCT watermark: "${t}"`);
    const n = e.getContext("2d", { willReadFrequently: !0 }), r = e.width, o = e.height, a = n.getImageData(0, 0, r, o), i = a.data, s = zt(t + "\0");
    let l = 0;
    const f = Math.floor(r / B) * B, w = Math.floor(o / B) * B;
    for (let c = 0; c < w; c += B)
      for (let g = 0; g < f; g += B) {
        const m = Array.from({ length: B }, () => new Array(B).fill(0)), C = Array.from({ length: B }, () => new Array(B).fill(0)), k = Array.from({ length: B }, () => new Array(B).fill(0));
        for (let v = 0; v < B; v++)
          for (let A = 0; A < B; A++) {
            const M = ((c + v) * r + (g + A)) * 4, O = i[M], T = i[M + 1], $ = i[M + 2];
            m[v][A] = 0.299 * O + 0.587 * T + 0.114 * $, C[v][A] = 128 - 0.1687 * O - 0.3313 * T + 0.5 * $, k[v][A] = 128 + 0.5 * O - 0.4187 * T - 0.0813 * $;
          }
        const S = Gt(m);
        if (l < s.length) {
          const v = s[l], A = S[4][4], M = Math.round(A / ee) * ee;
          S[4][4] = v === 1 ? M + ee / 4 : M - ee / 4, l++;
        }
        const b = qt(S);
        for (let v = 0; v < B; v++)
          for (let A = 0; A < B; A++) {
            const M = ((c + v) * r + (g + A)) * 4, O = b[v][A], T = C[v][A], $ = k[v][A];
            let P = Math.round(O + 1.402 * ($ - 128)), D = Math.round(O - 0.3441 * (T - 128) - 0.7141 * ($ - 128)), _ = Math.round(O + 1.772 * (T - 128));
            i[M] = Math.max(0, Math.min(255, P)), i[M + 1] = Math.max(0, Math.min(255, D)), i[M + 2] = Math.max(0, Math.min(255, _));
          }
      }
    return n.putImageData(a, 0, 0), e;
  } catch (n) {
    throw console.error("[WatermarkEngine] Failed to embed watermark:", n), n;
  }
}
function Wt(e, t = 8, n = 6, r = 99999, o = 99999) {
  if (!e)
    throw new TypeError("Box object is required");
  const a = Math.max(0, e.x - t), i = Math.max(0, e.y - n), s = Math.min(r, e.x + e.width + t), l = Math.min(o, e.y + e.height + n), f = s - a, w = l - i;
  return { x: a, y: i, width: f, height: w };
}
function Ht(e) {
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
    const a = t[o], i = r.x + r.width, s = r.y + r.height, l = a.x + a.width, f = a.y + a.height, w = a.x <= i + 15, c = Math.min(s, f) - Math.max(r.y, a.y) > 0;
    if (w && c) {
      const g = Math.min(r.x, a.x), m = Math.max(i, l), C = Math.min(r.y, a.y), k = Math.max(s, f);
      r.x = g, r.width = m - g, r.y = C, r.height = k - C, a.detection && (r.detections.some(
        (b) => b.type === a.detection.type && b.value === a.detection.value
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
      const { x: a, y: i, width: s, height: l } = o, f = Math.max(0, a), w = Math.max(0, i), c = Math.min(e.width - f, s), g = Math.min(e.height - w, l);
      if (c <= 0 || g <= 0)
        return;
      const m = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(c, g) : document.createElement("canvas");
      m.width = c, m.height = g, m.getContext("2d", { willReadFrequently: !0 }).drawImage(e, f, w, c, g, 0, 0, c, g), r.save();
      try {
        r.beginPath(), r.rect(f, w, c, g), r.clip(), r.filter = `blur(${n}px)`, r.drawImage(m, f, w);
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
function jt(e) {
  const n = typeof OffscreenCanvas < "u" && e instanceof OffscreenCanvas ? new OffscreenCanvas(e.width, e.height) : document.createElement("canvas");
  return n.width = e.width, n.height = e.height, n.getContext("2d", { willReadFrequently: !0 }).drawImage(e, 0, 0), n;
}
async function Yt(e, t, n = "redact", r = {}) {
  if (!e)
    throw new TypeError("Canvas parameter is required");
  const o = jt(e);
  if (!Array.isArray(t) || t.length === 0)
    return o;
  const {
    paddingX: a = 8,
    paddingY: i = 6,
    blurRadius: s = 15,
    pixelationScale: l = 8,
    fillStyle: f = "#000000"
  } = r;
  console.log(`[RedactCanvas] Running masking pipeline. Mode: ${n.toUpperCase()} on ${t.length} regions.`);
  const w = t.map(
    (m) => Wt(m, a, i, o.width, o.height)
  ), c = Ht(w), g = o.getContext("2d", { willReadFrequently: !0 });
  return n === "redact" ? (g.fillStyle = f, c.forEach((m) => {
    const C = Math.max(0, m.x), k = Math.max(0, m.y), S = Math.min(o.width - C, m.width), b = Math.min(o.height - k, m.height);
    S > 0 && b > 0 && g.fillRect(C, k, S, b);
  })) : n === "blur" ? await ke(o, c, s) : n === "pixelate" && Vt(o, c, l), o;
}
function Vt(e, t, n = 8) {
  const r = e.getContext("2d", { willReadFrequently: !0 });
  t.forEach((o) => {
    const { x: a, y: i, width: s, height: l } = o, f = Math.max(0, a), w = Math.max(0, i), c = Math.min(e.width - f, s), g = Math.min(e.height - w, l);
    if (c <= 0 || g <= 0)
      return;
    const m = r.getImageData(f, w, c, g), C = m.data;
    for (let k = 0; k < g; k += n)
      for (let S = 0; S < c; S += n) {
        let b = 0, v = 0, A = 0, M = 0;
        for (let P = 0; P < n && k + P < g; P++)
          for (let D = 0; D < n && S + D < c; D++) {
            const _ = ((k + P) * c + (S + D)) * 4;
            b += C[_], v += C[_ + 1], A += C[_ + 2], M++;
          }
        const O = Math.round(b / M), T = Math.round(v / M), $ = Math.round(A / M);
        for (let P = 0; P < n && k + P < g; P++)
          for (let D = 0; D < n && S + D < c; D++) {
            const _ = ((k + P) * c + (S + D)) * 4;
            C[_] = O, C[_ + 1] = T, C[_ + 2] = $;
          }
      }
    r.putImageData(m, f, w);
  });
}
async function Zt(e, t) {
  return console.log("[AIService] Delegating invisible watermark embedding..."), Ut(e, t);
}
async function Kt(e, t, n = "redact") {
  return console.log(`[AIService] Delegating redaction request (mode: ${n}) for ${t.length} regions.`), n === "blur" ? ke(e, t, 8) : Yt(e, t, "redact", { fillStyle: "#000000" });
}
async function Xt(e, t, n = {}) {
  const { blurMode: r = "redact" } = n, o = 800, a = 3e4, i = 80;
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    if (!Array.isArray(t) || t.length === 0)
      return e;
    const s = [];
    return t.forEach((f) => {
      const w = ["AADHAAR", "PAN", "QR_CODE"].includes(f.type) || f.severity === "critical";
      Array.isArray(f.bboxes) && f.bboxes.forEach((c) => {
        const g = c.width * c.height;
        c && typeof c.x == "number" && typeof c.width == "number" && // 🚀 THE ULTIMATE FIX: Critical items bypass ALL constraints, including hardcoded width/height
        (w || c.width > 20) && (w || c.height > 10) && (w || c.height <= i) && (w || g >= o) && (w || g <= a) ? s.push({
          x: c.x,
          y: c.y,
          width: c.width,
          height: c.height
        }) : console.log(`[BlurService] Ignored invalid/oversized/tiny box: ${c.width}x${c.height} (Type: ${f.type})`);
      });
    }), s.length === 0 ? (console.log("[BlurService] No valid bounding boxes found. Skipping redaction."), e) : (console.log(`[BlurService] Requesting redaction of ${s.length} geometric-verified boxes in mode: ${r}`), await Kt(e, s, r));
  } catch (s) {
    throw console.error("[BlurService] Redaction processing failed:", s), s;
  }
}
const U = 8, F = 32;
async function Jt(e) {
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
        let m = 0;
        for (let S = 0; S < F; S++)
          for (let b = 0; b < F; b++)
            m += a[S * F + b] * Math.cos((2 * S + 1) * c * Math.PI / (2 * F)) * Math.cos((2 * b + 1) * g * Math.PI / (2 * F));
        const C = c === 0 ? 1 / Math.sqrt(2) : 1, k = g === 0 ? 1 / Math.sqrt(2) : 1;
        i[c][g] = 2 / F * C * k * m;
      }
    let s = 0;
    for (let c = 0; c < U; c++)
      for (let g = 0; g < U; g++)
        c === 0 && g === 0 || (s += i[c][g]);
    const l = s / (U * U - 1);
    let f = "";
    for (let c = 0; c < U; c++)
      for (let g = 0; g < U; g++)
        f += i[c][g] >= l ? "1" : "0";
    let w = "";
    for (let c = 0; c < 64; c += 4) {
      const g = f.substring(c, c + 4);
      w += parseInt(g, 2).toString(16);
    }
    return w;
  } catch (t) {
    throw console.error("[PHash] Error generating perceptual hash:", t), t;
  }
}
const W = 8, R = 16;
function ve(e, t) {
  const n = new Float32Array(t), r = t / 2;
  for (let o = 0; o < r; o++) {
    const a = e[2 * o], i = e[2 * o + 1];
    n[o] = (a + i) / Math.sqrt(2), n[r + o] = (a - i) / Math.sqrt(2);
  }
  for (let o = 0; o < t; o++)
    e[o] = n[o];
}
function Qt(e) {
  for (let t = 0; t < R; t++) {
    const n = new Float32Array(R);
    for (let r = 0; r < R; r++)
      n[r] = e[t * R + r];
    ve(n, R);
    for (let r = 0; r < R; r++)
      e[t * R + r] = n[r];
  }
  for (let t = 0; t < R; t++) {
    const n = new Float32Array(R);
    for (let r = 0; r < R; r++)
      n[r] = e[r * R + t];
    ve(n, R);
    for (let r = 0; r < R; r++)
      e[r * R + t] = n[r];
  }
}
async function er(e) {
  try {
    if (!e)
      throw new TypeError("Canvas parameter is required");
    const t = typeof OffscreenCanvas < "u" ? new OffscreenCanvas(R, R) : document.createElement("canvas");
    t.width = R, t.height = R;
    const n = t.getContext("2d", { willReadFrequently: !0 });
    n.drawImage(e, 0, 0, R, R);
    const o = n.getImageData(0, 0, R, R).data, a = new Float32Array(R * R);
    for (let c = 0; c < o.length; c += 4)
      a[c / 4] = 0.299 * o[c] + 0.587 * o[c + 1] + 0.114 * o[c + 2];
    Qt(a);
    const i = Array.from({ length: W }, () => new Float32Array(W));
    let s = 0;
    for (let c = 0; c < W; c++)
      for (let g = 0; g < W; g++) {
        const m = a[c * R + g];
        i[c][g] = m, s += m;
      }
    const l = s / (W * W);
    let f = "";
    for (let c = 0; c < W; c++)
      for (let g = 0; g < W; g++)
        f += i[c][g] >= l ? "1" : "0";
    let w = "";
    for (let c = 0; c < 64; c += 4) {
      const g = f.substring(c, c + 4);
      w += parseInt(g, 2).toString(16);
    }
    return w;
  } catch (t) {
    throw console.error("[WHash] Error generating wavelet hash:", t), t;
  }
}
function tr(e, t, n) {
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
async function rr(e, t = {}) {
  console.log(`[ProtectService] Initiating final protection pipeline for: ${e.name}`);
  const n = Date.now();
  try {
    const r = await Me(e), o = await Jt(r), a = await er(r);
    console.log("[ProtectService] Generated original fingerprints:", { phash: o, whash: a });
    const i = await Nt(e, { preprocess: t });
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
    let l = await Xt(r, i.detections, t);
    t.aiCloakEnabled && (l = await adversarialCloak(l, 5)), t.watermarkEnabled && (l = await Zt(l, "SafeLens_Protected_Asset"));
    const f = await tr(l, e.name, e.type);
    return console.log(`[ProtectService] Protection pipeline complete. Output file: ${f.name}`), {
      success: !0,
      originalFile: e,
      protectedFile: f,
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
class nr {
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
const te = new nr();
let Ce = Promise.resolve();
function xe(e) {
  if (!e) return "";
  const t = new Uint8Array(e);
  let n = "";
  for (let r = 0; r < t.length; r++)
    n += String.fromCharCode(t[r]);
  return btoa(n);
}
function re(e) {
  if (!e) return new ArrayBuffer(0);
  const t = atob(e), n = t.length, r = new Uint8Array(n);
  for (let o = 0; o < n; o++)
    r[o] = t.charCodeAt(o);
  return r.buffer;
}
const or = {
  PING: async () => (console.log("[MessageRouter] PING message received. Sending PING response."), { ok: !0 }),
  PREPROCESS_IMAGE: async (e) => {
    if (!e || !e.arrayBuffer)
      throw new Error("Invalid payload: arrayBuffer is required");
    await be();
    const { arrayBuffer: t, type: n, settings: r } = e, o = new Blob([t], { type: n || "image/png" }), a = await createImageBitmap(o), i = new OffscreenCanvas(a.width, a.height);
    i.getContext("2d", { willReadFrequently: !0 }).drawImage(a, 0, 0);
    const l = await Ie(i, r);
    return {
      arrayBuffer: await (await l.convertToBlob({ type: n || "image/png" })).arrayBuffer(),
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
      const f = await chrome.storage.local.get(e.storageKey), w = f ? f[e.storageKey] : null;
      typeof w == "string" ? t = re(w) : (w && w.byteLength || w && typeof w == "object") && (t = w), t && t.byteLength > 0 && await chrome.storage.local.remove(e.storageKey);
    }
    if (!t || !t.byteLength)
      throw new Error("Invalid or corrupted image arrayBuffer received in pipeline gateway");
    const n = "pending_image_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    await chrome.storage.local.set({ [n]: xe(t) });
    const { name: r, type: o, settings: a } = e;
    await be();
    const i = {
      name: r || "upload.png",
      size: t.byteLength,
      type: o || "image/png",
      arrayBuffer: () => Promise.resolve(t)
    }, s = await rr(i, a);
    await chrome.storage.local.remove(n);
    let l;
    return s.protectedFile && typeof s.protectedFile.arrayBuffer == "function" ? l = await s.protectedFile.arrayBuffer() : l = t, {
      success: s.success !== !1,
      base64Data: xe(l),
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
      t = re(e.base64Data);
    else if (e.storageKey) {
      const a = await chrome.storage.local.get(e.storageKey), i = a ? a[e.storageKey] : null;
      typeof i == "string" ? t = re(i) : i && i.byteLength && (t = i), t && await chrome.storage.local.remove(e.storageKey);
    }
    if (!t || !t.byteLength)
      throw new Error("Image data not found or corrupted in background session allocation room");
    const n = new Blob([t], { type: e.type || "image/png" }), r = new File([n], e.name || "upload.png", { type: e.type || "image/png" });
    return console.log("[MessageRouter] Dispatching isolated proxy upload process via BridgeClient framework..."), await te.uploadProtectedAsset(r, {
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
    let n;
    const r = new Promise((o) => {
      Ce.then(() => o());
    });
    Ce = new Promise((o) => {
      n = o;
    }), await r;
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
            const f = await chrome.storage.local.get("scans"), c = (f && f.scans ? f.scans : []).map((g) => g.scanId === e.scanId ? { ...g, incidentId: l.incidentId } : g);
            await chrome.storage.local.set({ scans: c }), console.log("[MessageRouter] Linked local scan record with backend incident ID:", l.incidentId);
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
async function be() {
  if (!(typeof document > "u" && typeof chrome < "u" && chrome.offscreen) && !(typeof cv < "u" && cv.matFromImageData))
    return new Promise((e, t) => {
      let n = 0;
      const r = setInterval(() => {
        n++, typeof cv < "u" && cv.matFromImageData ? (clearInterval(r), e()) : n > 50 && (clearInterval(r), t(new Error("OpenCV.js WASM compilation timed out (5s)")));
      }, 100);
    });
}
async function ar(e, t) {
  try {
    if (!e || typeof e != "object")
      return { success: !1, error: "Malformed message: Message must be an object" };
    const { type: n, payload: r } = e;
    if (!n || typeof n != "string")
      return { success: !1, error: "Malformed message: Missing type property" };
    console.log(`[MessageRouter] Routing message type: ${n}`, { senderId: t.id, origin: t.origin });
    const o = or[n];
    return o ? { success: !0, data: await o(r, t) } : (console.warn(`[MessageRouter] Unknown message type: ${n}`), { success: !1, error: `Unknown message type: '${n}'` });
  } catch (n) {
    return console.error("[MessageRouter] Error routing message:", n), {
      success: !1,
      error: n instanceof Error ? n.message : "Internal background processing error"
    };
  }
}
chrome.runtime.onInstalled.addListener(async (e) => {
  console.log(`[ServiceWorker] Extension installation event: ${e.reason}`), e.reason === "install" && ((await chrome.storage.local.get("settings")).settings || await chrome.storage.local.set({ settings: Oe, scans: [] }));
});
chrome.runtime.onMessage.addListener((e, t, n) => {
  const r = (o) => {
    try {
      n(o);
    } catch (a) {
      console.error("Channel dead:", a);
    }
  };
  return ar(e, t).then(r).catch((o) => {
    console.error("[ServiceWorker] Routing failure:", o), r({ success: !1, error: o.message });
  }), !0;
});
