import React from 'react';
import { useEditorStore } from '../../../store/useEditorStore';
import { useThemeStore } from '../../../store/useThemeStore';

interface ColorControlsProps {
  onBeforeChange?: () => void;
}

const ColorControls: React.FC<ColorControlsProps> = ({ onBeforeChange }) => {
  const { 
    colorMode, 
    setColorMode,
    customColors,
    setCustomColors
  } = useEditorStore();
  const { darkMode } = useThemeStore();
  
  const handleColorModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onBeforeChange) {
      onBeforeChange();
    }
    setColorMode(e.target.value as 'bw' | 'cmyk' | 'rgb' | 'custom');
  };
  
  const handleColorChange = (index: number, color: string) => {
    if (onBeforeChange) {
      onBeforeChange();
    }
    const newColors = [...customColors];
    newColors[index] = color;
    setCustomColors(newColors);
  };
  
  const handleAddColor = () => {
    if (onBeforeChange) {
      onBeforeChange();
    }
    setCustomColors([...customColors, '#000000']);
  };
  
  const handleRemoveColor = (index: number) => {
    if (onBeforeChange) {
      onBeforeChange();
    }
    const newColors = [...customColors];
    newColors.splice(index, 1);
    setCustomColors(newColors);
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Color Mode
        </label>
        
        <select
          value={colorMode}
          onChange={handleColorModeChange}
          className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
        >
          <option value="bw">Black & White</option>
          <option value="cmyk">CMYK</option>
          <option value="rgb">RGB</option>
          <option value="custom">Custom Colors</option>
        </select>
      </div>
      
      {colorMode === 'custom' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            Custom Colors
          </label>
          
          {customColors.map((color, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(index, e.target.value)}
                className="h-8 w-12 border-none"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => handleColorChange(index, e.target.value)}
                className={`flex-1 p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
              {customColors.length > 2 && (
                <button
                  onClick={() => handleRemoveColor(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          
          <button
            onClick={handleAddColor}
            className="flex items-center text-primary-600 hover:text-primary-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Color
          </button>
        </div>
      )}
    </div>
  );
};

export default ColorControls; 