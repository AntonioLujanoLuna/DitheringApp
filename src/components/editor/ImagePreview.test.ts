import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ImagePreview from './ImagePreview';
import { useEditorStore } from '../../store/useEditorStore';

// Mock toast notifications
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock QR code
vi.mock('qrcode.react', () => ({
  QRCodeSVG: vi.fn(() => <div data-testid="qr-code">QR Code</div>),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

// Mock Zustand store
vi.mock('../../store/useEditorStore', () => ({
  useEditorStore: vi.fn(() => ({
    originalImage: null,
    algorithm: 'ordered',
    dotSize: 3,
    contrast: 50,
    colorMode: 'bw',
    spacing: 5,
    angle: 45,
    customColors: ['#000000', '#ffffff'],
    isProcessing: false,
    setIsProcessing: vi.fn(),
  })),
}));

describe('ImagePreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the upload prompt when no image is provided', () => {
    render(<ImagePreview />);
    
    expect(screen.getByText('Upload an image to see the preview')).toBeInTheDocument();
  });

  it('renders loading state when processing', () => {
    vi.mocked(useEditorStore).mockReturnValue({
      ...useEditorStore(),
      originalImage: { src: 'test.png', width: 100, height: 100 } as HTMLImageElement,
      isProcessing: true,
    } as any);

    render(<ImagePreview />);
    
    // Look for a loading indicator
    const loader = document.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('renders image preview when an image is loaded', async () => {
    vi.mocked(useEditorStore).mockReturnValue({
      ...useEditorStore(),
      originalImage: { src: 'test.png', width: 100, height: 100 } as HTMLImageElement,
      isProcessing: false,
    } as any);

    // Mock canvas element
    const mockCanvas = document.createElement('canvas');
    const mockCanvasContext = {
      putImageData: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(100 * 100 * 4),
        width: 100,
        height: 100,
      })),
    };
    mockCanvas.getContext = vi.fn(() => mockCanvasContext);
    
    vi.spyOn(document, 'querySelector').mockReturnValue(mockCanvas);

    render(<ImagePreview />);
    
    expect(screen.getByText('Original Image')).toBeInTheDocument();
    expect(screen.getByText('Processed Image')).toBeInTheDocument();
    
    // Wait for image processing to complete
    await waitFor(() => {
      expect(screen.getByText('Download Image')).toBeInTheDocument();
    });
  });

  it('handles download button click', async () => {
    vi.mocked(useEditorStore).mockReturnValue({
      ...useEditorStore(),
      originalImage: { src: 'test.png', width: 100, height: 100 } as HTMLImageElement,
      isProcessing: false,
    } as any);

    // Mock download link
    const mockLink = document.createElement('a');
    mockLink.click = vi.fn();
    
    vi.spyOn(document, 'querySelector')
      .mockReturnValueOnce(document.createElement('canvas')) // First call for canvas
      .mockReturnValueOnce(mockLink); // Second call for download link

    render(<ImagePreview />);
    
    // Wait for UI to update
    await waitFor(() => {
      expect(screen.getByText('Download Image')).toBeInTheDocument();
    });
    
    // Click download button
    fireEvent.click(screen.getByText('Download Image'));
    
    // Check if link was clicked
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('handles copy share link button click', async () => {
    vi.mocked(useEditorStore).mockReturnValue({
      ...useEditorStore(),
      originalImage: { src: 'test.png', width: 100, height: 100 } as HTMLImageElement,
      isProcessing: false,
    } as any);

    render(<ImagePreview />);
    
    // Wait for UI to update
    await waitFor(() => {
      expect(screen.getByText('Copy Share Link')).toBeInTheDocument();
    });
    
    // Click copy share link button
    fireEvent.click(screen.getByText('Copy Share Link'));
    
    // Check if clipboard API was called
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('toggles QR code display', async () => {
    vi.mocked(useEditorStore).mockReturnValue({
      ...useEditorStore(),
      originalImage: { src: 'test.png', width: 100, height: 100 } as HTMLImageElement,
      isProcessing: false,
    } as any);

    render(<ImagePreview />);
    
    // Wait for UI to update
    await waitFor(() => {
      expect(screen.getByText('Show QR Code')).toBeInTheDocument();
    });
    
    // QR code should not be displayed initially
    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
    
    // Click the show QR code button
    fireEvent.click(screen.getByText('Show QR Code'));
    
    // QR code should be displayed
    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    expect(screen.getByText('Hide QR Code')).toBeInTheDocument();
    
    // Click the hide QR code button
    fireEvent.click(screen.getByText('Hide QR Code'));
    
    // QR code should be hidden again
    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();
  });
});