import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useEditorStore } from '../../store/useEditorStore';

const ImageUploader: React.FC = () => {
  const { setOriginalImage } = useEditorStore();
  const [error, setError] = useState<string | null>(null);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const img = new Image();
        img.onload = () => {
          // Check image dimensions (limit to reasonable size)
          if (img.width > 3000 || img.height > 3000) {
            setError("Image too large. Please use an image smaller than 3000x3000 pixels.");
            return;
          }
          
          setOriginalImage(img);
        };
        img.onerror = () => {
          setError("Failed to load image. Please try another file.");
        };
        img.src = e.target.result as string;
      }
    };
    reader.onerror = () => {
      setError("Failed to read file. Please try another file.");
    };
    reader.readAsDataURL(file);
  }, [setOriginalImage]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDropRejected: () => {
      setError("File rejected. Please use a valid image file under 5MB.");
    }
  });

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              onDrop([file]);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onDrop]);
  
  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-3">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? 'Drop your image here' : 'Drag & drop your image here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
            <p className="text-xs text-gray-400 mt-2">Supports PNG, JPG, GIF, BMP, WEBP (max 5MB)</p>
            <p className="text-xs text-gray-400">You can also paste from clipboard (Ctrl+V)</p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;