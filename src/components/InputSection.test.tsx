import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputSection } from './InputSection';

describe('InputSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    input: '',
    setInput: vi.fn(),
    media: null,
    setMedia: vi.fn(),
    isProcessing: false,
    handleProcess: vi.fn(),
    handleImageUpload: vi.fn(),
  };

  it('renders correctly', () => {
    render(<InputSection {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Describe the situation/i)).toBeInTheDocument();
    expect(screen.getByText(/Execute Sentinel Analysis/i)).toBeInTheDocument();
  });

  it('calls setInput when text changes', () => {
    const setInput = vi.fn();
    render(<InputSection {...defaultProps} setInput={setInput} />);
    
    const textarea = screen.getByPlaceholderText(/Describe the situation/i);
    fireEvent.change(textarea, { target: { value: 'Test input' } });
    
    expect(setInput).toHaveBeenCalledWith('Test input');
  });

  it('calls handleProcess when button is clicked', () => {
    const handleProcess = vi.fn();
    render(<InputSection {...defaultProps} input="Some input" handleProcess={handleProcess} />);
    
    const btn = screen.getByText(/Execute Sentinel Analysis/i);
    fireEvent.click(btn);
    
    expect(handleProcess).toHaveBeenCalled();
  });

  it('disables button when processing', () => {
    render(<InputSection {...defaultProps} isProcessing={true} />);
    const btn = screen.getByText(/Processing Intelligence/i);
    expect(btn).toBeDisabled();
  });

  it('disables button when input and media are empty', () => {
    render(<InputSection {...defaultProps} input="" media={null} />);
    const btn = screen.getByText(/Execute Sentinel Analysis/i);
    expect(btn).toBeDisabled();
  });

  it('triggers file input click when camera button is clicked', () => {
    const { container } = render(<InputSection {...defaultProps} />);
    const uploadBtn = screen.getByLabelText(/Upload image, audio, or video for analysis/i);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Mock the click method on the file input
    const clickSpy = vi.spyOn(fileInput, 'click');
    fireEvent.click(uploadBtn);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('calls handleImageUpload when file is selected', () => {
    const handleImageUpload = vi.fn();
    const { container } = render(<InputSection {...defaultProps} handleImageUpload={handleImageUpload} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    fireEvent.change(fileInput, { target: { files: [new File([''], 'test.png')] } });
    expect(handleImageUpload).toHaveBeenCalled();
  });

  it('shows media preview when media is provided', () => {
    const media = { data: 'data:image/png;base64,test', mimeType: 'image/png' };
    render(<InputSection {...defaultProps} media={media} />);
    expect(screen.getByAltText(/Uploaded evidence/i)).toBeInTheDocument();
  });

  it('calls setMedia(null) when remove button is clicked', () => {
    const setMedia = vi.fn();
    const media = { data: 'data:image/png;base64,test', mimeType: 'image/png' };
    render(<InputSection {...defaultProps} media={media} setMedia={setMedia} />);
    
    const removeBtn = screen.getByLabelText(/Remove media/i);
    fireEvent.click(removeBtn);
    
    expect(setMedia).toHaveBeenCalledWith(null);
  });

  it('shows audio data loaded message for audio media', () => {
    const media = { data: 'data:audio/mpeg;base64,test', mimeType: 'audio/mpeg' };
    render(<InputSection {...defaultProps} media={media} />);
    expect(screen.getByText(/Audio Data Loaded/i)).toBeInTheDocument();
  });

  it('shows video data loaded message for video media', () => {
    const media = { data: 'data:video/mp4;base64,test', mimeType: 'video/mp4' };
    render(<InputSection {...defaultProps} media={media} />);
    expect(screen.getByText(/Video Data Loaded/i)).toBeInTheDocument();
  });
});
