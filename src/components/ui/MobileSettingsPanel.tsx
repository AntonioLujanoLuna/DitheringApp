import React, { useState } from 'react';
import { useEditorStore, DitheringAlgorithm, ColorMode } from '../../store/useEditorStore';
import { usePresetStore } from '../../store/usePresetStore';
import Button from '../ui/Button';

interface MobileSettingsPanelProps {
  onSavePreset: () => void;
}

const MobileSettingsPanel: React.FC<MobileSettingsPanelProps> = ({ onSavePreset }) => {
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
  
  const { selectedPreset, myPresets, communityPresets, selectPreset } = usePresetStore();
  const [activeSection, setActiveSection] = useState<'algorithm' | 'colors' | 'advanced' | 'presets'>('algorithm');
  
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;
    
    if (presetId === '') {
      selectPreset(null);
      return;
    }
    
    // Find the preset from either my presets or community presets
    const preset = [...myPresets, ...communityPresets].find(p => p.id === presetId);
    
    if (preset) {
      selectPreset(preset);
      
      // Apply the preset settings
      const settings = preset.settings;
      
      setAlgorithm(settings.algorithm);
      setDotSize(settings.dotSize);
      setContrast(settings.contrast);
      setColorMode(settings.colorMode);
      setSpacing(settings.spacing);
      setAngle(settings.angle);
      setCustomColors(settings.customColors);
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* Section tabs */}
      <div className="flex border-b border-gray-200 mb-4 overflow-x-auto hide-scrollbar">
        <button
          className={`px-4 py-2 font-medium ${activeSection === 'algorithm' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-500'}`}
          onClick={() => setActiveSection('algorithm')}
        >
          Algorithm
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeSection === 'colors' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-500'}`}
          onClick={() => setActiveSection('colors')}
        >
          Colors
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeSection === 'advanced' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-500'}`}
          onClick={() => setActiveSection('advanced')}
        >
          Advanced
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeSection === 'presets' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-gray-500'}`}
          onClick={() => setActiveSection('presets')}
        >
          Presets
        </button>
      </div>
      
      {/* Algorithm section */}
      {activeSection === 'algorithm' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="algorithm" className="block text-sm font-medium text-gray-700 mb-1">
              Algorithm
            </label>
            <select
              id="algorithm"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as DitheringAlgorithm)}
              className="input"
            >
              <option value="ordered">Ordered</option>
              <option value="floydSteinberg">Floyd-Steinberg</option>
              <option value="atkinson">Atkinson</option>
              <option value="halftone">Halftone</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dotSize" className="block text-sm font-medium text-gray-700 mb-1">
              Dot Size: {dotSize}px
            </label>
            <input
              id="dotSize"
              type="range"
              min="1"
              max="10"
              value={dotSize}
              onChange={(e) => setDotSize(parseInt(e.target.value))}
              className="slider"
            />
          </div>
          
          <div>
            <label htmlFor="contrast" className="block text-sm font-medium text-gray-700 mb-1">
              Contrast: {contrast}%
            </label>
            <input
              id="contrast"
              type="range"
              min="0"
              max="100"
              value={contrast}
              onChange={(e) => setContrast(parseInt(e.target.value))}
              className="slider"
            />
          </div>
        </div>
      )}
      
      {/* Colors section */}
      {activeSection === 'colors' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="colorMode" className="block text-sm font-medium text-gray-700 mb-1">
              Color Mode
            </label>
            <select
              id="colorMode"
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value as ColorMode)}
              className="input"
            >
              <option value="bw">Black & White</option>
              <option value="cmyk">CMYK</option>
              <option value="rgb">RGB</option>
              <option value="custom">Custom Colors</option>
            </select>
          </div>
          
          {/* Custom Colors */}
          {colorMode === 'custom' && (
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Custom Colors</p>
              <div className="flex flex-wrap gap-2">
                {customColors.map((color, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const newColors = [...customColors];
                        newColors[index] = e.target.value;
                        setCustomColors(newColors);
                      }}
                      className="h-10 w-10 cursor-pointer border rounded"
                    />
                    {customColors.length > 1 && (
                      <button
                        onClick={() => {
                          const newColors = [...customColors];
                          newColors.splice(index, 1);
                          setCustomColors(newColors);
                        }}
                        className="ml-1 text-gray-500 hover:text-red-500 p-2"
                        aria-label="Remove color"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M6 18L18 6M6 6l12 12" 
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setCustomColors([...customColors, '#000000'])}
                  className="h-10 w-10 flex items-center justify-center border border-gray-300 rounded text-gray-500 hover:bg-gray-100"
                  aria-label="Add color"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Advanced section */}
      {activeSection === 'advanced' && (
        <div className="space-y-4">
          {/* Additional settings based on algorithm */}
          {(algorithm === 'halftone') && (
            <>
              <div>
                <label htmlFor="spacing" className="block text-sm font-medium text-gray-700 mb-1">
                  Spacing: {spacing}px
                </label>
                <input
                  id="spacing"
                  type="range"
                  min="0"
                  max="20"
                  value={spacing}
                  onChange={(e) => setSpacing(parseInt(e.target.value))}
                  className="slider"
                />
              </div>
              
              <div>
                <label htmlFor="angle" className="block text-sm font-medium text-gray-700 mb-1">
                  Angle: {angle}°
                </label>
                <input
                  id="angle"
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
          
          {/* Reset Button */}
          <div className="mt-4">
            <button
              onClick={resetSettings}
              className="btn btn-secondary w-full"
            >
              Reset Settings
            </button>
          </div>
        </div>
      )}
      
      {/* Presets section */}
      {activeSection === 'presets' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="preset" className="block text-sm font-medium text-gray-700 mb-1">
              Apply Preset
            </label>
            <select
              id="preset"
              value={selectedPreset?.id || ''}
              onChange={handlePresetChange}
              className="input"
            >
              <option value="">None</option>
              {myPresets.length > 0 && (
                <optgroup label="My Presets">
                  {myPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {communityPresets.length > 0 && (
                <optgroup label="Community Presets">
                  {communityPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} by {preset.username || 'Anonymous'}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          
          <button
            onClick={onSavePreset}
            className="btn btn-secondary w-full"
          >
            Save Current Settings as Preset
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileSettingsPanel;