import { useCallback } from 'react';
import { useEditingSessionStore } from '../store/useEditingSessionStore';
import { dataURLToCanvas } from '../lib/utils/imageUtils';

interface UseEditorControlsProps {
  setSaveModalOpen: (open: boolean) => void;
  setSaveAsPresetModalOpen: (open: boolean) => void;
  setShowImageManipulation: (show: boolean) => void;
  setShowKeyboardShortcuts: (show: boolean) => void;
  setShareModalOpen: (open: boolean) => void;
  setShareLink: (link: string) => void;
}

interface UseEditorControlsReturn {
  openSaveModal: () => void;
  openSaveAsPresetModal: () => void;
  handleClearImage: () => void;
  openImageManipulation: () => void;
  triggerImageUpload: () => void;
  toggleShortcutsModal: () => void;
  openShareModal: () => void;
}

/**
 * Custom hook to manage editor control operations
 */
export default function useEditorControls({
  setSaveModalOpen,
  setSaveAsPresetModalOpen,
  setShowImageManipulation,
  setShowKeyboardShortcuts,
  setShareModalOpen,
  setShareLink
}: UseEditorControlsProps): UseEditorControlsReturn {
  const { 
    setOriginalImage, 
    canvasRef,
    algorithm,
    dotSize,
    contrast,
    colorMode,
    spacing,
    angle,
    customColors,
    patternType,
    patternSize
  } = useEditingSessionStore();
  
  // Open save modal
  const openSaveModal = useCallback(() => {
    setSaveModalOpen(true);
  }, [setSaveModalOpen]);
  
  // Open save preset modal
  const openSaveAsPresetModal = useCallback(() => {
    setSaveAsPresetModalOpen(true);
  }, [setSaveAsPresetModalOpen]);
  
  // Clear the current image
  const handleClearImage = useCallback(() => {
    setOriginalImage(null);
  }, [setOriginalImage]);
  
  // Open image manipulation modal
  const openImageManipulation = useCallback(() => {
    setShowImageManipulation(true);
  }, [setShowImageManipulation]);
  
  // Trigger the file input to upload a new image
  const triggerImageUpload = useCallback(() => {
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }, []);
  
  // Toggle keyboard shortcuts modal
  const toggleShortcutsModal = useCallback(() => {
    setShowKeyboardShortcuts(prev => !prev);
  }, [setShowKeyboardShortcuts]);
  
  // Open share modal with current settings
  const openShareModal = useCallback(() => {
    // Create a share link with current settings and canvas preview
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const thumbnail = dataURLToCanvas(canvas.toDataURL('image/jpeg', 0.5), 400, 300);
    
    // Create a query string with parameters
    const params = new URLSearchParams();
    params.append('algorithm', algorithm);
    params.append('dotSize', dotSize.toString());
    params.append('contrast', contrast.toString());
    params.append('colorMode', colorMode);
    params.append('spacing', spacing.toString());
    params.append('angle', angle.toString());
    
    if (customColors.length > 0) {
      params.append('customColors', JSON.stringify(customColors));
    }
    
    if (patternType) {
      params.append('patternType', patternType);
    }
    
    if (patternSize) {
      params.append('patternSize', patternSize.toString());
    }
    
    // Add thumbnail image
    params.append('preview', thumbnail.toDataURL('image/jpeg', 0.7));
    
    // Create share link
    const shareLink = `${window.location.origin}/share?${params.toString()}`;
    setShareLink(shareLink);
    
    // Open modal
    setShareModalOpen(true);
  }, [
    canvasRef,
    algorithm,
    dotSize,
    contrast,
    colorMode,
    spacing,
    angle,
    customColors,
    patternType,
    patternSize,
    setShareLink,
    setShareModalOpen
  ]);
  
  return {
    openSaveModal,
    openSaveAsPresetModal,
    handleClearImage,
    openImageManipulation,
    triggerImageUpload,
    toggleShortcutsModal,
    openShareModal
  };
} 