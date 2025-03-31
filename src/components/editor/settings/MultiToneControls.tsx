import React from 'react';
import { useEditorStore } from '../../../store/useEditorStore';
import { useThemeStore } from '../../../store/useThemeStore';

interface MultiToneControlsProps {
  onBeforeChange?: () => void;
}

const MultiToneControls: React.FC<MultiToneControlsProps> = ({ onBeforeChange }) => {
  const { 
    toneLevels, 
    setToneLevels,
    toneDistribution,
    setToneDistribution
  } = useEditorStore();
  const { darkMode } = useThemeStore();
  
  const handleToneLevelsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onBeforeChange) {
      onBeforeChange();
    }
    setToneLevels(parseInt(e.target.value));
  };
  
  const handleDistributionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onBeforeChange) {
      onBeforeChange();
    }
    setToneDistribution(e.target.value as 'linear' | 'logarithmic' | 'exponential');
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium">
            Tone Levels: {toneLevels}
          </label>
        </div>
        
        <input
          type="range"
          min="2"
          max="10"
          value={toneLevels}
          onChange={handleToneLevelsChange}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Tone Distribution
        </label>
        
        <select
          value={toneDistribution}
          onChange={handleDistributionChange}
          className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
        >
          <option value="linear">Linear</option>
          <option value="logarithmic">Logarithmic</option>
          <option value="exponential">Exponential</option>
        </select>
      </div>
    </div>
  );
};

export default MultiToneControls; 