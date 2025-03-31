import React from 'react';
import { useEditorStore } from '../../../store/useEditorStore';
import { useThemeStore } from '../../../store/useThemeStore';

interface ImageAdjustmentsProps {
  onBeforeChange?: () => void;
}

const ImageAdjustments: React.FC<ImageAdjustmentsProps> = ({ onBeforeChange }) => {
  const { 
    brightness, 
    setBrightness,
    contrast, 
    setContrast,
    saturation, 
    setSaturation,
    invert,
    setInvert
  } = useEditorStore();
  const { darkMode } = useThemeStore();
  
  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onBeforeChange) {
      onBeforeChange();
    }
    setBrightness(parseInt(e.target.value));
  };
  
  const handleContrastChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onBeforeChange) {
      onBeforeChange();
    }
    setContrast(parseInt(e.target.value));
  };
  
  const handleSaturationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onBeforeChange) {
      onBeforeChange();
    }
    setSaturation(parseInt(e.target.value));
  };
  
  const handleInvertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onBeforeChange) {
      onBeforeChange();
    }
    setInvert(e.target.checked);
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium">
            Brightness: {brightness}
          </label>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          value={brightness}
          onChange={handleBrightnessChange}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium">
            Contrast: {contrast}
          </label>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          value={contrast}
          onChange={handleContrastChange}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium">
            Saturation: {saturation}
          </label>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          value={saturation}
          onChange={handleSaturationChange}
          className="w-full"
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="invert"
          checked={invert}
          onChange={handleInvertChange}
          className={`h-4 w-4 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
        />
        <label htmlFor="invert" className="text-sm font-medium">
          Invert Colors
        </label>
      </div>
    </div>
  );
};

export default ImageAdjustments; 