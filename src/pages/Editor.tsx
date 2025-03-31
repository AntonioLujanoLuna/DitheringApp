import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ImageUploader from '../components/editor/ImageUploader';
import ImagePreview from '../components/editor/ImagePreview';
import SettingsPanel from '../components/editor/SettingsPanel';
import MobileSettingsPanel from '../components/ui/MobileSettingsPanel';
import BatchProcessor from '../components/batch/BatchProcessor';
import ImageManipulation from '../components/editor/ImageManipulation';
import KeyboardShortcutsModal from '../components/ui/KeyboardShortcutsModal';
import { useEditorStore } from '../store/useEditorStore';
import { usePresetStore } from '../store/usePresetStore';
import { useGalleryStore } from '../store/useGalleryStore';
import { useUserStore } from '../store/useUserStore';
import Button from '../components/ui/Button';
import { useThemeStore } from '../store/useThemeStore';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

const Editor: React.FC = () => {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveAsPresetModalOpen, setSaveAsPresetModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [presetName, setPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showBatchProcessor, setShowBatchProcessor] = useState(false);
  const [showImageManipulation, setShowImageManipulation] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  
  const { darkMode, toggleDarkMode } = useThemeStore();
  const { addToHistory, undo, redo } = useUserStore();
  
  const { 
    originalImage, 
    algorithm, 
    dotSize, 
    contrast, 
    colorMode, 
    spacing, 
    angle,
    customColors,
    patternType,
    patternSize,
    toneLevel,
    multiToneAlgorithm,
    brightness,
    gammaCorrection,
    hue,
    saturation,
    lightness,
    sharpness,
    blur,
    setOriginalImage,
    setAlgorithm,
    setDotSize,
    setContrast,
    setColorMode,
    setSpacing,
    setAngle,
    setCustomColors,
    setPatternType,
    setPatternSize,
    setToneLevel,
    setMultiToneAlgorithm,
    setBrightness,
    setGammaCorrection,
    setHue,
    setSaturation,
    setLightness,
    setSharpness,
    setBlur,
    loadSettings
  } = useEditorStore();
  
  const { createPreset } = usePresetStore();
  const { saveImageToCollection } = useGalleryStore();

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
  
  // Get current settings as an object
  const getCurrentSettings = () => {
    return {
      algorithm,
      dotSize,
      contrast,
      colorMode,
      spacing,
      angle,
      customColors,
      patternType,
      patternSize,
      toneLevel,
      multiToneAlgorithm,
      brightness,
      gammaCorrection,
      hue,
      saturation,
      lightness,
      sharpness,
      blur
    };
  };
  
  // Add current state to history before making changes
  const saveToHistory = () => {
    if (!originalImage) return;
    
    addToHistory(getCurrentSettings());
  };
  
  // Handle undo
  const handleUndo = () => {
    if (!originalImage) return;
    
    const previousSettings = undo();
    if (previousSettings) {
      loadSettings(previousSettings);
      toast.info('Undid last change');
    } else {
      toast.warning('Nothing to undo');
    }
  };
  
  // Handle redo
  const handleRedo = () => {
    if (!originalImage) return;
    
    const nextSettings = redo();
    if (nextSettings) {
      loadSettings(nextSettings);
      toast.info('Redid last change');
    } else {
      toast.warning('Nothing to redo');
    }
  };

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
        processingSettings: getCurrentSettings()
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
        getCurrentSettings()
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
  
  const openImageManipulation = () => {
    if (!originalImage) {
      toast.warning('Please upload an image first.');
      return;
    }
    
    // Save current state before opening manipulation tool
    saveToHistory();
    setShowImageManipulation(true);
  };
  
  const triggerImageUpload = () => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.click();
  };
  
  const toggleShortcutsModal = () => {
    setShowKeyboardShortcuts(!showKeyboardShortcuts);
  };
  
  // Define keyboard shortcuts
  const { shortcuts } = useKeyboardShortcuts([
    {
      key: 's',
      ctrl: true,
      action: openSaveModal,
      description: 'Save image to collection'
    },
    {
      key: 'p',
      ctrl: true,
      action: openSaveAsPresetModal,
      description: 'Save current settings as preset'
    },
    {
      key: 'o',
      ctrl: true,
      action: triggerImageUpload,
      description: 'Open/upload new image'
    },
    {
      key: 'e',
      ctrl: true,
      action: openImageManipulation,
      description: 'Edit image (crop/resize)'
    },
    {
      key: 'd',
      ctrl: true,
      action: toggleDarkMode,
      description: 'Toggle dark/light mode'
    },
    {
      key: 'z',
      ctrl: true,
      action: handleUndo,
      description: 'Undo last change'
    },
    {
      key: 'y',
      ctrl: true,
      action: handleRedo,
      description: 'Redo last change'
    },
    {
      key: '?',
      action: toggleShortcutsModal,
      description: 'Show keyboard shortcuts'
    },
    {
      key: 'Delete',
      action: handleClearImage,
      description: 'Clear current image'
    }
  ]);

  return (
    <div className={`container mx-auto px-4 py-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Image Dithering Editor</h1>
        
        <div className="flex gap-2">
          <Button 
            onClick={toggleShortcutsModal}
            variant="secondary"
            className="hidden md:flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Shortcuts
          </Button>
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
                <ImageUploader onUpload={saveToHistory} />
              </div>
            )}
            
            {isMobile ? (
              <MobileSettingsPanel 
                onSavePreset={openSaveAsPresetModal} 
                onBeforeChange={saveToHistory} 
              />
            ) : (
              <SettingsPanel 
                onSavePreset={openSaveAsPresetModal} 
                onBeforeChange={saveToHistory} 
              />
            )}
          </div>
          
          {/* Right column: Preview and actions */}
          <div className="lg:col-span-2 space-y-6">
            <ImagePreview />
            
            {originalImage && (
              <div className="flex flex-wrap justify-between mt-6 gap-3">
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={openImageManipulation}
                    className={`btn ${darkMode ? 'btn-outline-primary' : 'btn-secondary'} flex items-center gap-2`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Crop & Resize
                  </button>
                  
                  <div className={`flex items-center gap-1 p-1 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <button
                      onClick={handleUndo}
                      className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700`}
                      title="Undo (Ctrl+Z)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </button>
                    <button
                      onClick={handleRedo}
                      className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700`}
                      title="Redo (Ctrl+Y)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              
                <div className="flex flex-wrap gap-2">
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
                  
                  <button 
                    onClick={handleClearImage}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Image
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Save Image Modal */}
      {saveModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900/80' : 'bg-gray-100/80'}`}>
          <div className={`w-full max-w-md rounded-lg shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4">Save to My Collection</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  placeholder="Enter a title for your image"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  placeholder="Add a description"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6 gap-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className={`py-2 px-4 border rounded-lg ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveImage}
                className="py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
                disabled={isSaving || !title}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Save As Preset Modal */}
      {saveAsPresetModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900/80' : 'bg-gray-100/80'}`}>
          <div className={`w-full max-w-md rounded-lg shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4">Save as Preset</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">Preset Name</label>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                placeholder="Enter a name for your preset"
              />
            </div>
            
            <div className="flex justify-end mt-6 gap-2">
              <button
                onClick={() => setSaveAsPresetModalOpen(false)}
                className={`py-2 px-4 border rounded-lg ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreset}
                className="py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
                disabled={isSaving || !presetName}
              >
                {isSaving ? 'Saving...' : 'Save Preset'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Manipulation */}
      {showImageManipulation && (
        <ImageManipulation onClose={() => setShowImageManipulation(false)} />
      )}
      
      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <KeyboardShortcutsModal 
          shortcuts={shortcuts} 
          onClose={toggleShortcutsModal} 
        />
      )}
    </div>
  );
};

export default Editor;