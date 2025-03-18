import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ImageUploader from './ImageUploader';
import { useEditorStore } from '../../store/useEditorStore';

// Mock Zustand store
vi.mock('../../store/useEditorStore', () => ({
  useEditorStore: vi.fn(() => ({
    setOriginalImage: vi.fn(),
  })),
}));

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: vi.fn(() => ({
    getRootProps: () => ({
      onClick: vi.fn(),
    }),
    getInputProps: () => ({}),
    isDragActive: false,
  })),
}));

describe('ImageUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<ImageUploader />);
    
    expect(screen.getByText(/Drag & drop your image here/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to browse files/i)).toBeInTheDocument();
  });

  it('handles drag active state', () => {
    // Mock dragActive state
    vi.mocked(require('react-dropzone').useDropzone).mockReturnValue({
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: true,
    });

    render(<ImageUploader />);
    
    expect(screen.getByText(/Drop your image here/i)).toBeInTheDocument();
  });

  it('shows error message when there is an error', () => {
    // Force error state with useEffect
    const useStateSpy = vi.spyOn(React, 'useState');
    useStateSpy.mockImplementationOnce(() => ['File too large!', vi.fn()]);

    render(<ImageUploader />);
    
    expect(screen.getByText(/File too large!/i)).toBeInTheDocument();
  });

  it('handles file drop correctly', () => {
    // Mock the file reader API
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
    };
    
    global.FileReader = vi.fn(() => mockFileReader) as any;
    
    // Mock useDropzone to trigger onDrop
    const mockOnDrop = vi.fn();
    vi.mocked(require('react-dropzone').useDropzone).mockReturnValue({
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: false,
      onDrop: mockOnDrop,
    });
    
    render(<ImageUploader />);
    
    // Simulate file drop
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    mockOnDrop([file]);
    
    // Trigger onload
    if (mockFileReader.onload) {
      // Simulate the onload event by directly calling the handler with fake event
      const event = { target: { result: 'data:image/png;base64,test' } };
      mockFileReader.onload.call(mockFileReader, event);
    }
    
    // Check if setOriginalImage was called
    expect(useEditorStore().setOriginalImage).toHaveBeenCalled();
  });
});