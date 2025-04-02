import React from 'react';
import ImageUploader from './ImageUploader';
import { useThemeStore } from '../../store/useThemeStore';

interface EditorEmptyStateProps {
  onUpload: () => void;
}

const EditorEmptyState: React.FC<EditorEmptyStateProps> = ({ onUpload }) => {
  const { darkMode } = useThemeStore();
  
  return (
    <div className={`flex flex-col items-center justify-center p-8 border border-gray-200 dark:border-gray-700 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} h-[500px]`}>
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold mb-3">Get Started</h2>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} max-w-md`}>
          Upload an image to begin creating your dithered masterpiece. We support PNG, JPG, and WEBP formats.
        </p>
      </div>
      
      <ImageUploader onUpload={onUpload} />
      
      <div className="mt-8 text-center">
        <h3 className="text-lg font-medium mb-2">What is Dithering?</h3>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} max-w-md`}>
          Dithering is a technique used to simulate colors or shading using a limited palette. It creates a unique aesthetic by strategically placing pixels to create the illusion of smooth gradients.
        </p>
      </div>
    </div>
  );
};

export default EditorEmptyState; 