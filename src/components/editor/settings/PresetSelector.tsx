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
  
  const handleDeletePreset = async () => {
    if (selectedPreset) {
      try {
        await deletePreset(selectedPreset.id);
        // Optionally: Add success feedback or reset selection
        selectPreset(null); // Clear selection after deletion
      } catch (error) {
        console.error("Failed to delete preset:", error);
        // Optionally: Show error message to the user
      }
    }
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
      
      <div className="flex items-center space-x-2">
        <select
          value={selectedPreset?.id || ''}
          onChange={handlePresetChange}
          className={`flex-grow p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
        >
          <option value="">Select a preset</option>
          {myPresets.map(preset => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        
        <button
          onClick={handleDeletePreset}
          disabled={!selectedPreset || isPresetLoading}
          className={`p-2 rounded-lg ${
            darkMode 
              ? 'bg-red-700 hover:bg-red-800 disabled:bg-gray-600' 
              : 'bg-red-500 hover:bg-red-600 disabled:bg-gray-300'
          } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="Delete selected preset"
        >
          <FiTrash2 />
        </button>
      </div>
      
      {isPresetLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading presets...</p>}
      {presetError && <p className="text-sm text-red-500 dark:text-red-400">Error loading presets: {presetError}</p>}
      
      {myPresets.length === 0 && !isPresetLoading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You don't have any saved presets yet. Save your current settings to create one.
        </p>
      )}
    </div>
  );
};

export default PresetSelector; 