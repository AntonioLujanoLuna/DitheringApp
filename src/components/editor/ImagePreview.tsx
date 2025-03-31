// src/components/editor/ImagePreview.tsx
import React, { useEffect, useRef } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { processImage } from '../../lib/algorithms';

const ImagePreview: React.FC = () => {
  const {
    originalImage,
    algorithm,
    dotSize,
    contrast,
    colorMode,
    spacing,
    angle,
    customColors,
    isProcessing,
    setIsProcessing
  } = useEditorStore();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Process the image when parameters change
  useEffect(() => {
    if (!originalImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const processCurrentImage = async () => {
      setIsProcessing(true);
      
      try {
        // Set canvas dimensions to match the image
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        
        // Process the image with current settings
        const processedImageData = processImage(
          originalImage,
          algorithm,
          dotSize,
          contrast,
          colorMode,
          spacing,
          angle,
          customColors
        );
        
        // Draw the processed image to the canvas
        ctx.putImageData(processedImageData, 0, 0);
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        setIsProcessing(false);
      }
    };
    
    // Use a small timeout to avoid too frequent processing
    const timeoutId = setTimeout(() => {
      processCurrentImage();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [
    originalImage,
    algorithm,
    dotSize,
    contrast,
    colorMode,
    spacing,
    angle,
    customColors,
    setIsProcessing
  ]);
  
  // Download the processed image
  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `halftone-${algorithm}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };
  
  if (!originalImage) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-gray-200 rounded-lg bg-gray-50 h-96">
        <p className="text-gray-500">Upload an image to see the preview</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Preview</h2>
        
        <button
          onClick={handleDownload}
          className="btn btn-secondary flex items-center gap-2"
          disabled={isProcessing}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>
      
      <div className="relative border border-gray-200 rounded-lg overflow-hidden">
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
          </div>
        )}
        
        <div className="w-full overflow-auto">
          <canvas
            ref={canvasRef}
            className="max-w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;