import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Button from '../../ui/Button';
import { useThemeStore } from '../../../store/useThemeStore';
import { useEditingSessionStore, EditorSettings } from '../../../store/useEditingSessionStore';

interface SavePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: EditorSettings; // Pass the settings to be saved
}

const SavePresetModal: React.FC<SavePresetModalProps> = ({ 
  isOpen, 
  onClose, 
  currentSettings
}) => {
  const [presetName, setPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { darkMode } = useThemeStore();
  const { createPreset, presetError } = useEditingSessionStore(); // Get action from combined store

  const handleSave = async () => {
    if (!presetName.trim()) {
      toast.error('Please enter a name for your preset');
      return;
    }

    setIsSaving(true);
    try {
      // Call the createPreset action from the store
      await createPreset(presetName, currentSettings);
      
      // Check if there was an error during saving (e.g., empty name)
      const latestError = useEditingSessionStore.getState().presetError;
      if (latestError) {
          toast.error(latestError); // Display error from store
      } else {
          toast.success('Preset saved successfully!');
          setPresetName(''); // Clear name on success
          onClose(); // Close modal on success
      }
    } catch (error: any) {
      // Catch unexpected errors
      console.error('Error saving preset:', error);
      toast.error('Failed to save preset: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    // Modal structure (similar to SaveImageModal)
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900/80' : 'bg-gray-100/80'}`}>
      <div className={`relative w-full max-w-md rounded-lg shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Save Preset</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            disabled={isSaving}
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="space-y-4">
          <div>
            <label htmlFor="presetName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Preset Name
            </label>
            <input
              type="text"
              id="presetName"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter a name for your settings"
              required
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving || !presetName.trim()}>
            Save Preset
          </Button>
        </div>
        {/* End Modal Content */}
        
      </div>
    </div>
  );
};

export default SavePresetModal; 