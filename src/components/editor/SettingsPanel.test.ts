import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsPanel from './SettingsPanel';
import { useEditorStore } from '../../store/useEditorStore';
import { usePresetStore } from '../../store/usePresetStore';

// Mock Zustand stores
vi.mock('../../store/useEditorStore', () => ({
  useEditorStore: vi.fn(() => ({
    algorithm: 'ordered',
    dotSize: 3,
    contrast: 50,
    colorMode: 'bw',
    spacing: 5,
    angle: 45,
    customColors: ['#000000', '#ffffff'],
    setAlgorithm: vi.fn(),
    setDotSize: vi.fn(),
    setContrast: vi.fn(),
    setColorMode: vi.fn(),
    setSpacing: vi.fn(),
    setAngle: vi.fn(),
    setCustomColors: vi.fn(),
    resetSettings: vi.fn(),
  })),
}));

vi.mock('../../store/usePresetStore', () => ({
  usePresetStore: vi.fn(() => ({
    selectedPreset: null,
    myPresets: [
      { id: 'preset-1', name: 'My Preset 1', settings: {} },
      { id: 'preset-2', name: 'My Preset 2', settings: {} },
    ],
    communityPresets: [
      { id: 'preset-3', name: 'Community Preset 1', username: 'user1', settings: {} },
    ],
    selectPreset: vi.fn(),
  })),
}));

describe('SettingsPanel', () => {
  const mockOnSavePreset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with initial settings', () => {
    render(<SettingsPanel onSavePreset={mockOnSavePreset} />);
    
    // Check section titles
    expect(screen.getByText('Dithering Settings')).toBeInTheDocument();
    
    // Check algorithm dropdown
    expect(screen.getByLabelText('Algorithm')).toBeInTheDocument();
    expect(screen.getByLabelText('Algorithm')).toHaveValue('ordered');
    
    // Check sliders
    expect(screen.getByLabelText(/Dot Size/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contrast/)).toBeInTheDocument();
    
    // Check other form elements
    expect(screen.getByLabelText('Color Mode')).toBeInTheDocument();
    expect(screen.getByText('Reset Settings')).toBeInTheDocument();
  });

  it('shows preset options', () => {
    render(<SettingsPanel onSavePreset={mockOnSavePreset} />);
    
    expect(screen.getByLabelText('Apply Preset')).toBeInTheDocument();
    expect(screen.getByText('My Preset 1')).toBeInTheDocument();
    expect(screen.getByText('Community Preset 1')).toBeInTheDocument();
  });

  it('handles algorithm change', () => {
    render(<SettingsPanel onSavePreset={mockOnSavePreset} />);
    
    fireEvent.change(screen.getByLabelText('Algorithm'), { target: { value: 'floydSteinberg' } });
    
    expect(useEditorStore().setAlgorithm).toHaveBeenCalledWith('floydSteinberg');
  });

  it('handles dot size change', () => {
    render(<SettingsPanel onSavePreset={mockOnSavePreset} />);
    
    fireEvent.change(screen.getByLabelText(/Dot Size/), { target: { value: '5' } });
    
    expect(useEditorStore().setDotSize).toHaveBeenCalledWith(5);
  });

  it('handles contrast change', () => {
    render(<SettingsPanel onSavePreset={mockOnSavePreset} />);
    
    fireEvent.change(screen.getByLabelText(/Contrast/), { target: { value: '75' } });
    
    expect(useEditorStore().setContrast).toHaveBeenCalledWith(75);
  });

  it('handles color mode change', () => {
    render(<SettingsPanel onSavePreset={mockOnSavePreset} />);
    
    fireEvent.change(screen.getByLabelText('Color Mode'), { target: { value: 'rgb' } });
    
    expect(useEditorStore().setColorMode).toHaveBeenCalledWith('rgb');
  });

  it('shows custom color picker when custom color mode is selected', () => {
    // Change colorMode to 'custom'
    vi.mocked(useEditorStore).mockReturnValue({
      ...useEditorStore(),
      colorMode: 'custom',
    } as any);
    
    render(<SettingsPanel onSavePreset={mockOnSavePreset} />);
    
    expect(screen.getByText('Custom Colors')).toBeInTheDocument();
  });

  it('handles reset settings', () => {
    render(<SettingsPanel onSavePreset={mockOnSavePreset} />);
    
    fireEvent.click(screen.getByText('Reset Settings'));
    
    expect(useEditorStore().resetSettings).toHaveBeenCalled();
  });

  it('handles save preset button', () => {
    render(<SettingsPanel onSavePreset={mockOnSavePreset} />);
    
    fireEvent.click(screen.getByText('Save Current Settings as Preset'));
    
    expect(mockOnSavePreset).toHaveBeenCalled();
  });

  it('handles preset selection', () => {
    render(<SettingsPanel onSavePreset={mockOnSavePreset} />);
    
    fireEvent.change(screen.getByLabelText('Apply Preset'), { target: { value: 'preset-1' } });
    
    expect(usePresetStore().selectPreset).toHaveBeenCalled();
  });
});