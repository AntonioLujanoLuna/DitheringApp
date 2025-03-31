import React from 'react';
import { useEditorStore } from '../../../store/useEditorStore';
import { useThemeStore } from '../../../store/useThemeStore';

interface GeneralControlsProps {
  onBeforeChange?: () => void;
}

const GeneralControls: React.FC<GeneralControlsProps> = ({ onBeforeChange }) => {
  const { 
    dotSize, 
    setDotSize, 
    contrast, 
    setContrast, 
    spacing,
    setSpacing,
    angle,
    setAngle,
    algorithm
  } = useEditorStore();
  const { darkMode } = useThemeStore();
  
  const handleChange = (setter: (value: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onBeforeChange) {
      onBeforeChange();
    }
    setter(parseInt(e.target.value));
  };
  
  return (
    <div className="space-y-4">
      {/* Dot size slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium">
            Dot Size: {dotSize}px
          </label>
        </div>
        
        <input
          type="range"
          min="1"
          max="10"
          value={dotSize}
          onChange={handleChange(setDotSize)}
          className="w-full"
        />
      </div>
      
      {/* Contrast slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium">
            Contrast: {contrast}%
          </label>
        </div>
        
        <input
          type="range"
          min="0"
          max="100"
          value={contrast}
          onChange={handleChange(setContrast)}
          className="w-full"
        />
      </div>
      
      {/* Only show spacing and angle for halftone algorithm */}
      {algorithm === 'halftone' && (
        <>
          {/* Spacing slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="block text-sm font-medium">
                Spacing: {spacing}px
              </label>
            </div>
            
            <input
              type="range"
              min="0"
              max="20"
              value={spacing}
              onChange={handleChange(setSpacing)}
              className="w-full"
            />
          </div>
          
          {/* Angle slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="block text-sm font-medium">
                Angle: {angle}°
              </label>
            </div>
            
            <input
              type="range"
              min="0"
              max="90"
              value={angle}
              onChange={handleChange(setAngle)}
              className="w-full"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default GeneralControls; 