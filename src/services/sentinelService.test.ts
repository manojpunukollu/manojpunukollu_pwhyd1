import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processUnstructuredInput } from './sentinelService';
import { addDoc } from 'firebase/firestore';
import { __setMockUser } from '../setupTests';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('sentinelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __setMockUser(null);
    mockFetch.mockReset();
    
    // Default mock response for fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        riskLevel: 'LOW',
        summary: 'Test summary',
        detectedContext: 'Test context',
        actions: []
      })
    });
  });

  it('should process unstructured input and return a SentinelResponse', async () => {
    const input = 'Test input';
    const result = await processUnstructuredInput(input);

    expect(result).toBeDefined();
    expect(result.riskLevel).toBeDefined();
    expect(result.summary).toBe('Test summary');
    expect(mockFetch).toHaveBeenCalledWith('/api/analyze', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('Test input')
    }));
  });

  it('should save to Firestore if user is authenticated', async () => {
    // Mock authenticated user
    __setMockUser({ uid: 'test-uid', providerData: [] });
    
    const input = 'Test input';
    await processUnstructuredInput(input);

    expect(addDoc).toHaveBeenCalled();
    const callArgs = (addDoc as any).mock.calls[0];
    expect(callArgs[1]).toMatchObject({
      userId: 'test-uid',
      input: 'Test input',
    });
  });

  it('should not save to Firestore if user is not authenticated', async () => {
    __setMockUser(null);
    
    const input = 'Test input';
    await processUnstructuredInput(input);

    expect(addDoc).not.toHaveBeenCalled();
  });

  it('should process input with media data', async () => {
    const input = 'Test input';
    const mediaData = { data: 'base64data', mimeType: 'image/png' };
    await processUnstructuredInput(input, mediaData);

    expect(mockFetch).toHaveBeenCalledWith('/api/analyze', expect.objectContaining({
      body: expect.stringContaining('base64data')
    }));
  });

  it('should throw error if server returns error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' })
    });
    const input = 'Test input';
    await expect(processUnstructuredInput(input)).rejects.toThrow(/Internal Server Error/i);
  });

  it('should throw error if response JSON is invalid', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); }
    });
    const input = 'Test input';
    await expect(processUnstructuredInput(input)).rejects.toThrow(/Invalid JSON/i);
  });

  it('should include provider info in Firestore error', async () => {
    __setMockUser({ 
      uid: 'test-uid', 
      email: 'test@example.com',
      providerData: [{ providerId: 'google.com', displayName: 'Test User', email: 'test@example.com', photoURL: 'http://example.com/photo.jpg' }] 
    });
    const { addDoc } = await import('firebase/firestore');
    vi.mocked(addDoc).mockRejectedValueOnce(new Error('Firestore Error'));

    const input = 'Test input';
    await expect(processUnstructuredInput(input)).rejects.toThrow(/Firestore Error/i);
  });

  it('should handle Firestore offline error in testConnection', async () => {
    const { getDocFromServer } = await import('firebase/firestore');
    vi.mocked(getDocFromServer).mockRejectedValueOnce(new Error('the client is offline'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Re-import to trigger top-level testConnection
    vi.resetModules();
    await import('./sentinelService');
    
    expect(consoleSpy).toHaveBeenCalledWith("Please check your Firebase configuration. ");
    consoleSpy.mockRestore();
  });
});
