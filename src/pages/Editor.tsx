import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ImageUploader from '../components/editor/ImageUploader';
import ImagePreview from '../components/editor/ImagePreview';
import SettingsPanel from '../components/editor/SettingsPanel';
import MobileSettingsPanel from '../components/ui/MobileSettingsPanel';
import BatchProcessor from '../components/batch/BatchProcessor';
import AnimationProcessor from '../components/animation/AnimationProcessor';
import ImageManipulation from '../components/editor/ImageManipulation';
import KeyboardShortcutsModal from '../components/ui/KeyboardShortcutsModal';
import { useEditorStore, EditorSettings } from '../store/useEditorStore';
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
  const [showAnimationProcessor, setShowAnimationProcessor] = useState(false);
  const [showImageManipulation, setShowImageManipulation] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  
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
    loadSettings 
  } = useEditorStore();
  
  const { createPreset } = usePresetStore();
  const { saveImageToCollection } = useGalleryStore();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Detect mobile viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Get current settings for saving or sharing
  const getCurrentSettings = (): EditorSettings => {
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
      brightness: 0,
      gamma: 1.0,
      hue: 0,
      saturation: 0,
      lightness: 0,
      sharpness: 0,
      blur: 0,
      toneLevels: 0,
      toneDistribution: 'linear',
      invert: false
    };
  };
  
  // Save state to history before making changes
  const saveToHistory = () => {
    if (originalImage) {
      addToHistory(getCurrentSettings());
    }
  };
  
  // Undo
  const handleUndo = () => {
    undo();
  };
  
  // Redo
  const handleRedo = () => {
    redo();
  };
  
  // Handle save image
  const handleSaveImage = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title for your image');
      return;
    }
    
    if (!originalImage) {
      toast.error('Please upload an image first');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Get the processed image from the canvas
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const processedUrl = canvas.toDataURL('image/png');
      
      // Save to collection
      await saveImageToCollection({
        title,
        description: description || null,
        processedUrl,
        originalUrl: originalImage.src,
        processingSettings: getCurrentSettings()
      });
      
      // Add sharing options
      setShareLink('');
      setShareModalOpen(false);
      setSaveModalOpen(false);
      setTitle('');
      setDescription('');
      
      // Show success with share option
      toast.success(
        <div>
          Image saved to collection!
          <button 
            onClick={() => openShareModal()} 
            className="ml-2 text-primary-700 underline"
          >
            Share it
          </button>
        </div>
      );
    } catch (error: any) {
      console.error('Error saving image:', error);
      toast.error('Failed to save image');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle save preset
  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error('Please enter a name for your preset');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Create new preset
      await createPreset({
        name: presetName,
        settings: getCurrentSettings()
      });
      
      toast.success('Preset saved successfully!');
      setSaveAsPresetModalOpen(false);
      setPresetName('');
    } catch (error: any) {
      console.error('Error saving preset:', error);
      toast.error('Failed to save preset');
    } finally {
      setIsSaving(false);
    }
  };
  
  const openSaveModal = () => {
    setSaveModalOpen(true);
  };
  
  const openSaveAsPresetModal = () => {
    setSaveAsPresetModalOpen(true);
  };
  
  const handleClearImage = () => {
    if (window.confirm('Are you sure you want to clear this image?')) {
      // Clear the image (implementation depends on your store setup)
      window.location.reload();
    }
  };
  
  const openImageManipulation = () => {
    setShowImageManipulation(true);
  };
  
  const triggerImageUpload = () => {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };
  
  const toggleShortcutsModal = () => {
    setShowKeyboardShortcuts(!showKeyboardShortcuts);
  };
  
  const openShareModal = () => {
    if (!originalImage) {
      toast.error('Please process an image first');
      return;
    }
    
    // Get canvas reference from ImagePreview component
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) {
      toast.error('Cannot find processed image');
      return;
    }
    
    canvasRef.current = canvas;
    setShareModalOpen(true);
    
    // Generate sharing data
    const settings = getCurrentSettings();
    createSharingLink(settings);
  };
  
  const createSharingLink = (settings: EditorSettings) => {
    // Create URL parameters from settings
    const params = new URLSearchParams();
    
    if (settings.algorithm) params.append('algorithm', settings.algorithm);
    if (settings.dotSize !== undefined) params.append('dotSize', settings.dotSize.toString());
    if (settings.contrast !== undefined) params.append('contrast', settings.contrast.toString());
    if (settings.colorMode) params.append('colorMode', settings.colorMode);
    if (settings.spacing !== undefined) params.append('spacing', settings.spacing.toString());
    if (settings.angle !== undefined) params.append('angle', settings.angle.toString());
    if (settings.customColors && settings.customColors.length) 
      params.append('colors', settings.customColors.join(','));
    
    // Add preview image if available
    if (canvasRef.current) {
      // Create a smaller preview image
      const previewCanvas = document.createElement('canvas');
      const maxSize = 300; // Max width or height for preview
      
      // Scale to fit within maxSize
      const aspectRatio = canvasRef.current.width / canvasRef.current.height;
      let previewWidth, previewHeight;
      
      if (aspectRatio > 1) {
        previewWidth = maxSize;
        previewHeight = maxSize / aspectRatio;
      } else {
        previewHeight = maxSize;
        previewWidth = maxSize * aspectRatio;
      }
      
      previewCanvas.width = previewWidth;
      previewCanvas.height = previewHeight;
      
      const ctx = previewCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvasRef.current, 0, 0, previewWidth, previewHeight);
        const previewDataUrl = previewCanvas.toDataURL('image/jpeg', 0.7);
        params.append('preview', previewDataUrl);
      }
    }
    
    const shareUrl = `${window.location.origin}/#/share?${params.toString()}`;
    setShareLink(shareUrl);
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
    },
    {
      key: 's',
      shift: true,
      ctrl: true,
      action: openShareModal,
      description: 'Share current settings'
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
          
          <div className="dropdown dropdown-end">
            <Button 
              variant="secondary"
              className="flex items-center gap-2"
            >
              Processing Mode
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
            <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10">
              <li>
                <a 
                  onClick={() => {
                    setShowBatchProcessor(false);
                    setShowAnimationProcessor(false);
                  }}
                  className={!showBatchProcessor && !showAnimationProcessor ? "active" : ""}
                >
                  Single Image
                </a>
              </li>
              <li>
                <a 
                  onClick={() => {
                    setShowBatchProcessor(true);
                    setShowAnimationProcessor(false);
                  }}
                  className={showBatchProcessor ? "active" : ""}
                >
                  Batch Processing
                </a>
              </li>
              <li>
                <a 
                  onClick={() => {
                    setShowBatchProcessor(false);
                    setShowAnimationProcessor(true);
                  }}
                  className={showAnimationProcessor ? "active" : ""}
                >
                  Animation (GIF)
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {showBatchProcessor ? (
        <BatchProcessor />
      ) : showAnimationProcessor ? (
        <AnimationProcessor />
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
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  placeholder="Enter a title for your image"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                  placeholder="Add a description..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-6 gap-2">
              <Button
                onClick={() => setSaveModalOpen(false)}
                variant="secondary"
                disabled={isSaving}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleSaveImage}
                isLoading={isSaving}
              >
                Save Image
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Save As Preset Modal */}
      {saveAsPresetModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900/80' : 'bg-gray-100/80'}`}>
          <div className={`w-full max-w-md rounded-lg shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4">Save as Preset</h2>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Save your current settings as a preset to quickly apply them to future images.
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-1">Preset Name</label>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                placeholder="Enter a name for your preset"
              />
            </div>
            
            <div className="flex justify-end mt-6 gap-2">
              <Button
                onClick={() => setSaveAsPresetModalOpen(false)}
                variant="secondary"
                disabled={isSaving}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleSavePreset}
                isLoading={isSaving}
              >
                Save Preset
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Share Modal */}
      {shareModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900/80' : 'bg-gray-100/80'}`}>
          <div className={`w-full max-w-md rounded-lg shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4">Share Your Creation</h2>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Share this link to let others apply these exact settings to their own images. The link includes a preview of your current result.
              </p>
              
              <div className="flex">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 p-2 border border-gray-300 rounded-l-md text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    toast.success('Link copied to clipboard!');
                  }}
                  className="bg-primary-500 text-white px-3 py-2 rounded-r-md hover:bg-primary-600"
                >
                  Copy
                </button>
              </div>
              
              <div className="flex justify-between mt-2">
                <button
                  onClick={() => {
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out this image effect I created!')}&url=${encodeURIComponent(shareLink)}`, '_blank');
                  }}
                  className="text-blue-400 hover:text-blue-500"
                >
                  Share on Twitter
                </button>
                
                <button
                  onClick={() => {
                    navigate(`/share?${shareLink.split('?')[1]}`);
                  }}
                  className="text-primary-600 hover:text-primary-700"
                >
                  View Share Page
                </button>
              </div>
            </div>
            
            <div className="flex justify-end mt-6 gap-2">
              <Button
                onClick={() => setShareModalOpen(false)}
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <KeyboardShortcutsModal 
          shortcuts={shortcuts} 
          onClose={() => setShowKeyboardShortcuts(false)} 
        />
      )}
      
      {/* Image Manipulation Modal */}
      {showImageManipulation && originalImage && (
        <ImageManipulation
          image={originalImage}
          onClose={() => setShowImageManipulation(false)}
        />
      )}
    </div>
  );
};

export default Editor;