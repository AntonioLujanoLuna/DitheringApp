// src/components/editor/ImageUploader.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useEditorStore } from '../../store/useEditorStore';
import { useThemeStore } from '../../store/useThemeStore';

interface ImageUploaderProps {
  onUpload?: () => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload }) => {
  const { setOriginalImage } = useEditorStore();
  const { darkMode } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Reset error state
    setError(null);
    
    // Start loading
    setLoading(true);
    
    // Create a URL for the file
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      // Create an image to get dimensions
      const img = new Image();
      
      img.onload = () => {
        setOriginalImage(img);
        setLoading(false);
        
        // Call onUpload callback if provided
        if (onUpload) {
          onUpload();
        }
      };
      
      img.onerror = () => {
        setError('Failed to load image. Please try another file.');
        setLoading(false);
      };
      
      img.src = dataUrl;
    };
    
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
      setLoading(false);
    };
    
    reader.readAsDataURL(file);
  }, [setOriginalImage, onUpload]);
  
  // Set up react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    multiple: false
  });
  
  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive 
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
          : darkMode 
            ? 'border-gray-700 hover:border-primary-500' 
            : 'border-gray-300 hover:border-primary-500'
      }`}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
          darkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        {loading ? (
          <div className="animate-pulse">
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading image...</p>
          </div>
        ) : error ? (
          <div className="text-red-500">
            <p>{error}</p>
            <p className="mt-2 text-sm">Click or drag another image to try again.</p>
          </div>
        ) : (
          <>
            <div>
              <p className="font-medium">Drop your image here, or click to select</p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Supports JPEG, PNG, and GIF up to 10MB
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;