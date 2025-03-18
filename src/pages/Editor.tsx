import React, { useState } from 'react';
import { toast } from 'react-toastify';
import ImageUploader from '../components/editor/ImageUploader';
import ImagePreview from '../components/editor/ImagePreview';
import SettingsPanel from '../components/editor/SettingsPanel';
import { useEditorStore } from '../store/useEditorStore';
import { usePresetStore } from '../store/usePresetStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase/client';

const Editor: React.FC = () => {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveAsPresetModalOpen, setSaveAsPresetModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [presetName, setPresetName] = useState('');
  const [presetIsPublic, setPresetIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { 
    originalImage, 
    algorithm, 
    dotSize, 
    contrast, 
    colorMode, 
    spacing, 
    angle,
    customColors 
  } = useEditorStore();
  
  const { createPreset } = usePresetStore();
  const { user } = useAuthStore();

  const handleSaveImage = async () => {
    if (!originalImage || !user) return;
    
    try {
      setIsSaving(true);
      
      // Get the processed image from the canvas
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) throw new Error('Canvas not found');
      
      // Convert canvas to Blob
      const processedBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob from canvas'));
        }, 'image/png');
      });
      
      // Convert original image to Blob
      const originalBlob = await fetch(originalImage.src).then(res => res.blob());
      
      // Upload original image
      const originalFilename = `original-${Date.now()}.png`;
      const { data: originalData, error: originalError } = await supabase
        .storage
        .from('original-images')
        .upload(`${user.id}/${originalFilename}`, originalBlob);
        
      if (originalError) throw originalError;
      
      // Upload processed image
      const processedFilename = `processed-${Date.now()}.png`;
      const { data: processedData, error: processedError } = await supabase
        .storage
        .from('processed-images')
        .upload(`${user.id}/${processedFilename}`, processedBlob);
        
      if (processedError) throw processedError;
      
      // Get public URLs for the uploaded files
      const { data: originalUrl } = supabase
        .storage
        .from('original-images')
        .getPublicUrl(`${user.id}/${originalFilename}`);
        
      const { data: processedUrl } = supabase
        .storage
        .from('processed-images')
        .getPublicUrl(`${user.id}/${processedFilename}`);
      
      // Save to database
      const { error: dbError } = await supabase
        .from('images')
        .insert([
          {
            user_id: user.id,
            title,
            description: description || null,
            original_url: originalUrl.publicUrl,
            processed_url: processedUrl.publicUrl,
            is_public: isPublic,
            processing_settings: {
              algorithm,
              dotSize,
              contrast,
              colorMode,
              spacing,
              angle,
              customColors
            }
          }
        ]);
        
      if (dbError) throw dbError;
      
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
    if (!user) return;
    
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
        },
        presetIsPublic
      );
      
      toast.success('Preset saved successfully!');
      setSaveAsPresetModalOpen(false);
      
      // Reset form
      setPresetName('');
      setPresetIsPublic(false);
      
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
    
    if (!user) {
      toast.warning('Please log in to save your image.');
      return;
    }
    
    setSaveModalOpen(true);
  };

  const openSaveAsPresetModal = () => {
    if (!user) {
      toast.warning('Please log in to save presets.');
      return;
    }
    
    setSaveAsPresetModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Image Dithering Editor</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Image uploader and settings */}
        <div className="lg:col-span-1 space-y-6">
          {!originalImage && (
            <div className="mb-6">
              <ImageUploader />
            </div>
          )}
          
          <SettingsPanel onSavePreset={openSaveAsPresetModal} />
        </div>
        
        {/* Right column: Preview and actions */}
        <div className="lg:col-span-2 space-y-6">
          <ImagePreview />
          
          {originalImage && (
            <div className="flex justify-between mt-6">
              <button 
                onClick={() => setSaveModalOpen(true)}
                className="btn btn-primary"
              >
                Save to My Collection
              </button>
              
              <button 
                onClick={() => document.querySelector('input[type="file"]')?.click()}
                className="btn btn-secondary"
              >
                Upload New Image
              </button>
            </div>
          )}
        </div>
      </div>
      
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