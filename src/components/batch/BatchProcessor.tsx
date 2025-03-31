// src/components/batch/BatchProcessor.tsx
import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import Button from '../ui/Button';

const BatchProcessor: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const {
    algorithm,
    dotSize,
    contrast,
    colorMode,
    spacing,
    angle,
    customColors
  } = useEditorStore();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setProcessedImages([]);
    }
  };
  
  const handleProcessImages = async () => {
    if (!selectedFiles.length) return;
    
    setIsProcessing(true);
    setProgress(0);
    setProcessedImages([]);
    
    try {
      const results = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Read file as data URL
        const dataUrl = await readFileAsDataURL(file);
        
        // Create image element
        const img = await loadImage(dataUrl);
        
        // Process the image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        
        ctx.drawImage(img, 0, 0);
        
        // Get the image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Process image using the editor's settings
        const { processImage } = await import('../../lib/algorithms');
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
        
        // Put the processed data back on the canvas
        ctx.putImageData(processedData, 0, 0);
        
        // Get the data URL
        const processedDataUrl = canvas.toDataURL('image/png');
        results.push(processedDataUrl);
        
        // Update progress
        setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }
      
      setProcessedImages(results);
    } catch (error) {
      console.error('Error processing images:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };
  
  const handleDownloadAll = () => {
    processedImages.forEach((dataUrl, index) => {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `halftone-${index + 1}.png`;
      link.click();
    });
  };
  
  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Batch Image Processing</h2>
        
        <p className="text-gray-600 mb-4">
          Process multiple images at once with the current settings from the editor.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Images
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100"
            />
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={handleProcessImages}
              disabled={!selectedFiles.length || isProcessing}
              isLoading={isProcessing}
            >
              Process {selectedFiles.length} Image{selectedFiles.length !== 1 ? 's' : ''}
            </Button>
            
            {processedImages.length > 0 && (
              <Button
                variant="secondary"
                onClick={handleDownloadAll}
              >
                Download All
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {isProcessing && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Processing...</h3>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <p className="text-center mt-2 text-sm text-gray-600">
            {progress}% complete
          </p>
        </div>
      )}
      
      {processedImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Processed Images ({processedImages.length})</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {processedImages.map((src, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <img src={src} alt={`Processed ${index + 1}`} className="w-full aspect-square object-cover" />
                
                <div className="p-2 bg-white border-t border-gray-200">
                  <a 
                    href={src} 
                    download={`halftone-${index + 1}.png`}
                    className="text-sm text-primary-600 hover:text-primary-800 flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchProcessor;