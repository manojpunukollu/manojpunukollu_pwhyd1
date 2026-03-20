import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestCases } from './TestCases';

describe('TestCases Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<TestCases onSelect={() => {}} />);
    expect(screen.getByText(/Intelligence Test Suite/i)).toBeInTheDocument();
    expect(screen.getByText(/Conflicting Medical/i)).toBeInTheDocument();
  });

  it('calls onSelect when a test case is clicked', () => {
    const onSelect = vi.fn();
    render(<TestCases onSelect={onSelect} />);
    
    const testCase = screen.getByText(/Conflicting Medical/i);
    fireEvent.click(testCase);
    
    expect(onSelect).toHaveBeenCalled();
  });

  it('renders all test cases', () => {
    render(<TestCases onSelect={() => {}} />);
    expect(screen.getByText(/Vague Env Threat/i)).toBeInTheDocument();
    expect(screen.getByText(/High-Stress Security/i)).toBeInTheDocument();
    expect(screen.getByText(/Remote Logistics/i)).toBeInTheDocument();
    expect(screen.getByText(/Multimodal Edge Case/i)).toBeInTheDocument();
  });
});
