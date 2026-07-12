import { vi } from 'vitest';

// 1. Mock Chrome API
global.chrome = {
  storage: {
    local: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }
  },
  runtime: {
    sendMessage: vi.fn(() => Promise.resolve({ success: true, data: { success: true } })),
    getURL: vi.fn((path) => `chrome-extension://mock-id/${path}`),
  }
};

// 2. Mock Canvas 2D Context
class MockCanvasRenderingContext2D {
  constructor(canvas) {
    this.canvas = canvas;
    this.filter = 'none';
    this.fillStyle = '#000000';
    this.imgData = new Float32Array(canvas.width * canvas.height * 4);
    this.imgData.fill(128); // Default to solid gray canvas pixels (prevents clipping)
  }
  save() {}
  restore() {}
  beginPath() {}
  rect() {}
  clip() {}
  fillRect() {}
  drawImage() {}
  putImageData(imgData, x, y) {
    if (!this.imgData || this.imgData.length !== imgData.data.length) {
      this.imgData = new Float32Array(imgData.data.length);
    }
    this.imgData.set(imgData.data);
  }
  getImageData(x, y, w, h) {
    const expectedSize = w * h * 4;
    if (!this.imgData || this.imgData.length !== expectedSize) {
      this.imgData = new Float32Array(expectedSize);
      this.imgData.fill(128);
    }
    return {
      data: this.imgData,
      width: w,
      height: h
    };
  }
}

// 3. Mock Canvas and OffscreenCanvas
class MockCanvas {
  constructor(w = 100, h = 100) {
    this.width = w;
    this.height = h;
  }
  getContext(type) {
    if (type === '2d') {
      if (!this.ctx) {
        this.ctx = new MockCanvasRenderingContext2D(this);
      }
      return this.ctx;
    }
    return null;
  }
  toBlob(callback, type) {
    callback(new Blob(['mock-blob-data'], { type: type || 'image/png' }));
  }
  convertToBlob(options) {
    return Promise.resolve(new Blob(['mock-blob-data'], { type: options?.type || 'image/png' }));
  }
}

global.HTMLCanvasElement = MockCanvas;
global.OffscreenCanvas = MockCanvas;
global.document = {
  createElement: vi.fn((type) => {
    if (type === 'canvas') return new MockCanvas();
    return {};
  }),
  getElementById: vi.fn(() => null),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  }
};

global.window = {
  document: global.document
};

// Mock ImageData
global.ImageData = class ImageData {
  constructor(data, width, height) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
};

// Mock Image
global.Image = class Image {
  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 10);
  }
};

// Mock FileReader
global.FileReader = class FileReader {
  readAsDataURL(file) {
    setTimeout(() => {
      if (this.onload) {
        this.onload({
          target: { result: 'data:image/png;base64,mockbase64data' }
        });
      }
    }, 10);
  }
};

// Mock createImageBitmap
global.createImageBitmap = vi.fn(() => Promise.resolve({
  width: 200,
  height: 200,
  close() {}
}));

// Mock cv (OpenCV.js WASM global)
global.cv = {
  matFromImageData: vi.fn(() => ({
    delete: vi.fn(),
    cols: 200,
    rows: 200,
    data: new Uint8Array(200 * 200 * 4),
  })),
  Mat: class Mat {
    constructor() {
      this.cols = 200;
      this.rows = 200;
      this.data = new Uint8Array(200 * 200 * 4);
    }
    delete() {}
  },
  Size: class Size {
    constructor(w, h) {
      this.width = w;
      this.height = h;
    }
  },
  Point: class Point {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
  },
  resize: vi.fn(),
  cvtColor: vi.fn(),
  GaussianBlur: vi.fn(),
  Canny: vi.fn(),
  HoughLinesP: vi.fn((edges, lines) => {
    lines.rows = 5;
    lines.data32S = new Int32Array([
      10, 20, 100, 20, // line 1 (horizontal skew ~0)
      10, 25, 100, 25,
      10, 30, 100, 30,
      10, 35, 100, 35,
      10, 40, 100, 40
    ]);
  }),
  getRotationMatrix2D: vi.fn(() => new global.cv.Mat()),
  warpAffine: vi.fn(),
  adaptiveThreshold: vi.fn(),
  COLOR_RGBA2GRAY: 1,
  COLOR_GRAY2RGBA: 2,
  INTER_AREA: 3,
  INTER_CUBIC: 4,
  BORDER_REPLICATE: 5,
  BORDER_DEFAULT: 6,
  ADAPTIVE_THRESH_GAUSSIAN_C: 7,
  THRESH_BINARY: 8
};
