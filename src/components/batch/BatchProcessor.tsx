// src/components/batch/BatchProcessor.tsx
import React, { useState } from 'react';
import { useEditingSessionStore } from '../../store/useEditingSessionStore';
import Button from '../ui/Button';
import { processImageProgressively, ProgressiveOptions } from '../../lib/processing/progressive';
import { isWebGLSupported } from '../../lib/webgl/webglDithering';
import { toast } from 'react-toastify';

const BatchProcessor: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processedImages, setProcessedImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentImageProgress, setCurrentImageProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [usingWebGL, setUsingWebGL] = useState(false);
  
  const {
    algorithm,
    dotSize,
    contrast,
    colorMode,
    spacing,
    angle,
    customColors,
    patternType,
    patternSize,
  } = useEditingSessionStore();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setProcessedImages([]);
      
      // Check if WebGL is supported
      setUsingWebGL(isWebGLSupported() && 
        (algorithm === 'ordered' || algorithm === 'halftone' || algorithm === 'pattern'));
    }
  };
  
  const handleProcessImages = async () => {
    if (!selectedFiles.length) return;
    
    setIsProcessing(true);
    setProgress(0);
    setCurrentImageIndex(0);
    setCurrentImageProgress(0);
    setProcessedImages([]);
    
    try {
      // Load all images first
      const dataUrls = await Promise.all(selectedFiles.map(readFileAsDataURL));
      const images = await Promise.all(dataUrls.map(loadImage));
      
      const processedImageDatas: ImageData[] = [];
      
      // Process images sequentially using the unified processor
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        setCurrentImageIndex(i);
        setCurrentImageProgress(0); // Reset progress for the new image

        // Get ImageData for the current image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
          console.error(`Could not get context for image ${i}`);
          // Optionally push a placeholder or skip this image
          continue;
        }
        tempCtx.drawImage(img, 0, 0);
        const sourceImageData = tempCtx.getImageData(0, 0, img.width, img.height);

        // Process using progressive processor (awaiting completion)
        const processedData = await new Promise<ImageData>((resolve, reject) => {
          const progressiveOpts: ProgressiveOptions = {
            sourceImageData: sourceImageData,
            algorithm,
            dotSize,
            contrast,
            colorMode,
            spacing,
            angle,
            customColors,
            patternType,
            patternSize,
            // Pass other relevant settings from store
            progressSteps: 5, // Allow some progress steps per image
            onProgress: (imageProgress) => {
              setCurrentImageProgress(imageProgress); // Update specific image progress
            },
            onComplete: (result) => {
              resolve(result);
            },
            onError: (error) => {
              console.error(`Error processing image ${i}:`, error);
              reject(error); // Or resolve with original sourceImageData as fallback?
            }
          };
          processImageProgressively(progressiveOpts);
        });

        processedImageDatas.push(processedData);
        
        // Update overall batch progress
        setProgress(Math.round(((i + 1) / images.length) * 100));
        
        // Update the preview list with the newly processed image
        const dataUrls = processedImageDatas.map(imgData => {
            const canvas = document.createElement('canvas');
            canvas.width = imgData.width;
            canvas.height = imgData.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return '';
            ctx.putImageData(imgData, 0, 0);
            return canvas.toDataURL('image/png');
        });
        setProcessedImages(dataUrls); 
      }

      setIsProcessing(false);
      
      // Final update to processedImages (might be redundant if updated in loop)
      const finalDataUrls = processedImageDatas.map(imgData => {
          const canvas = document.createElement('canvas');
          canvas.width = imgData.width;
          canvas.height = imgData.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return '';
          ctx.putImageData(imgData, 0, 0);
          return canvas.toDataURL('image/png');
      });
      setProcessedImages(finalDataUrls); 
      
    } catch (error) {
      console.error('Error processing batch:', error);
      toast.error(`Error processing batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          
          {/* Overall progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Overall Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          {/* Current image progress */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Image {currentImageIndex + 1} of {selectedFiles.length}</span>
              <span>{currentImageProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${currentImageProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
      
      {processedImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Processed Images ({processedImages.length} of {selectedFiles.length})
          </h3>
          
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