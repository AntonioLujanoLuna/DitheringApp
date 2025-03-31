// src/components/editor/SettingsPanel.tsx
import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { usePresetStore } from '../../store/usePresetStore';
import { useRegionStore } from '../../store/useRegionStore';
import { PatternType } from '../../lib/algorithms/patternDithering';
import { MultiToneAlgorithm } from '../../lib/algorithms/multiTone';

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
    setAlgorithm,
    setDotSize,
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
  } = useEditorStore();
  
  const { regions } = useRegionStore();
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
          <option value="jarvisJudiceNinke">Jarvis-Judice-Ninke Dithering</option>
          <option value="stucki">Stucki Dithering</option>
          <option value="burkes">Burkes Dithering</option>
          <option value="sierraLite">Sierra Lite Dithering</option>
          <option value="random">Random Dithering</option>
          <option value="voidAndCluster">Void and Cluster Dithering</option>
          <option value="blueNoise">Blue Noise Dithering</option>
          <option value="riemersma">Riemersma Dithering</option>
          <option value="directBinarySearch">Direct Binary Search Dithering</option>
          <option value="pattern">Pattern Dithering</option>
          <option value="multiTone">Multi-tone Dithering</option>
          <option value="selective">Selective Dithering</option>
        </select>
        
        {algorithm === 'selective' && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm text-blue-800">
                  Selective Dithering lets you apply different dithering algorithms to specific regions.
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  Click "Manage Regions" in the preview to create and configure dithering regions.
                </p>
                <div className="mt-1 text-xs text-blue-600">
                  {regions.length > 0 ? (
                    <span>You have {regions.length} region{regions.length !== 1 ? 's' : ''} defined.</span>
                  ) : (
                    <span>No regions defined yet. Create regions to use selective dithering.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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

      {/* Pattern Dithering Controls */}
      {algorithm === 'pattern' && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Pattern Type
            </label>
            
            <select
              value={patternType}
              onChange={(e) => setPatternType(e.target.value as PatternType)}
              className="input"
            >
              <option value="dots">Dots</option>
              <option value="lines">Lines</option>
              <option value="crosses">Crosses</option>
              <option value="diamonds">Diamonds</option>
              <option value="waves">Waves</option>
              <option value="bricks">Bricks</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Pattern Size: {patternSize}px
              </label>
            </div>
            
            <input
              type="range"
              min="2"
              max="16"
              value={patternSize}
              onChange={(e) => setPatternSize(parseInt(e.target.value))}
              className="slider"
            />
          </div>
        </>
      )}

      {/* Multi-tone Dithering Controls */}
      {algorithm === 'multiTone' && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Multi-tone Algorithm
            </label>
            
            <select
              value={multiToneAlgorithm}
              onChange={(e) => setMultiToneAlgorithm(e.target.value as MultiToneAlgorithm)}
              className="input"
            >
              <option value="ordered">Ordered</option>
              <option value="errorDiffusion">Error Diffusion</option>
              <option value="blueNoise">Blue Noise</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Tone Levels: {toneLevel}
              </label>
            </div>
            
            <input
              type="range"
              min="2"
              max="8"
              value={toneLevel}
              onChange={(e) => setToneLevel(parseInt(e.target.value))}
              className="slider"
            />
          </div>
        </>
      )}

      {/* Image Processing Controls - always visible */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-3">Image Processing</h3>
        
        {/* Brightness slider */}
        <div className="space-y-2 mt-3">
          <div className="flex justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Brightness: {brightness}
            </label>
          </div>
          
          <input
            type="range"
            min="-100"
            max="100"
            value={brightness}
            onChange={(e) => setBrightness(parseInt(e.target.value))}
            className="slider"
          />
        </div>
        
        {/* Gamma correction slider */}
        <div className="space-y-2 mt-3">
          <div className="flex justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Gamma: {gammaCorrection.toFixed(1)}
            </label>
          </div>
          
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={gammaCorrection}
            onChange={(e) => setGammaCorrection(parseFloat(e.target.value))}
            className="slider"
          />
        </div>

        {/* HSL Controls */}
        <div className="space-y-2 mt-3">
          <div className="flex justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Hue: {hue}°
            </label>
          </div>
          
          <input
            type="range"
            min="-180"
            max="180"
            value={hue}
            onChange={(e) => setHue(parseInt(e.target.value))}
            className="slider"
          />
        </div>
        
        <div className="space-y-2 mt-3">
          <div className="flex justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Saturation: {saturation}
            </label>
          </div>
          
          <input
            type="range"
            min="-100"
            max="100"
            value={saturation}
            onChange={(e) => setSaturation(parseInt(e.target.value))}
            className="slider"
          />
        </div>
        
        <div className="space-y-2 mt-3">
          <div className="flex justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Lightness: {lightness}
            </label>
          </div>
          
          <input
            type="range"
            min="-100"
            max="100"
            value={lightness}
            onChange={(e) => setLightness(parseInt(e.target.value))}
            className="slider"
          />
        </div>

        {/* Sharpness slider */}
        <div className="space-y-2 mt-3">
          <div className="flex justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Sharpness: {sharpness}
            </label>
          </div>
          
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={sharpness}
            onChange={(e) => setSharpness(parseFloat(e.target.value))}
            className="slider"
          />
        </div>
        
        {/* Blur slider */}
        <div className="space-y-2 mt-3">
          <div className="flex justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Blur: {blur}
            </label>
          </div>
          
          <input
            type="range"
            min="0"
            max="10"
            value={blur}
            onChange={(e) => setBlur(parseInt(e.target.value))}
            className="slider"
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;