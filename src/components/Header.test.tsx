import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Header } from './Header';
import { __setMockUser } from '../setupTests';

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __setMockUser(null);
  });

  const defaultProps = {
    user: null,
    isAuthReady: true,
    showHistory: false,
    setShowHistory: vi.fn(),
    handleLogin: vi.fn(),
    handleLogout: vi.fn(),
  };

  it('renders the header with title and subtitle', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText(/Sentinel AI/i)).toBeInTheDocument();
    expect(screen.getByText(/Intelligence Engine/i)).toBeInTheDocument();
  });

  it('shows login button when not authenticated', () => {
    render(<Header {...defaultProps} user={null} />);
    expect(screen.getByText(/Connect Identity/i)).toBeInTheDocument();
  });

  it('shows logout button and user info when authenticated', () => {
    const mockUser = { uid: 'test-uid', displayName: 'Test User', email: 'test@example.com' } as any;
    
    render(<Header {...defaultProps} user={mockUser} />);
    
    expect(screen.getByText(/Test/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Logout/i)).toBeInTheDocument();
  });

  it('calls setShowHistory when history button is clicked', () => {
    const mockUser = { uid: 'test-uid' } as any;
    const setShowHistory = vi.fn();
    
    render(<Header {...defaultProps} user={mockUser} setShowHistory={setShowHistory} />);
    
    const historyBtn = screen.getByLabelText(/Toggle History/i);
    fireEvent.click(historyBtn);
    
    expect(setShowHistory).toHaveBeenCalledWith(true);
  });

  it('calls handleLogin when login button is clicked', () => {
    const handleLogin = vi.fn();
    render(<Header {...defaultProps} handleLogin={handleLogin} />);
    const loginBtn = screen.getByText(/Connect Identity/i);
    fireEvent.click(loginBtn);
    expect(handleLogin).toHaveBeenCalled();
  });

  it('calls handleLogout when logout button is clicked', () => {
    const handleLogout = vi.fn();
    const mockUser = { uid: 'test-uid' } as any;
    render(<Header {...defaultProps} user={mockUser} handleLogout={handleLogout} />);
    const logoutBtn = screen.getByLabelText(/Logout/i);
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalled();
  });

  it('shows current timezone', () => {
    render(<Header {...defaultProps} />);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(screen.getByText(timezone)).toBeInTheDocument();
  });
});
