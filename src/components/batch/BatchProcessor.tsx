import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useEditorStore } from '../../store/useEditorStore';
import { processImage } from '@/lib/algorithms';
import Button from '../ui/Button';
import { toast } from 'react-toastify';

interface BatchImage {
  id: string;
  file: File;
  originalUrl: string | null;
  processedUrl: string | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

const BatchProcessor: React.FC = () => {
  const [images, setImages] = useState<BatchImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  
  const { 
    algorithm, 
    dotSize, 
    contrast, 
    colorMode, 
    spacing, 
    angle,
    customColors
  } = useEditorStore();
  
  // Setup dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      originalUrl: URL.createObjectURL(file),
      processedUrl: null,
      status: 'pending' as const
    }));
    
    setImages(prev => [...prev, ...newImages]);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });
  
  const processAllImages = async () => {
    if (images.length === 0 || isProcessing) return;
    
    try {
      setIsProcessing(true);
      setProcessedCount(0);
      
      // Update all images to processing status
      setImages(prev => prev.map(img => ({
        ...img,
        status: img.status === 'pending' ? 'processing' : img.status
      })));
      
      // Process images one by one
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        // Skip already processed images
        if (image.status === 'done' || image.status === 'error') {
          continue;
        }
        
        try {
          // Load the image
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load image: ${image.file.name}`));
            img.src = image.originalUrl!;
          });
          
          // Process the image
          const processedData = processImage(
            img,
            algorithm,
            dotSize,
            contrast,
            colorMode,
            spacing,
            angle,
            customColors
          );
          
          // Create a canvas to get the processed image URL
          const canvas = document.createElement('canvas');
          canvas.width = processedData.width;
          canvas.height = processedData.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get canvas context');
          
          ctx.putImageData(processedData, 0, 0);
          
          // Get the processed image as a URL
          const processedUrl = canvas.toDataURL('image/png');
          
          // Update the image in the state
          setImages(prev => prev.map(img => 
            img.id === image.id 
              ? { ...img, processedUrl, status: 'done' as const } 
              : img
          ));
          
          setProcessedCount(prev => prev + 1);
        } catch (error) {
          console.error(`Error processing image: ${image.file.name}`, error);
          
          // Update the image status to error
          setImages(prev => prev.map(img => 
            img.id === image.id 
              ? { ...img, status: 'error' as const, error: error instanceof Error ? error.message : 'Unknown error' } 
              : img
          ));
        }
      }
      
      toast.success(`Processed ${processedCount} images`);
    } catch (error) {
      console.error('Error in batch processing:', error);
      toast.error('An error occurred during batch processing');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const downloadAll = () => {
    // Create a zip file with all processed images
    // For simplicity, we'll just download them one by one
    images.forEach(image => {
      if (image.processedUrl && image.status === 'done') {
        const link = document.createElement('a');
        link.href = image.processedUrl;
        link.download = `dithered-${image.file.name.split('.')[0]}.png`;
        link.click();
      }
    });
    
    toast.success('Download started for all processed images');
  };
  
  const clearAll = () => {
    // Revoke all object URLs to prevent memory leaks
    images.forEach(image => {
      if (image.originalUrl) URL.revokeObjectURL(image.originalUrl);
    });
    
    setImages([]);
    setProcessedCount(0);
  };
  
  const removeImage = (id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove?.originalUrl) {
        URL.revokeObjectURL(imageToRemove.originalUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Batch Processing</h2>
          <p className="text-gray-600">Process multiple images with the current settings</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={processAllImages}
            variant="primary"
            isLoading={isProcessing}
            disabled={images.length === 0 || isProcessing}
          >
            Process All ({images.length})
          </Button>
          
          <Button
            onClick={downloadAll}
            variant="secondary"
            disabled={processedCount === 0}
          >
            Download All
          </Button>
          
          <Button
            onClick={clearAll}
            variant="ghost"
            disabled={images.length === 0}
          >
            Clear All
          </Button>
        </div>
      </div>
      
      {/* Dropzone */}
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
              {isDragActive ? 'Drop your images here' : 'Drag & drop multiple images here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
            <p className="text-xs text-gray-400 mt-2">Supports PNG, JPG, GIF, BMP, WEBP (max 10MB each)</p>
          </div>
        </div>
      </div>
      
      {/* Progress */}
      {isProcessing && (
        <div className="bg-blue-50 rounded-lg p-4 flex items-center">
          <div className="animate-spin mr-3 h-5 w-5 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <span className="text-blue-700">
            Processing images... {processedCount}/{images.length}
          </span>
        </div>
      )}
      
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="border rounded-lg overflow-hidden">
              <div className="flex justify-between items-center p-2 bg-gray-50 border-b">
                <span className="text-sm font-medium truncate" title={image.file.name}>
                  {image.file.name}
                </span>
                <div className="flex items-center">
                  {image.status === 'pending' && (
                    <span className="text-gray-500 text-xs mr-2">Pending</span>
                  )}
                  {image.status === 'processing' && (
                    <span className="text-blue-500 text-xs mr-2">Processing...</span>
                  )}
                  {image.status === 'done' && (
                    <span className="text-green-500 text-xs mr-2">Complete</span>
                  )}
                  {image.status === 'error' && (
                    <span className="text-red-500 text-xs mr-2" title={image.error}>
                      Error
                    </span>
                  )}
                  <button
                    onClick={() => removeImage(image.id)}
                    className="text-gray-400 hover:text-red-500"
                    aria-label="Remove image"
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
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-1 p-2">
                {/* Original image */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {image.originalUrl ? (
                    <img 
                      src={image.originalUrl} 
                      alt={`Original ${image.file.name}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">No preview</div>
                  )}
                </div>
                
                {/* Processed image */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {image.status === 'processing' ? (
                    <div className="animate-spin h-8 w-8 border-2 border-primary-500 rounded-full border-t-transparent"></div>
                  ) : image.processedUrl ? (
                    <img 
                      src={image.processedUrl} 
                      alt={`Processed ${image.file.name}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">
                      {image.status === 'error' ? 'Processing failed' : 'Not processed yet'}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              {image.status === 'done' && (
                <div className="p-2 border-t bg-gray-50 flex justify-center">
                  <a 
                    href={image.processedUrl!}
                    download={`dithered-${image.file.name.split('.')[0]}.png`}
                    className="text-primary-600 text-sm font-medium hover:text-primary-800 flex items-center"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 mr-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                      />
                    </svg>
                    Download
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BatchProcessor;