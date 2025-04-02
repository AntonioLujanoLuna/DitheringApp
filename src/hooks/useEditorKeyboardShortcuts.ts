import { useMemo } from 'react';

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
}

interface UseEditorKeyboardShortcutsProps {
  handleUndo: () => void;
  openSaveModal: () => void;
  triggerImageUpload: () => void;
  toggleShortcutsModal: () => void;
}

interface UseEditorKeyboardShortcutsReturn {
  shortcuts: Shortcut[];
}

/**
 * Custom hook to manage keyboard shortcuts for the editor
 */
export default function useEditorKeyboardShortcuts({
  handleUndo,
  openSaveModal,
  triggerImageUpload,
  toggleShortcutsModal
}: UseEditorKeyboardShortcutsProps): UseEditorKeyboardShortcutsReturn {
  // Define common shortcuts
  const shortcuts = useMemo<Shortcut[]>(() => [
    {
      key: 'Ctrl+Z',
      description: 'Undo the last change',
      action: handleUndo
    },
    {
      key: 'Ctrl+S',
      description: 'Save the current image',
      action: openSaveModal
    },
    {
      key: 'Ctrl+O',
      description: 'Open/upload a new image',
      action: triggerImageUpload
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: toggleShortcutsModal
    }
  ], [handleUndo, openSaveModal, triggerImageUpload, toggleShortcutsModal]);
  
  return { shortcuts };
} 