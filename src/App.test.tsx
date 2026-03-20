import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import * as authModule from 'firebase/auth';
import { __setMockUser } from './setupTests';
import * as sentinelService from './services/sentinelService';

// Mock the sentinelService
vi.mock('./services/sentinelService', () => ({
  processUnstructuredInput: vi.fn(),
  testConnection: vi.fn(),
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __setMockUser(null);
    
    // Default mock for processUnstructuredInput
    vi.mocked(sentinelService.processUnstructuredInput).mockResolvedValue({
      riskLevel: 'LOW',
      summary: 'Test summary',
      detectedContext: 'Test context',
      actions: []
    });
  });

  it('renders the main header and input section', () => {
    render(<App />);
    expect(screen.getByText(/Sentinel AI/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe the situation/i)).toBeInTheDocument();
  });

  it('handles login when "Connect Identity" is clicked', async () => {
    render(<App />);
    const loginBtn = screen.getByText(/Connect Identity/i);
    fireEvent.click(loginBtn);
    expect(authModule.signInWithPopup).toHaveBeenCalled();
  });

  it('shows history sidebar when history button is clicked (if logged in)', async () => {
    // Mock user logged in
    __setMockUser({ uid: 'test-uid', displayName: 'Test User' });
    
    render(<App />);
    
    // Wait for auth to be ready
    await waitFor(() => {
      expect(screen.getByLabelText(/Toggle History/i)).toBeInTheDocument();
    });

    const historyBtn = screen.getByLabelText(/Toggle History/i);
    fireEvent.click(historyBtn);
    
    expect(screen.getByText(/Recent Intelligence/i)).toBeInTheDocument();
  });

  it('processes input and displays results', async () => {
    render(<App />);
    const textarea = screen.getByPlaceholderText(/Describe the situation/i);
    fireEvent.change(textarea, { target: { value: 'Test situation' } });
    
    const processBtn = screen.getByText(/Execute Sentinel Analysis/i);
    fireEvent.click(processBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/Risk Assessment/i)).toBeInTheDocument();
      expect(screen.getByText(/Test summary/i)).toBeInTheDocument();
    });
  });

  it('handles logout', async () => {
    // Mock user logged in
    __setMockUser({ uid: 'test-uid', displayName: 'Test User' });
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Logout/i)).toBeInTheDocument();
    });

    const logoutBtn = screen.getByLabelText(/Logout/i);
    await act(async () => {
      fireEvent.click(logoutBtn);
    });
    
    expect(authModule.signOut).toHaveBeenCalled();

    // Trigger onAuthStateChanged with null to cover line 104
    await act(async () => {
      const auth = authModule.getAuth();
      const calls = (auth.onAuthStateChanged as any).mock.calls;
      if (calls.length > 0) {
        const callback = calls[calls.length - 1][0];
        callback(null);
      }
    });
  });

  it('updates history when snapshot changes', async () => {
    __setMockUser({ uid: 'test-uid', displayName: 'Test User' });
    const { onSnapshot } = await import('firebase/firestore');
    
    render(<App />);
    
    const mockSnapshot = {
      forEach: (cb: any) => {
        cb({ id: '1', data: () => ({ summary: 'Unique History Item', riskLevel: 'LOW', timestamp: { toDate: () => new Date() } }) });
      }
    };

    await act(async () => {
      const calls = (onSnapshot as any).mock.calls;
      if (calls.length > 0) {
        const callback = calls[0][1];
        callback(mockSnapshot);
      }
    });
    
    // Open sidebar to see history
    const historyBtn = screen.getByLabelText(/Toggle History/i);
    fireEvent.click(historyBtn);
    expect(screen.getByText('Unique History Item')).toBeInTheDocument();
  });

  it('handles login failure', async () => {
    const { signInWithPopup } = await import('firebase/auth');
    (signInWithPopup as any).mockRejectedValueOnce(new Error('Login Error'));
    
    render(<App />);
    const loginBtn = screen.getByText(/Connect Identity/i);
    await act(async () => {
      fireEvent.click(loginBtn);
    });
    
    expect(screen.getByText(/Login failed: Login Error/i)).toBeInTheDocument();
  });

  it('handles logout failure', async () => {
    __setMockUser({ uid: 'test-uid', displayName: 'Test User' });
    const { signOut } = await import('firebase/auth');
    (signOut as any).mockRejectedValueOnce(new Error('Logout Error'));
    
    render(<App />);
    const logoutBtn = screen.getByLabelText(/Logout/i);
    await act(async () => {
      fireEvent.click(logoutBtn);
    });
    
    expect(screen.getByText(/Logout failed: Logout Error/i)).toBeInTheDocument();
  });

  it('does not process if input and media are empty', async () => {
    render(<App />);
    const processBtn = screen.getByText(/Execute Sentinel Analysis/i);
    await act(async () => {
      fireEvent.click(processBtn);
    });
    expect(sentinelService.processUnstructuredInput).not.toHaveBeenCalled();
  });

  it('handles history listener error', async () => {
    __setMockUser({ uid: 'test-uid', displayName: 'Test User' });
    const { onSnapshot } = await import('firebase/firestore');
    
    render(<App />);
    
    await act(async () => {
      const errorCallback = (onSnapshot as any).mock.calls[0][2];
      errorCallback(new Error('Snapshot Error'));
    });
  });

  it('handles test case selection', async () => {
    render(<App />);
    
    // The button text is "Conflicting Medical"
    const testCaseButton = screen.getByText(/Conflicting Medical/i);
    fireEvent.click(testCaseButton);
    
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/Describe the situation/i) as HTMLTextAreaElement;
      expect(textarea.value).toContain('Patient 45yo male');
    });
  });

  it('handles test case selection with media', async () => {
    render(<App />);
    
    // Mock fetch for proxy
    const mockBlob = new Blob(['hello'], { type: 'image/png' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    }));

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      result: 'data:image/png;base64,hello',
      onloadend: null as any,
    };
    vi.stubGlobal('FileReader', vi.fn(function() { return mockFileReader; }));

    // "Multimodal Edge Case" test case has media
    const testCaseBtn = screen.getByText(/Multimodal Edge Case/i);
    await act(async () => {
      fireEvent.click(testCaseBtn);
    });
    
    // Manually trigger onloadend
    if (mockFileReader.onloadend) {
      await act(async () => {
        mockFileReader.onloadend();
      });
    }
    
    await waitFor(() => {
      expect(screen.getByAltText(/Uploaded evidence/i)).toBeInTheDocument();
    });
  });

  it('clears error when close button is clicked', async () => {
    // Mock service to throw error
    vi.mocked(sentinelService.processUnstructuredInput).mockRejectedValueOnce(new Error('Test Error'));

    render(<App />);
    
    const textarea = screen.getByPlaceholderText(/Describe the situation/i);
    fireEvent.change(textarea, { target: { value: 'Trigger Error' } });

    const processBtn = screen.getByText(/Execute Sentinel Analysis/i);
    fireEvent.click(processBtn);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    
    const closeBtn = screen.getByLabelText(/Clear Error/i);
    fireEvent.click(closeBtn);
    
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('handles image upload', async () => {
    render(<App />);
    
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      result: 'data:image/png;base64,hello',
      onloadend: null as any,
    };
    vi.stubGlobal('FileReader', vi.fn(function() { return mockFileReader; }));

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    
    // Manually trigger onloadend
    if (mockFileReader.onloadend) {
      await act(async () => {
        mockFileReader.onloadend();
      });
    }
    
    expect(screen.getByAltText(/Uploaded evidence/i)).toBeInTheDocument();
  });

  it('handles test case selection with media failure', async () => {
    render(<App />);
    
    // Mock fetch to fail
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Fetch failed')));

    const testCaseBtn = screen.getByText(/Multimodal Edge Case/i);
    await act(async () => {
      fireEvent.click(testCaseBtn);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load test media/i)).toBeInTheDocument();
    });
  });

  it('handles image upload with no file', async () => {
    render(<App />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await act(async () => {
      fireEvent.change(input, { target: { files: [] } });
    });
    
    expect(screen.queryByAltText(/Uploaded evidence/i)).not.toBeInTheDocument();
  });
});
