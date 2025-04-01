import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Button from '../../ui/Button';
import { useThemeStore } from '../../../store/useThemeStore'; // For dark mode styling
import { EditorSettings } from '../../../store/useEditingSessionStore';
import { useGalleryStore } from '../../../store/useGalleryStore'; // Needed for saving

interface SaveImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImageSrc: string | null; // Pass necessary data
  processedImageCanvas: HTMLCanvasElement | null; // Pass canvas reference or data URL
  currentSettings: EditorSettings;
}

const SaveImageModal: React.FC<SaveImageModalProps> = ({ 
  isOpen, 
  onClose, 
  originalImageSrc,
  processedImageCanvas,
  currentSettings
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { saveImageToCollection } = useGalleryStore();
  const { darkMode } = useThemeStore(); // Get dark mode state

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title for your image');
      return;
    }
    if (!originalImageSrc || !processedImageCanvas) {
      toast.error('Image data is missing');
      return;
    }

    setIsSaving(true);
    try {
      // Get the processed image from the canvas
      const processedUrl = processedImageCanvas.toDataURL('image/png');
      
      await saveImageToCollection({
        title,
        description: description || null,
        processedUrl,
        originalUrl: originalImageSrc,
        processingSettings: currentSettings
      });

      toast.success('Image saved successfully!');
      setTitle('');
      setDescription('');
      onClose(); // Close modal on success
    } catch (error: any) {
      console.error('Error saving image:', error);
      toast.error('Failed to save image: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    // Replicated modal structure
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900/80' : 'bg-gray-100/80'}`}>
      <div className={`relative w-full max-w-lg rounded-lg shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Save to Collection</h2>
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
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description (Optional)
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
        {/* End Modal Content */}
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving || !title.trim()}>
            Save Image
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SaveImageModal; 