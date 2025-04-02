import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import ImageUploader from '../components/editor/ImageUploader';
import ImagePreview from '../components/editor/ImagePreview';
import SettingsPanel from '../components/editor/SettingsPanel';
import MobileSettingsPanel from '../components/ui/MobileSettingsPanel';
import BatchProcessor from '../components/batch/BatchProcessor';
import ImageManipulation from '../components/editor/ImageManipulation';
import KeyboardShortcutsModal from '../components/ui/KeyboardShortcutsModal';
import { useThemeStore } from '../store/useThemeStore';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { useEditingSessionStore, EditorSettings } from '../store/useEditingSessionStore';
import { useGalleryStore } from '../store/useGalleryStore';
import { useUserStore } from '../store/useUserStore';
import Button from '../components/ui/Button';
import { parseSettingsFromURL } from '../lib/utils/shareUtils';
import { FiShare2, FiSave, FiTrash2 } from 'react-icons/fi';
import SaveImageModal from '../components/editor/modals/SaveImageModal';
import SavePresetModal from '../components/editor/modals/SavePresetModal';
import { useEditorSettings } from '../hooks/useEditorSettings';
import { createPortal } from 'react-dom';
import { isMobile } from 'react-device-detect';

// New component imports
import EditorHeader from '../components/editor/EditorHeader';
import EditorEmptyState from '../components/editor/EditorEmptyState';
import EditorSidebar from '../components/editor/EditorSidebar';
import EditorMainContent from '../components/editor/EditorMainContent';
import ShareModal from '../components/modals/ShareModal';
import useEditorHistory from '../hooks/useEditorHistory';
import useEditorControls from '../hooks/useEditorControls';
import useEditorKeyboardShortcuts from '../hooks/useEditorKeyboardShortcuts';

const Editor: React.FC = () => {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveAsPresetModalOpen, setSaveAsPresetModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showBatchProcessor, setShowBatchProcessor] = useState(false);
  const [showImageManipulation, setShowImageManipulation] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  
  const { darkMode, toggleDarkMode } = useThemeStore();
  const { addToHistory, undo } = useUserStore();
  
  const settings = useEditorSettings();
  
  const { 
    originalImage, 
    loadSettings,
    createPreset,
  } = useEditingSessionStore(state => ({
    originalImage: state.originalImage,
    loadSettings: state.loadSettings,
    createPreset: state.createPreset,
  }));
  
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
      algorithm: settings.algorithm,
      dotSize: settings.dotSize,
      contrast: settings.contrast,
      colorMode: settings.colorMode,
      spacing: settings.spacing,
      angle: settings.angle,
      customColors: settings.customColors,
      patternType: settings.patternType,
      patternSize: settings.patternSize,
      toneLevel: settings.toneLevel,
      toneLevels: settings.toneLevels,
      toneDistribution: settings.toneDistribution,
      multiToneAlgorithm: settings.multiToneAlgorithm,
      brightness: settings.brightness,
      gammaCorrection: settings.gammaCorrection,
      hue: settings.hue,
      saturation: settings.saturation,
      lightness: settings.lightness,
      sharpness: settings.sharpness,
      blur: settings.blur,
      invert: settings.invert
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
  
  const openSaveModal = () => {
    if (!originalImage) {
      toast.error("Please upload and process an image first.");
      return;
    }
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

  // Handle window resize for mobile/desktop detection
  const [isMobileView, setIsMobileView] = useState<boolean>(isMobile);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-6 lg:py-10">
      {/* Editor Header - Title, Breadcrumbs, etc. */}
      <EditorHeader />
      
      {/* Editor Content */}
      {originalImage ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Settings Panel */}
          <EditorSidebar 
            showUploader={!originalImage}
            onUpload={saveToHistory}
            isMobile={isMobileView}
            onSavePreset={openSaveAsPresetModal}
            onBeforeChange={saveToHistory}
          />
          
          {/* Right column: Preview and actions */}
          <EditorMainContent 
            canvasRef={canvasRef}
            originalImage={originalImage}
            onCrop={openImageManipulation}
            onUndo={handleUndo}
            onSave={openSaveModal}
            onClear={handleClearImage}
            onShare={openShareModal}
          />
        </div>
      ) : (
        <EditorEmptyState onUpload={saveToHistory} />
      )}
      
      {/* Modals */}
      <SaveImageModal 
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        originalImageSrc={originalImage?.src || null}
        processedImageCanvas={canvasRef.current}
        currentSettings={getCurrentSettings()}
      />
      
      <SavePresetModal 
        isOpen={saveAsPresetModalOpen}
        onClose={() => setSaveAsPresetModalOpen(false)}
        currentSettings={getCurrentSettings()}
      />
      
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareLink={shareLink}
        onViewSharePage={() => navigate(`/share?${shareLink.split('?')[1]}`)}
      />
      
      {showKeyboardShortcuts && (
        <KeyboardShortcutsModal 
          shortcuts={shortcuts} 
          onClose={toggleShortcutsModal} 
        />
      )}
      
      {showImageManipulation && originalImage && (
        <ImageManipulation
          onClose={() => setShowImageManipulation(false)}
        />
      )}
    </div>
  );
};

export default Editor;