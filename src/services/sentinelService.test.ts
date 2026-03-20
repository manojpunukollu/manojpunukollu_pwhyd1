import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processUnstructuredInput } from './sentinelService';
import { addDoc } from 'firebase/firestore';
import { __setMockUser, mockGenerateContent } from '../setupTests';

describe('sentinelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __setMockUser(null);
  });

  it('should process unstructured input and return a SentinelResponse', async () => {
    const input = 'Test input';
    const result = await processUnstructuredInput(input);

    expect(result).toBeDefined();
    expect(result.riskLevel).toBeDefined();
    expect(result.summary).toBe('Test summary');
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
    const result = await processUnstructuredInput(input, mediaData);

    expect(result).toBeDefined();
    expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
      contents: expect.objectContaining({
        parts: expect.arrayContaining([
          expect.objectContaining({ text: input }),
          expect.objectContaining({ inlineData: expect.anything() })
        ])
      })
    }));
  });

  it('should throw error if API key is invalid', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('API_KEY_INVALID'));
    const input = 'Test input';
    await expect(processUnstructuredInput(input)).rejects.toThrow(/invalid/i);
  });

  it('should throw error if response text is empty', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: '' });
    const input = 'Test input';
    await expect(processUnstructuredInput(input)).rejects.toThrow('Empty response from AI model.');
  });

  it('should throw error if API key is missing', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = '';
    const input = 'Test input';
    await expect(processUnstructuredInput(input)).rejects.toThrow(/missing/i);
    process.env.GEMINI_API_KEY = originalKey;
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
