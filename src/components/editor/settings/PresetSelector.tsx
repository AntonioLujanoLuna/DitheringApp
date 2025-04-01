import React, { useEffect, useState } from 'react';
import { useEditingSessionStore, Preset } from '../../../store/useEditingSessionStore';
import { FiSave, FiTrash2 } from 'react-icons/fi';
import { useThemeStore } from '../../../store/useThemeStore';

interface PresetSelectorProps {
  onSavePreset: () => void;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({ onSavePreset }) => {
  const {
    myPresets,
    selectedPreset,
    isPresetLoading,
    presetError,
    fetchMyPresets,
    selectPreset,
    deletePreset,
    applySelectedPreset
  } = useEditingSessionStore();
  const { darkMode } = useThemeStore();
  
  // Load presets on component mount
  useEffect(() => {
    fetchMyPresets();
  }, [fetchMyPresets]);
  
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetId = e.target.value;
    const preset = myPresets.find(p => p.id === presetId);
    selectPreset(preset || null);
    if (preset) {
      applySelectedPreset();
    }
  };
  
  const handleDeletePreset = async (id: string) => {
    // Implementation of handleDeletePreset function
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Saved Presets</h3>
        
        <button 
          onClick={onSavePreset}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Save Current Settings
        </button>
      </div>
      
      <select
        value={selectedPreset?.id || ''}
        onChange={handlePresetChange}
        className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
      >
        <option value="">Select a preset</option>
        {myPresets.map(preset => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>
      
      {myPresets.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You don't have any saved presets yet. Save your current settings to create one.
        </p>
      )}
    </div>
  );
};

export default PresetSelector; 