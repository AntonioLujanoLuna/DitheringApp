import React from 'react';
import { useEditorStore } from '../../../store/useEditorStore';
import { useThemeStore } from '../../../store/useThemeStore';
import { PatternType } from '../../../lib/algorithms/patternDithering';

interface PatternControlsProps {
  onBeforeChange?: () => void;
}

const PatternControls: React.FC<PatternControlsProps> = ({ onBeforeChange }) => {
  const { 
    patternType, 
    setPatternType, 
    patternSize, 
    setPatternSize 
  } = useEditorStore();
  const { darkMode } = useThemeStore();
  
  const handlePatternTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onBeforeChange) {
      onBeforeChange();
    }
    setPatternType(e.target.value as PatternType);
  };
  
  const handlePatternSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onBeforeChange) {
      onBeforeChange();
    }
    setPatternSize(parseInt(e.target.value));
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Pattern Type
        </label>
        
        <select
          value={patternType}
          onChange={handlePatternTypeChange}
          className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
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
          <label className="block text-sm font-medium">
            Pattern Size: {patternSize}px
          </label>
        </div>
        
        <input
          type="range"
          min="2"
          max="16"
          value={patternSize}
          onChange={handlePatternSizeChange}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default PatternControls; 