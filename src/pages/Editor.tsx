import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ImageUploader from '../components/editor/ImageUploader';
import ImagePreview from '../components/editor/ImagePreview';
import SettingsPanel from '../components/editor/SettingsPanel';
import MobileSettingsPanel from '../components/ui/MobileSettingsPanel';
import BatchProcessor from '../components/batch/BatchProcessor';
import { useEditorStore } from '../store/useEditorStore';
import { usePresetStore } from '../store/usePresetStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase/client';
import Button from '../components/ui/Button';

const Editor: React.FC = () => {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveAsPresetModalOpen, setSaveAsPresetModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [presetName, setPresetName] = useState('');
  const [presetIsPublic, setPresetIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showBatchProcessor, setShowBatchProcessor] = useState(false);
  
  const { 
    originalImage, 
    algorithm, 
    dotSize, 
    contrast, 
    colorMode, 
    spacing, 
    angle,
    customColors,
    setOriginalImage
  } = useEditorStore();
  
  const { createPreset } = usePresetStore();
  const { user } = useAuthStore();

  // Detect mobile viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSaveImage = async () => {
    if (!originalImage) return;
    
    try {
      setIsSaving(true);
      
      // Get the processed image from the canvas
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) throw new Error('Canvas not found');
      
      // Convert canvas to data URL
      const processedUrl = canvas.toDataURL('image/png');
      
      // Use the gallery store to save the image
      await saveImageToCollection({
        title,
        description: description || null,
        originalUrl: originalImage.src,
        processedUrl,
        processingSettings: {
          algorithm,
          dotSize,
          contrast,
          colorMode,
          spacing,
          angle,
          customColors
        }
      });
      
      toast.success('Image saved successfully!');
      setSaveModalOpen(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      
    } catch (error: any) {
      console.error('Error saving image:', error);
      toast.error(`Error saving image: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreset = async () => {
    try {
      setIsSaving(true);
      
      await createPreset(
        presetName, 
        {
          algorithm,
          dotSize,
          contrast,
          colorMode,
          spacing,
          angle,
          customColors
        }
      );
      
      toast.success('Preset saved successfully!');
      setSaveAsPresetModalOpen(false);
      
      // Reset form
      setPresetName('');
      
    } catch (error: any) {
      console.error('Error saving preset:', error);
      toast.error(`Error saving preset: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openSaveModal = () => {
    if (!originalImage) {
      toast.warning('Please upload an image first.');
      return;
    }
    
    setSaveModalOpen(true);
  };
  
  const openSaveAsPresetModal = () => {
    setSaveAsPresetModalOpen(true);
  };

  const handleClearImage = () => {
    // Show confirmation before clearing
    if (window.confirm('Are you sure you want to clear the current image? Any unsaved changes will be lost.')) {
      setOriginalImage(null);
      toast.info('Image cleared. Upload a new image to continue.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Image Dithering Editor</h1>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowBatchProcessor(!showBatchProcessor)}
            variant="secondary"
          >
            {showBatchProcessor ? 'Single Image Mode' : 'Batch Processing'}
          </Button>
        </div>
      </div>
      
      {showBatchProcessor ? (
        <BatchProcessor />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Image uploader and settings */}
          <div className="lg:col-span-1 space-y-6">
            {!originalImage && (
              <div className="mb-6">
                <ImageUploader />
              </div>
            )}
            
            {isMobile ? (
              <MobileSettingsPanel onSavePreset={openSaveAsPresetModal} />
            ) : (
              <SettingsPanel onSavePreset={openSaveAsPresetModal} />
            )}
          </div>
          
          {/* Right column: Preview and actions */}
          <div className="lg:col-span-2 space-y-6">
            <ImagePreview />
            
            {originalImage && (
              <div className="flex flex-wrap justify-between mt-6 gap-3">
                <button 
                  onClick={openSaveModal}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" 
                    />
                  </svg>
                  Save to My Collection
                </button>
                
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={handleClearImage}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                      />
                    </svg>
                    Clear Image
                  </button>
                  <button 
                    onClick={() => document.querySelector('input[type="file"]')?.click()}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                      />
                    </svg>
                    Upload New Image
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Save Image Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Save Image</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title (required)
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="Enter a title for your image"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input min-h-[100px]"
                  placeholder="Add a description..."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="isPublic"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                  Share to Community Gallery
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveImage}
                disabled={!title || isSaving}
                className="btn btn-primary"
              >
                {isSaving ? 'Saving...' : 'Save Image'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Save as Preset Modal */}
      {saveAsPresetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Save as Preset</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="presetName" className="block text-sm font-medium text-gray-700 mb-1">
                  Preset Name (required)
                </label>
                <input
                  id="presetName"
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="input"
                  placeholder="Enter a name for your preset"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="presetIsPublic"
                  type="checkbox"
                  checked={presetIsPublic}
                  onChange={(e) => setPresetIsPublic(e.target.checked)}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
                <label htmlFor="presetIsPublic" className="ml-2 block text-sm text-gray-700">
                  Share to Community Presets
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSaveAsPresetModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                disabled={!presetName || isSaving}
                className="btn btn-primary"
              >
                {isSaving ? 'Saving...' : 'Save Preset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;