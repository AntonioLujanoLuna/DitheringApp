import React from 'react';
import { useThemeStore } from '../../store/useThemeStore';

// Export the interface
export interface KeyboardShortcut {
  combination: string;
  description: string;
}

interface KeyboardShortcutsModalProps {
  shortcuts: KeyboardShortcut[];
  onClose: () => void;
}

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ 
  shortcuts, 
  onClose 
}) => {
  const { darkMode } = useThemeStore();
  
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900/80' : 'bg-gray-100/80'}`}>
      <div className={`relative w-full max-w-md rounded-lg shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div 
              key={index}
              className={`flex justify-between p-2 rounded ${index % 2 === 0 ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
            >
              <span className="font-medium">{shortcut.description}</span>
              <kbd className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-200 text-gray-800'}`}>
                {shortcut.combination}
              </kbd>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Press the indicated key combinations to perform actions quickly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal; 