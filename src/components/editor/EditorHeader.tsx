import React from 'react';
import Button from '../ui/Button';
import { useThemeStore } from '../../store/useThemeStore';

interface EditorHeaderProps {
  onToggleShortcuts?: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({ 
  onToggleShortcuts
}) => {
  const { darkMode } = useThemeStore();
  
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">Image Dithering Editor</h1>
      
      <div className="flex gap-2">
        <Button 
          onClick={onToggleShortcuts}
          variant="secondary"
          className="hidden md:flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Shortcuts
        </Button>
      </div>
    </div>
  );
};

export default EditorHeader; 