// src/components/editor/SettingsPanel.tsx
import React, { useState, useEffect } from 'react';
import { useEditingSessionStore, EditorSettings } from '../../store/useEditingSessionStore';
import AlgorithmSelector from './settings/AlgorithmSelector';
import GeneralControls from './settings/GeneralControls';
import ColorControls from './settings/ColorControls';
import PatternControls from './settings/PatternControls';
import MultiToneControls from './settings/MultiToneControls';
import ImageAdjustments from './settings/ImageAdjustments';
import PresetSelector from './settings/PresetSelector';
import { useThemeStore } from '../../store/useThemeStore';

interface SettingsPanelProps {
  onSavePreset: () => void;
  onBeforeChange?: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  onSavePreset,
  onBeforeChange 
}) => {
  const {
    algorithm,
    contrast,
    colorMode,
    spacing,
    angle,
    customColors,
    dotSize,
    patternType,
    patternSize,
    toneLevel,
    multiToneAlgorithm,
    brightness,
    gammaCorrection,
    hue,
    saturation,
    lightness,
    sharpness,
    blur,
    invert,
    regions,
    myPresets,
    selectedPreset,
    fetchMyPresets,
    selectPreset,
    applySelectedPreset,
    setAlgorithm,
    setContrast,
    setColorMode,
    setSpacing,
    setAngle,
    setCustomColors,
    setPatternType,
    setPatternSize,
    setToneLevel,
    setMultiToneAlgorithm,
    setBrightness,
    setGammaCorrection,
    setHue,
    setSaturation,
    setLightness,
    setSharpness,
    setBlur,
    resetSettings
  } = useEditingSessionStore();
  
  const { darkMode } = useThemeStore();
  
  const [activeTab, setActiveTab] = useState<string>('algorithm');
  
  const tabs = [
    { id: 'algorithm', label: 'Algorithm' },
    { id: 'color', label: 'Color' },
    { id: 'adjustments', label: 'Adjustments' },
    { id: 'presets', label: 'Presets' }
  ];
  
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };
  
  // Load presets on component mount
  useEffect(() => {
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
      // Consider if applying should be automatic on select or require explicit action
      // Example: Apply immediately
      // if (preset) { 
      //   applySelectedPreset(); 
      // }
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
    <div className={`border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg overflow-hidden`}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === tab.id
                ? 'text-primary-600 border-b-2 border-primary-500'
                : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
            }`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {activeTab === 'algorithm' && (
          <div className="space-y-6">
            <AlgorithmSelector onBeforeChange={onBeforeChange} />
            
            {algorithm === 'halftone' && (
              <GeneralControls onBeforeChange={onBeforeChange} />
            )}
            
            {['ordered', 'floydSteinberg', 'atkinson', 'jarvisJudiceNinke', 
              'stucki', 'burkes', 'sierraLite', 'random'].includes(algorithm) && (
              <GeneralControls onBeforeChange={onBeforeChange} />
            )}
            
            {algorithm === 'pattern' && (
              <PatternControls onBeforeChange={onBeforeChange} />
            )}
            
            {algorithm === 'multiTone' && (
              <MultiToneControls onBeforeChange={onBeforeChange} />
            )}
          </div>
        )}
        
        {activeTab === 'color' && (
          <ColorControls onBeforeChange={onBeforeChange} />
        )}
        
        {activeTab === 'adjustments' && (
          <ImageAdjustments onBeforeChange={onBeforeChange} />
        )}
        
        {activeTab === 'presets' && (
          <PresetSelector 
            presets={myPresets}
            selectedPreset={selectedPreset}
            onSelect={(preset) => {
              selectPreset(preset);
              // Consider if applying should be automatic on select or require explicit action
              // Example: Apply immediately
              // if (preset) { 
              //   applySelectedPreset(); 
              // }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;