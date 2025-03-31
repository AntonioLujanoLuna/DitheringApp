import { useEffect } from 'react';

interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

const useKeyboardShortcuts = (shortcuts: ShortcutAction[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, altKey, shiftKey } = event;
      
      // Check if the key combination matches any shortcut
      for (const shortcut of shortcuts) {
        const keyMatches = key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? ctrlKey : !ctrlKey;
        const altMatches = shortcut.alt ? altKey : !altKey;
        const shiftMatches = shortcut.shift ? shiftKey : !shiftKey;
        
        if (keyMatches && ctrlMatches && altMatches && shiftMatches) {
          // Prevent default browser action if a match is found
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
  
  // Return the list of shortcuts for display
  return {
    shortcuts: shortcuts.map(shortcut => {
      let combinationText = '';
      
      if (shortcut.ctrl) combinationText += 'Ctrl + ';
      if (shortcut.alt) combinationText += 'Alt + ';
      if (shortcut.shift) combinationText += 'Shift + ';
      
      combinationText += shortcut.key.toUpperCase();
      
      return {
        combination: combinationText,
        description: shortcut.description
      };
    })
  };
};

export default useKeyboardShortcuts; 