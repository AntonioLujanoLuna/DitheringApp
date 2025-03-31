// src/components/ui/MobileSettingsPanel.tsx
import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { useThemeStore } from '../../store/useThemeStore';

interface MobileSettingsPanelProps {
  onSavePreset: () => void;
  onBeforeChange?: () => void;
}

const MobileSettingsPanel: React.FC<MobileSettingsPanelProps> = ({ 
  onSavePreset,
  onBeforeChange 
}) => {
  const [expanded, setExpanded] = useState(false);
  const { darkMode } = useThemeStore();
  
  const {
    algorithm,
    setAlgorithm,
    dotSize,
    setDotSize,
    contrast,
    setContrast,
    colorMode,
    setColorMode,
    spacing,
    setSpacing,
    angle,
    setAngle,
    resetSettings
  } = useEditorStore();
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  const handleSettingChange = (action: () => void) => {
    if (onBeforeChange) {
      onBeforeChange();
    }
    action();
  };
  
  return (
    <div className={`border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg overflow-hidden`}>
      <div
        className="p-4 flex justify-between items-center cursor-pointer"
        onClick={toggleExpanded}
      >
        <h2 className="font-bold">Settings</h2>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transition-transform ${expanded ? 'transform rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {expanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {/* Algorithm selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Dithering Algorithm
            </label>
            <select
              value={algorithm}
              onChange={(e) => handleSettingChange(() => setAlgorithm(e.target.value as any))}
              className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            >
              <option value="ordered">Ordered Dithering</option>
              <option value="floydSteinberg">Floyd-Steinberg Dithering</option>
              <option value="atkinson">Atkinson Dithering</option>
              <option value="halftone">Halftone Dithering</option>
              <option value="pattern">Pattern Dithering</option>
              <option value="multiTone">Multi-tone Dithering</option>
            </select>
          </div>
          
          {/* Color mode selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Color Mode
            </label>
            <select
              value={colorMode}
              onChange={(e) => handleSettingChange(() => setColorMode(e.target.value as any))}
              className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            >
              <option value="bw">Black & White</option>
              <option value="cmyk">CMYK</option>
              <option value="rgb">RGB</option>
              <option value="custom">Custom Colors</option>
            </select>
          </div>
          
          {/* Basic sliders */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Dot Size: {dotSize}px
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={dotSize}
                onChange={(e) => handleSettingChange(() => setDotSize(parseInt(e.target.value)))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium">
                Contrast: {contrast}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={contrast}
                onChange={(e) => handleSettingChange(() => setContrast(parseInt(e.target.value)))}
                className="w-full"
              />
            </div>
            
            {algorithm === 'halftone' && (
              <>
                <div className="space-y-1">
                  <label className="block text-sm font-medium">
                    Spacing: {spacing}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={spacing}
                    onChange={(e) => handleSettingChange(() => setSpacing(parseInt(e.target.value)))}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium">
                    Angle: {angle}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={angle}
                    onChange={(e) => handleSettingChange(() => setAngle(parseInt(e.target.value)))}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-between pt-2">
            <button
              onClick={() => handleSettingChange(resetSettings)}
              className={`py-2 px-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Reset Defaults
            </button>
            
            <button
              onClick={onSavePreset}
              className="py-2 px-3 bg-primary-500 text-white rounded-lg"
            >
              Save as Preset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileSettingsPanel;