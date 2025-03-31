// src/components/editor/SettingsPanel.tsx
import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { usePresetStore } from '../../store/usePresetStore';

interface SettingsPanelProps {
  onSavePreset: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onSavePreset }) => {
  const {
    algorithm,
    dotSize,
    contrast,
    colorMode,
    spacing,
    angle,
    customColors,
    setAlgorithm,
    setDotSize,
    setContrast,
    setColorMode,
    setSpacing,
    setAngle,
    setCustomColors,
    resetSettings
  } = useEditorStore();
  
  const { myPresets, selectedPreset, selectPreset, fetchMyPresets } = usePresetStore();
  
  // Load presets on component mount
  React.useEffect(() => {
    fetchMyPresets();
  }, [fetchMyPresets]);
  
  // Handle preset selection
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;
    
    if (presetId === '') {
      selectPreset(null);
      return;
    }
    
    const preset = myPresets.find(p => p.id === presetId);
    if (preset) {
      selectPreset(preset);
      useEditorStore.getState().loadSettings(preset.settings);
    }
  };
  
  const handleColorChange = (index: number, color: string) => {
    const newColors = [...customColors];
    newColors[index] = color;
    setCustomColors(newColors);
  };
  
  const handleAddColor = () => {
    setCustomColors([...customColors, '#000000']);
  };
  
  const handleRemoveColor = (index: number) => {
    const newColors = [...customColors];
    newColors.splice(index, 1);
    setCustomColors(newColors);
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Dithering Settings</h2>
        
        <button 
          onClick={resetSettings}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Reset to defaults
        </button>
      </div>
      
      {/* Presets dropdown */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">
            Presets
          </label>
          
          <button 
            onClick={onSavePreset}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            Save Current Settings as Preset
          </button>
        </div>
        
        <select
          value={selectedPreset?.id || ''}
          onChange={handlePresetChange}
          className="input"
        >
          <option value="">Select a preset</option>
          {myPresets.map(preset => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Algorithm selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Dithering Algorithm
        </label>
        
        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as any)}
          className="input"
        >
          <option value="ordered">Ordered Dithering</option>
          <option value="floydSteinberg">Floyd-Steinberg Dithering</option>
          <option value="atkinson">Atkinson Dithering</option>
          <option value="halftone">Halftone Dithering</option>
        </select>
      </div>
      
      {/* Color mode selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Color Mode
        </label>
        
        <select
          value={colorMode}
          onChange={(e) => setColorMode(e.target.value as any)}
          className="input"
        >
          <option value="bw">Black & White</option>
          <option value="cmyk">CMYK</option>
          <option value="rgb">RGB</option>
          <option value="custom">Custom Colors</option>
        </select>
      </div>
      
      {/* Custom colors */}
      {colorMode === 'custom' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Custom Colors
          </label>
          
          <div className="space-y-2">
            {customColors.map((color, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleColorChange(index, e.target.value)}
                  className="input flex-1"
                />
                
                <button
                  onClick={() => handleRemoveColor(index)}
                  disabled={customColors.length <= 2}
                  className="p-2 text-gray-500 hover:text-red-500 disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            
            <button
              onClick={handleAddColor}
              className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Color</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Dot size slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Dot Size: {dotSize}px
          </label>
        </div>
        
        <input
          type="range"
          min="1"
          max="10"
          value={dotSize}
          onChange={(e) => setDotSize(parseInt(e.target.value))}
          className="slider"
        />
      </div>
      
      {/* Contrast slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Contrast: {contrast}%
          </label>
        </div>
        
        <input
          type="range"
          min="0"
          max="100"
          value={contrast}
          onChange={(e) => setContrast(parseInt(e.target.value))}
          className="slider"
        />
      </div>
      
      {/* Only show spacing and angle for halftone algorithm */}
      {algorithm === 'halftone' && (
        <>
          {/* Spacing slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Spacing: {spacing}px
              </label>
            </div>
            
            <input
              type="range"
              min="0"
              max="20"
              value={spacing}
              onChange={(e) => setSpacing(parseInt(e.target.value))}
              className="slider"
            />
          </div>
          
          {/* Angle slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Angle: {angle}°
              </label>
            </div>
            
            <input
              type="range"
              min="0"
              max="90"
              value={angle}
              onChange={(e) => setAngle(parseInt(e.target.value))}
              className="slider"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsPanel;