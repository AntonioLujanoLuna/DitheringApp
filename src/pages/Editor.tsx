import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/useThemeStore';
import { useEditingSessionStore, EditorSettings } from '../store/useEditingSessionStore';
import { useUserStore } from '../store/useUserStore';
import SaveImageModal from '../components/editor/modals/SaveImageModal';
import SavePresetModal from '../components/editor/modals/SavePresetModal';
import { useEditorSettings } from '../hooks/useEditorSettings';
import KeyboardShortcutsModal, { KeyboardShortcut } from '../components/ui/KeyboardShortcutsModal';
import ImageManipulation from '../components/editor/ImageManipulation';
import EditorHeader from '../components/editor/EditorHeader';
import EditorEmptyState from '../components/editor/EditorEmptyState';
import EditorSidebar from '../components/editor/EditorSidebar';
import EditorMainContent from '../components/editor/EditorMainContent';
import ShareModal from '../components/modals/ShareModal';

// Type for internal shortcut definition
interface ShortcutDefinition {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean; // Added alt for completeness, though not used yet
  action: () => void;
  description: string;
}

const Editor: React.FC = () => {
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveAsPresetModalOpen, setSaveAsPresetModalOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(window.innerWidth < 768);
  const [showImageManipulation, setShowImageManipulation] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  
  const { darkMode, toggleDarkMode } = useThemeStore();
  const { addToHistory, undo, clearHistory } = useUserStore();
  
  const settings = useEditorSettings();
  
  const {
    originalImage,
    loadSettings,
    createPreset,
    reset
  } = useEditingSessionStore(state => ({
    originalImage: state.originalImage,
    loadSettings: state.loadSettings,
    createPreset: state.createPreset,
    reset: state.reset
  }));
  
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Detect mobile viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
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
    const previousState = undo();
    if (previousState) {
      console.log("Applying previous state:", previousState);
      loadSettings(previousState as Partial<EditorSettings>);
    }
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
      reset();
      clearHistory();
    }
  };
  
  const openImageManipulation = () => {
    if (!originalImage) {
        toast.error("Please upload an image first.");
        return;
    }
    setShowImageManipulation(true);
  };
  
  const triggerImageUpload = () => {
    const fileInput = document.querySelector('#file-upload-input');
    if (fileInput) {
      (fileInput as HTMLInputElement).click();
    }
  };
  
  const toggleShortcutsModal = () => {
    setShowKeyboardShortcuts(!showKeyboardShortcuts);
  };
  
  const openShareModal = () => {
    if (!originalImage || !canvasRef.current) {
      toast.error('Please process an image first');
      return;
    }
    const canvas = canvasRef.current;
    setShareModalOpen(true);
    const settings = getCurrentSettings();
    createSharingLink(settings, canvas);
  };
  
  const createSharingLink = (settings: EditorSettings, canvas: HTMLCanvasElement) => {
    const params = new URLSearchParams();
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) params.append(key, value.join(','));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const previewCanvas = document.createElement('canvas');
    const maxSize = 300;
    const aspectRatio = canvas.width / canvas.height;
    let previewWidth = aspectRatio > 1 ? maxSize : maxSize * aspectRatio;
    let previewHeight = aspectRatio > 1 ? maxSize / aspectRatio : maxSize;
    previewCanvas.width = previewWidth;
    previewCanvas.height = previewHeight;
    const ctx = previewCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, previewWidth, previewHeight);
      const previewDataUrl = previewCanvas.toDataURL('image/jpeg', 0.7);
      if (previewDataUrl.length < 4000) {
          params.append('preview', previewDataUrl);
      } else {
          console.warn("Preview image too large for URL.");
      }
    }
    
    const shareUrl = `${window.location.origin}${window.location.pathname}#/share?${params.toString()}`;
    setShareLink(shareUrl);
  };
  
  // Internal shortcut definitions
  const shortcutDefinitions: ShortcutDefinition[] = [
    { key: 's', ctrl: true, action: openSaveModal, description: 'Save image' },
    { key: 'p', ctrl: true, action: openSaveAsPresetModal, description: 'Save as preset' },
    { key: 'o', ctrl: true, action: triggerImageUpload, description: 'Open image' },
    { key: 'e', ctrl: true, action: openImageManipulation, description: 'Edit image' },
    { key: 'd', ctrl: true, action: toggleDarkMode, description: 'Toggle dark mode' },
    { key: 'z', ctrl: true, action: handleUndo, description: 'Undo' },
    { key: '?', action: toggleShortcutsModal, description: 'Show shortcuts' },
    { key: 'Delete', action: handleClearImage, description: 'Clear image' },
    { key: 's', shift: true, ctrl: true, action: openShareModal, description: 'Share settings' }
  ];

  // Transform shortcuts for the modal
  const modalShortcuts: KeyboardShortcut[] = shortcutDefinitions.map(s => {
    let combination = '';
    if (s.ctrl) combination += 'Ctrl + ';
    if (s.shift) combination += 'Shift + ';
    if (s.alt) combination += 'Alt + ';
    combination += s.key.length === 1 ? s.key.toUpperCase() : s.key; // Capitalize single keys
    return { combination, description: s.description };
  });

  // Setup keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement && ('tagName' in activeElement) && [
        'INPUT', 'TEXTAREA', 'SELECT'
      ].includes(activeElement.tagName)) {
          return;
      }

      shortcutDefinitions.forEach(shortcut => {
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() && // Case-insensitive key match
          (shortcut.ctrl === undefined || event.ctrlKey === shortcut.ctrl) &&
          (shortcut.shift === undefined || event.shiftKey === shortcut.shift) &&
          (shortcut.alt === undefined || event.altKey === shortcut.alt) // Correct check for alt
        ) {
          event.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcutDefinitions]); // Dependency array includes definitions

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-6 lg:py-10">
      <EditorHeader />
      
      {originalImage ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <EditorSidebar 
            showUploader={!originalImage} // Pass the required prop
            onUpload={saveToHistory}
            isMobile={isMobileView}
            onSavePreset={openSaveAsPresetModal}
            onBeforeChange={saveToHistory}
          />
          
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
          shortcuts={modalShortcuts} // Pass the transformed shortcuts
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