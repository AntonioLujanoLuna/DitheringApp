import { useCallback } from 'react';
import { useEditingSessionStore } from '../store/useEditingSessionStore';

interface UseEditorHistoryReturn {
  saveToHistory: () => void;
  handleUndo: () => void;
}

/**
 * Custom hook to manage editor history operations
 */
export default function useEditorHistory(): UseEditorHistoryReturn {
  const { addToHistory, undo, setIsProcessing } = useEditingSessionStore();
  
  // Save current state to history before making changes
  const saveToHistory = useCallback(() => {
    addToHistory();
  }, [addToHistory]);
  
  // Handle undo action
  const handleUndo = useCallback(() => {
    setIsProcessing(true);
    
    // Small delay to allow UI updates
    setTimeout(() => {
      undo();
      setIsProcessing(false);
    }, 10);
  }, [undo, setIsProcessing]);
  
  return {
    saveToHistory,
    handleUndo
  };
} 