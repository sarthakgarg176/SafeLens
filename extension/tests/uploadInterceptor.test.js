import { describe, it, expect, vi, beforeEach } from 'vitest';
import { interceptUpload } from '../src/content/uploadInterceptor.js';

// Mock decisionPopup UI
vi.mock('../src/content/decisionPopup.js', () => ({
  showDecisionPopup: vi.fn(() => Promise.resolve('protect'))
}));

describe('Upload Interceptor Context Controller', () => {
  const mockFile = { 
    name: 'upload.png', 
    size: 1000, 
    type: 'image/png',
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(1000))
  };
  const mockFiles = [mockFile];
  const mockMetadata = [{ name: 'upload.png', size: 1000, type: 'image/png' }];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation for chrome.runtime.sendMessage to simulate SW execution
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (message.type === 'RUN_PROTECT_PIPELINE') {
        const response = {
          success: true,
          data: {
            arrayBuffer: new ArrayBuffer(500),
            name: 'secured.png',
            type: 'image/png',
            phash: '1234567890abcdef',
            whash: 'abcdef1234567890',
            risk: 'high',
            detections: [{ type: 'EMAIL', fusedConfidence: 0.95 }],
            protectionSummary: { processingTime: 120, redacted: true }
          }
        };
        if (callback) callback(response);
        return Promise.resolve(response);
      }
      
      const defaultResponse = { success: true };
      if (callback) callback(defaultResponse);
      return Promise.resolve(defaultResponse);
    });
  });

  it('should immediately bypass protection and invoke callback with original files if shield is disabled', async () => {
    chrome.storage.local.get.mockImplementationOnce(() => Promise.resolve({
      settings: { protectionEnabled: false }
    }));

    const onApproval = vi.fn();
    await interceptUpload(mockFiles, mockMetadata, null, onApproval);

    expect(onApproval).toHaveBeenCalledWith(mockFiles);
  });

  it('should execute pipeline immediately if Auto Protect is enabled', async () => {
    chrome.storage.local.get.mockImplementationOnce(() => Promise.resolve({
      settings: { protectionEnabled: true, autoProtect: true }
    }));

    const onApproval = vi.fn();
    await interceptUpload(mockFiles, mockMetadata, null, onApproval);

    expect(onApproval).toHaveBeenCalled();
    expect(onApproval.mock.calls[0][0][0].name).toBe('secured.png');
  });

  it('should trigger choice modal if Auto Protect is disabled', async () => {
    chrome.storage.local.get.mockImplementationOnce(() => Promise.resolve({
      settings: { protectionEnabled: true, autoProtect: false }
    }));

    const { showDecisionPopup } = await import('../src/content/decisionPopup.js');
    showDecisionPopup.mockImplementationOnce(() => Promise.resolve('anyway'));

    const onApproval = vi.fn();
    await interceptUpload(mockFiles, mockMetadata, null, onApproval);

    expect(showDecisionPopup).toHaveBeenCalled();
    expect(onApproval).toHaveBeenCalledWith(mockFiles); // Upload Anyway returns original
  });

  it('should discard upload event if user cancels the decision modal', async () => {
    chrome.storage.local.get.mockImplementationOnce(() => Promise.resolve({
      settings: { protectionEnabled: true, autoProtect: false }
    }));

    const { showDecisionPopup } = await import('../src/content/decisionPopup.js');
    showDecisionPopup.mockImplementationOnce(() => Promise.resolve('cancel'));

    const onApproval = vi.fn();
    await interceptUpload(mockFiles, mockMetadata, null, onApproval);

    expect(onApproval).not.toHaveBeenCalled();
  });
});
