import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResultsSection } from './ResultsSection';
import { SentinelResponse } from '../services/sentinelService';
import React from 'react';

describe('ResultsSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockResult: SentinelResponse = {
    summary: 'Test summary',
    riskLevel: 'HIGH',
    detectedContext: 'Test context',
    actions: [
      {
        priority: 'CRITICAL',
        category: 'MEDICAL',
        action: 'Test action',
        verificationStatus: 'VERIFIED',
        reasoning: 'Test reasoning'
      }
    ]
  };

  const mockScrollRef = { current: document.createElement('div') } as React.RefObject<HTMLDivElement | null>;

  it('renders correctly with results', () => {
    render(<ResultsSection response={mockResult} scrollRef={mockScrollRef} />);
    expect(screen.getByText(/Risk Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/HIGH/i)).toBeInTheDocument();
    expect(screen.getByText(/Test summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Test action/i)).toBeInTheDocument();
  });

  it('renders different risk levels correctly', () => {
    const { rerender } = render(<ResultsSection response={{ ...mockResult, riskLevel: 'CRITICAL' }} scrollRef={mockScrollRef} />);
    expect(screen.getAllByText(/CRITICAL/i).length).toBeGreaterThan(0);

    rerender(<ResultsSection response={{ ...mockResult, riskLevel: 'MEDIUM' }} scrollRef={mockScrollRef} />);
    expect(screen.getAllByText(/MEDIUM/i).length).toBeGreaterThan(0);

    rerender(<ResultsSection response={{ ...mockResult, riskLevel: 'LOW' }} scrollRef={mockScrollRef} />);
    expect(screen.getAllByText(/LOW/i).length).toBeGreaterThan(0);
  });

  it('renders action items with correct categories', () => {
    const resultWithCategories: SentinelResponse = {
      ...mockResult,
      actions: [
        { priority: 'HIGH', category: 'ENVIRONMENTAL', action: 'Env action', verificationStatus: 'PENDING', reasoning: 'R1' },
        { priority: 'MEDIUM', category: 'SECURITY', action: 'Sec action', verificationStatus: 'UNVERIFIED', reasoning: 'R2' },
        { priority: 'LOW', category: 'LOGISTICS', action: 'Log action', verificationStatus: 'VERIFIED', reasoning: 'R3' },
        { priority: 'LOW', category: 'OTHER', action: 'Other action', verificationStatus: 'VERIFIED', reasoning: 'R4' }
      ]
    };
    render(<ResultsSection response={resultWithCategories} scrollRef={mockScrollRef} />);
    expect(screen.getAllByText(/ENVIRONMENTAL/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SECURITY/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/LOGISTICS/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/OTHER/i).length).toBeGreaterThan(0);
  });
});
