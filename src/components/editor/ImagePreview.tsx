// src/components/editor/ImagePreview.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { useRegionStore, Region } from '../../store/useRegionStore';
import { processImage } from '../../lib/algorithms';
import { selectiveDithering, createCircularMask, createRectangularMask, createPolygonMask, MaskRegion } from '../../lib/algorithms/selectiveDithering';
import RegionSelector from '../regions/RegionSelector';

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
  
  const { regions } = useRegionStore();
  const [showRegionSelector, setShowRegionSelector] = useState<boolean>(false);
  
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
        
        if (algorithm === 'selective' && regions.length > 0) {
          // Process with selective dithering when we have regions defined
          await processWithSelectiveDithering(originalImage, canvas);
        } else {
          // Process with standard single algorithm
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
        }
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
    regions,
    setIsProcessing
  ]);
  
  // Function to process the image with selective dithering
  const processWithSelectiveDithering = async (
    sourceImage: HTMLImageElement,
    canvas: HTMLCanvasElement
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw the original image to get pixel data
    ctx.drawImage(sourceImage, 0, 0);
    
    // Get grayscale image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const grayscaleArray = new Uint8ClampedArray(canvas.width * canvas.height);
    
    // Convert to grayscale (basic luminance conversion)
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      
      // Weighted luminance formula
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const idx = i / 4;
      grayscaleArray[idx] = luminance;
    }
    
    // Create mask regions
    const maskRegions: MaskRegion[] = regions.map(region => {
      let mask: Uint8ClampedArray;
      
      if (region.type === 'circle' && region.centerX !== undefined && 
          region.centerY !== undefined && region.radius !== undefined) {
        mask = createCircularMask(
          canvas.width,
          canvas.height,
          region.centerX,
          region.centerY,
          region.radius,
          region.feather
        );
      } 
      else if (region.type === 'rectangle' && region.x1 !== undefined && 
               region.y1 !== undefined && region.x2 !== undefined && region.y2 !== undefined) {
        mask = createRectangularMask(
          canvas.width,
          canvas.height,
          region.x1,
          region.y1,
          region.x2,
          region.y2,
          region.feather
        );
      }
      else if (region.type === 'polygon' && region.vertices) {
        mask = createPolygonMask(
          canvas.width,
          canvas.height,
          region.vertices,
          region.feather
        );
      }
      else {
        // Fallback to empty mask
        mask = new Uint8ClampedArray(canvas.width * canvas.height);
      }
      
      return {
        mask,
        algorithm: region.algorithm,
        dotSize: region.dotSize,
        spacing: region.spacing,
        angle: region.angle,
        threshold: region.threshold
      };
    });
    
    // Apply selective dithering
    const processedImageData = selectiveDithering(
      grayscaleArray,
      canvas.width,
      canvas.height,
      maskRegions,
      algorithm === 'selective' ? 'ordered' : algorithm, // Default algorithm if no regions are selected
      128, // Default threshold
      dotSize,
      spacing,
      angle
    );
    
    // Update the canvas with the processed data
    ctx.putImageData(processedImageData, 0, 0);
  };
  
  // Toggle region selector
  const toggleRegionSelector = () => {
    setShowRegionSelector(!showRegionSelector);
  };
  
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
        
        <div className="flex space-x-2">
          {algorithm === 'selective' && (
            <button
              onClick={toggleRegionSelector}
              className={`btn ${showRegionSelector ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
              disabled={isProcessing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
              {showRegionSelector ? 'Hide Regions' : 'Manage Regions'}
            </button>
          )}
          
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
      
      {/* Region selector */}
      {algorithm === 'selective' && showRegionSelector && originalImage && (
        <RegionSelector 
          imageWidth={originalImage.width} 
          imageHeight={originalImage.height}
        />
      )}
    </div>
  );
};

export default ImagePreview;