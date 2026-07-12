import { describe, it, expect, vi, beforeEach } from 'vitest';
import { routeMessage } from '../src/background/messageRouter.js';
import { interceptUpload } from '../src/content/uploadInterceptor.js';
import { bridgeClient } from '../src/communication/bridgeClient.js';

// Mock decisionPopup UI
vi.mock('../src/content/decisionPopup.js', () => ({
  showDecisionPopup: vi.fn(() => Promise.resolve('protect'))
}));

// Mock protectService
vi.mock('../src/services/protectService.js', () => ({
  protectImagePipeline: vi.fn((file, settings) => {
    return Promise.resolve({
      success: true,
      originalFile: file,
      protectedFile: {
        name: 'secured.png',
        size: 500,
        type: 'image/png',
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(500))
      },
      phash: '1234567890abcdef',
      whash: 'abcdef1234567890',
      risk: 'high',
      detections: [{ type: 'EMAIL', fusedConfidence: 0.95 }],
      protectionSummary: { processingTime: 120, redacted: true }
    });
  }),
  canvasToFile: vi.fn()
}));

describe('SafeLens Production Audit Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset chrome storage mocked operations
    chrome.storage.local.get.mockReset();
    chrome.storage.local.set.mockReset();
    chrome.runtime.sendMessage.mockReset();
  });

  // 1. Service Worker Pipeline Execution Test
  it('should route RUN_PROTECT_PIPELINE and return serialized ArrayBuffer from Service Worker', async () => {
    const payload = {
      arrayBuffer: new ArrayBuffer(100),
      name: 'input.png',
      type: 'image/png',
      settings: {}
    };

    const response = await routeMessage({ type: 'RUN_PROTECT_PIPELINE', payload }, {});
    expect(response.success).toBe(true);
    expect(response.data.success).toBe(true);
    expect(response.data.arrayBuffer).toBeInstanceOf(ArrayBuffer);
    expect(response.data.name).toBe('secured.png');
    expect(response.data.phash).toBe('1234567890abcdef');
  });

  // 2. Concurrent LOG_SCAN Storage Atomicity Test
  it('should execute concurrent LOG_SCAN requests sequentially without losing scan history', async () => {
    let mockStorageScans = [];
    
    chrome.storage.local.get.mockImplementation(async () => {
      // Simulate slight delay to mimic async storage read
      await new Promise(resolve => setTimeout(resolve, 5));
      return { scans: mockStorageScans };
    });
    
    chrome.storage.local.set.mockImplementation(async (data) => {
      if (data.scans) {
        mockStorageScans = data.scans;
      }
      return Promise.resolve();
    });

    // Mock bridge client calls
    const originalSync = bridgeClient.syncScanResult;
    const originalSend = bridgeClient.sendIncidentNotification;
    bridgeClient.syncScanResult = vi.fn(() => Promise.resolve({ success: true }));
    bridgeClient.sendIncidentNotification = vi.fn(() => Promise.resolve({ success: true, incidentId: 100 }));

    try {
      // Dispatch 3 concurrent LOG_SCAN message routing promises
      const scan1 = { type: 'LOG_SCAN', payload: { scanId: 's1', fileName: 'f1.png', size: 10, riskLevel: 'low' } };
      const scan2 = { type: 'LOG_SCAN', payload: { scanId: 's2', fileName: 'f2.png', size: 20, riskLevel: 'low' } };
      const scan3 = { type: 'LOG_SCAN', payload: { scanId: 's3', fileName: 'f3.png', size: 30, riskLevel: 'low' } };

      await Promise.all([
        routeMessage(scan1, {}),
        routeMessage(scan2, {}),
        routeMessage(scan3, {})
      ]);

      // All 3 scans must exist in storage, proving no scan history loss occurred
      expect(mockStorageScans.length).toBe(3);
      const scanIds = mockStorageScans.map(s => s.scanId);
      expect(scanIds).toContain('s1');
      expect(scanIds).toContain('s2');
      expect(scanIds).toContain('s3');
    } finally {
      bridgeClient.syncScanResult = originalSync;
      bridgeClient.sendIncidentNotification = originalSend;
    }
  });

  // 3. Multiple Parallel Uploads Test
  it('should coordinate multiple parallel file uploads through the SW messaging channel', async () => {
    const file1 = { name: 'file1.png', size: 1000, type: 'image/png', arrayBuffer: () => Promise.resolve(new ArrayBuffer(1000)) };
    const file2 = { name: 'file2.png', size: 2000, type: 'image/png', arrayBuffer: () => Promise.resolve(new ArrayBuffer(2000)) };
    const files = [file1, file2];
    const metadata = [
      { name: 'file1.png', size: 1000, type: 'image/png' },
      { name: 'file2.png', size: 2000, type: 'image/png' }
    ];

    chrome.storage.local.get.mockImplementation(() => Promise.resolve({
      settings: { protectionEnabled: true, autoProtect: true }
    }));

    chrome.runtime.sendMessage.mockImplementation((msg, callback) => {
      if (msg.type === 'RUN_PROTECT_PIRETUNE' || msg.type === 'RUN_PROTECT_PIPELINE') {
        const response = {
          success: true,
          data: {
            arrayBuffer: new ArrayBuffer(500),
            name: msg.payload.name.replace('.png', '_protected.png'),
            type: 'image/png',
            phash: 'hash1',
            whash: 'hash2',
            risk: 'high',
            detections: [],
            protectionSummary: { processingTime: 50, redacted: true }
          }
        };
        if (callback) callback(response);
        return Promise.resolve(response);
      }
      return Promise.resolve({ success: true });
    });

    const onApproval = vi.fn();
    await interceptUpload(files, metadata, null, onApproval);

    expect(onApproval).toHaveBeenCalled();
    const approvedFiles = onApproval.mock.calls[0][0];
    expect(approvedFiles.length).toBe(2);
    expect(approvedFiles[0].name).toBe('file1_protected.png');
    expect(approvedFiles[1].name).toBe('file2_protected.png');
  });

  // 4. bridgeClient Retry Behavior Test
  it('should retry only up to limit and re-throw / return last result without a 4th call', async () => {
    let callCount = 0;
    const originalFetch = global.fetch;

    global.fetch = vi.fn(() => {
      callCount++;
      return Promise.reject(new TypeError('Failed to fetch'));
    });

    try {
      await expect(bridgeClient.fetchWithRetry('http://mock/endpoint', {}, 3, 5))
        .rejects.toThrow('Failed to fetch');

      expect(callCount).toBe(3);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
