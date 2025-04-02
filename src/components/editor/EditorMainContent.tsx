import React, { RefObject } from 'react';
import { useThemeStore } from '../../store/useThemeStore';
import ImagePreview from './ImagePreview';

interface EditorMainContentProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  originalImage: HTMLImageElement;
  onCrop: () => void;
  onUndo: () => void;
  onSave: () => void;
  onClear: () => void;
  onShare: () => void;
}

const EditorMainContent: React.FC<EditorMainContentProps> = ({
  canvasRef,
  originalImage,
  onCrop,
  onUndo,
  onSave,
  onClear,
  onShare
}) => {
  const { darkMode } = useThemeStore();
  
  return (
    <div className="lg:col-span-2 space-y-6">
      <ImagePreview />
      
      <div className="flex flex-wrap justify-between mt-6 gap-3">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={onCrop}
            className={`btn ${darkMode ? 'btn-outline-primary' : 'btn-secondary'} flex items-center gap-2`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Crop & Resize
          </button>
          
          <div className={`flex items-center gap-1 p-1 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <button
              onClick={onUndo}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700`}
              title="Undo (Ctrl+Z)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        </div>
      
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={onShare}
            className="btn btn-primary-outline flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          
          <button 
            onClick={onSave}
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
            Save to Collection
          </button>
          
          <button 
            onClick={onClear}
            className="btn btn-secondary flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorMainContent; 