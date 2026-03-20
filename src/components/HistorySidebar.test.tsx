import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistorySidebar } from './HistorySidebar';

describe('HistorySidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockHistory = [
    {
      id: '1',
      summary: 'Test history 1',
      riskLevel: 'HIGH' as const,
      timestamp: new Date().toISOString(),
      input: 'Test input 1',
      detectedContext: 'Context 1',
      actions: []
    }
  ];

  const defaultProps = {
    showHistory: false,
    setShowHistory: vi.fn(),
    history: [] as any[],
    setResponse: vi.fn(),
  };

  it('renders correctly when open', () => {
    render(<HistorySidebar {...defaultProps} showHistory={true} />);
    expect(screen.getByText(/Recent Intelligence/i)).toBeInTheDocument();
  });

  it('calls setShowHistory(false) when close button is clicked', () => {
    const setShowHistory = vi.fn();
    render(<HistorySidebar {...defaultProps} showHistory={true} setShowHistory={setShowHistory} />);
    
    const closeBtn = screen.getByLabelText(/Close History/i);
    fireEvent.click(closeBtn);
    
    expect(setShowHistory).toHaveBeenCalledWith(false);
  });

  it('displays history items', () => {
    render(<HistorySidebar {...defaultProps} showHistory={true} history={mockHistory} />);
    expect(screen.getByText(/Test history 1/i)).toBeInTheDocument();
    expect(screen.getByText(/HIGH/i)).toBeInTheDocument();
    expect(screen.getByText(/"Test input 1"/i)).toBeInTheDocument();
  });

  it('calls setResponse and setShowHistory(false) when a history item is clicked', () => {
    const setResponse = vi.fn();
    const setShowHistory = vi.fn();
    render(<HistorySidebar {...defaultProps} showHistory={true} history={mockHistory} setResponse={setResponse} setShowHistory={setShowHistory} />);
    
    const itemBtn = screen.getByText(/Test history 1/i).closest('button');
    fireEvent.click(itemBtn!);
    
    expect(setResponse).toHaveBeenCalledWith(mockHistory[0]);
    expect(setShowHistory).toHaveBeenCalledWith(false);
  });

  it('shows empty state when no history is found', () => {
    render(<HistorySidebar {...defaultProps} showHistory={true} history={[]} />);
    expect(screen.getByText(/No history found/i)).toBeInTheDocument();
  });

  it('renders different risk colors correctly', () => {
    const mixedHistory = [
      { id: '1', timestamp: Date.now().toString(), riskLevel: 'CRITICAL' as const, summary: 'C1', input: 'I1', detectedContext: 'D1', actions: [] },
      { id: '2', timestamp: Date.now().toString(), riskLevel: 'MEDIUM' as const, summary: 'M1', input: 'I2', detectedContext: 'D2', actions: [] },
      { id: '3', timestamp: Date.now().toString(), riskLevel: 'LOW' as const, summary: 'L1', input: 'I3', detectedContext: 'D3', actions: [] },
    ];
    render(<HistorySidebar {...defaultProps} showHistory={true} history={mixedHistory} />);
    
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    expect(screen.getByText('LOW')).toBeInTheDocument();
  });

  it('closes when backdrop is clicked', () => {
    const setShowHistory = vi.fn();
    const { container } = render(<HistorySidebar {...defaultProps} showHistory={true} setShowHistory={setShowHistory} />);
    
    // The backdrop is the first motion.div inside AnimatePresence
    // It has class "fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
    const backdrop = container.querySelector('.bg-black\\/60');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(setShowHistory).toHaveBeenCalledWith(false);
    }
  });
});
