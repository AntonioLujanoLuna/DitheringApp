import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Editor from './Editor';
import { useEditorStore } from '../store/useEditorStore';
import { usePresetStore } from '../store/usePresetStore';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'react-toastify';

// Mock toast notifications
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Zustand stores
vi.mock('../store/useEditorStore', () => ({
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
    setOriginalImage: vi.fn(),
  })),
}));

vi.mock('../store/usePresetStore', () => ({
  usePresetStore: vi.fn(() => ({
    createPreset: vi.fn(),
  })),
}));

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
  })),
}));

// Mock Supabase
vi.mock('../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: {}, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } })),
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

describe('Editor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with no image', () => {
    render(
      <BrowserRouter>
        <Editor />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Image Dithering Editor')).toBeInTheDocument();
    
    // ImageUploader should be rendered
    expect(screen.getByText(/Drag & drop your image here/i)).toBeInTheDocument();
    
    // SettingsPanel should be rendered
    expect(screen.getByText('Dithering Settings')).toBeInTheDocument();
  });

  it('renders with an uploaded image', () => {
    // Mock an uploaded image
    vi.mocked(useEditorStore).mockReturnValue({
      ...useEditorStore(),
      originalImage: { src: 'test.png', width: 100, height: 100 } as HTMLImageElement,
    } as any);

    render(
      <BrowserRouter>
        <Editor />
      </BrowserRouter>
    );
    
    // Check for save button that appears when an image is loaded
    expect(screen.getByText('Save to My Collection')).toBeInTheDocument();
    expect(screen.getByText('Upload New Image')).toBeInTheDocument();
  });

  it('opens save modal and handles not logged in', () => {
    // Mock an uploaded image
    vi.mocked(useEditorStore).mockReturnValue({
      ...useEditorStore(),
      originalImage: { src: 'test.png', width: 100, height: 100 } as HTMLImageElement,
    } as any);

    render(
      <BrowserRouter>
        <Editor />
      </BrowserRouter>
    );
    
    // Click save button
    fireEvent.click(screen.getByText('Save to My Collection'));
    
    // Should show warning toast because user is not logged in
    expect(toast.warning).toHaveBeenCalledWith('Please log in to save your image.');
  });

  it('opens save modal and handles saving when logged in', () => {
    // Mock an uploaded image
    vi.mocked(useEditorStore).mockReturnValue({
      ...useEditorStore(),
      originalImage: { src: 'test.png', width: 100, height: 100 } as HTMLImageElement,
    } as any);
    
    // Mock logged in user
    vi.mocked(useAuthStore).mockReturnValue({
      ...useAuthStore(),
      user: { id: 'test-user-id', email: 'test@example.com' },
    } as any);

    render(
      <BrowserRouter>
        <Editor />
      </BrowserRouter>
    );
    
    // Click save button
    fireEvent.click(screen.getByText('Save to My Collection'));
    
    // Save modal should be visible
    expect(screen.getByText('Save Image')).toBeInTheDocument();
    
    // Fill in form
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Test Image' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Test description' } });
    
    // Click save button in modal
    fireEvent.click(screen.getByText('Save Image'));
    
    // Wait for success message
    waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Image saved successfully!');
    });
  });

  it('opens save preset modal and handles not logged in', () => {
    render(
      <BrowserRouter>
        <Editor />
      </BrowserRouter>
    );
    
    // Find and click the "Save as Preset" button
    // Settings panel has this button
    fireEvent.click(screen.getByText('Save Current Settings as Preset'));
    
    // Should show warning toast because user is not logged in
    expect(toast.warning).toHaveBeenCalledWith('Please log in to save presets.');
  });

  it('opens save preset modal and handles saving when logged in', () => {
    // Mock logged in user
    vi.mocked(useAuthStore).mockReturnValue({
      ...useAuthStore(),
      user: { id: 'test-user-id', email: 'test@example.com' },
    } as any);

    render(
      <BrowserRouter>
        <Editor />
      </BrowserRouter>
    );
    
    // Find and click the "Save as Preset" button
    fireEvent.click(screen.getByText('Save Current Settings as Preset'));
    
    // Save preset modal should be visible
    expect(screen.getByText('Save as Preset')).toBeInTheDocument();
    
    // Fill in form
    fireEvent.change(screen.getByLabelText(/Preset Name/), { target: { value: 'Test Preset' } });
    
    // Click save button in modal
    fireEvent.click(screen.getByText('Save Preset'));
    
    // Wait for success message
    waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Preset saved successfully!');
      expect(usePresetStore().createPreset).toHaveBeenCalled();
    });
  });
});