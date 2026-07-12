import { describe, it, expect, vi, beforeEach } from 'vitest';
import { routeMessage } from '../src/background/messageRouter.js';

// Mock dependency imports in messageRouter
vi.mock('../src/ai/preprocessing/preprocessImage.js', () => ({
  preprocessImage: vi.fn((canvas, settings) => Promise.resolve(canvas))
}));

vi.mock('../src/services/protectService.js', () => ({
  protectImagePipeline: vi.fn((file, settings) => Promise.resolve({
    success: true,
    risk: 'low'
  }))
}));

describe('Background Message Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return error response if message structure is invalid', async () => {
    const response = await routeMessage(null, {});
    expect(response.success).toBe(false);
    expect(response.error).toContain('Malformed message');
  });

  it('should route GET_SETTINGS and GET storage options successfully', async () => {
    chrome.storage.local.get.mockImplementationOnce(() => Promise.resolve({
      settings: { protectionEnabled: true }
    }));

    const response = await routeMessage({ type: 'GET_SETTINGS' }, {});
    expect(response.success).toBe(true);
    expect(response.data.protectionEnabled).toBe(true);
  });

  it('should route SET_SETTINGS and store settings successfully', async () => {
    const payload = { protectionEnabled: false };
    const response = await routeMessage({ type: 'SET_SETTINGS', payload }, {});
    
    expect(response.success).toBe(true);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings: payload });
  });

  it('should route LOG_SCAN and append logs to storage history', async () => {
    chrome.storage.local.get.mockImplementationOnce(() => Promise.resolve({
      scans: [{ scanId: '1' }]
    }));

    const payload = { scanId: '2', fileName: 'test.png', size: 100, riskLevel: 'low', status: 'passed' };
    const response = await routeMessage({ type: 'LOG_SCAN', payload }, {});

    expect(response.success).toBe(true);
    expect(chrome.storage.local.set).toHaveBeenCalled();
  });

  it('should return error response for unregistered message types', async () => {
    const response = await routeMessage({ type: 'UNKNOWN_ACTION' }, {});
    expect(response.success).toBe(false);
    expect(response.error).toContain('Unknown message type');
  });
});
