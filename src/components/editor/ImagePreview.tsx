// src/components/editor/ImagePreview.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { useRegionStore, Region } from '../../store/useRegionStore';
import { processImage } from '../../lib/algorithms';
import { selectiveDithering, createCircularMask, createRectangularMask, createPolygonMask, MaskRegion } from '../../lib/algorithms/selectiveDithering';
import RegionSelector from '../regions/RegionSelector';
import ImageComparison from './ImageComparison';
import { useThemeStore } from '../../store/useThemeStore';
import { processImageProgressively } from '../../lib/webgl/progressiveProcessing';
import { isWebGLSupported } from '../../lib/webgl/webglDithering';
import { downloadSVG } from '../../lib/export/svgExport';

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
    patternType,
    patternSize,
    isProcessing,
    setIsProcessing
  } = useEditorStore();
  
  const { darkMode } = useThemeStore();
  const { regions } = useRegionStore();
  const [showRegionSelector, setShowRegionSelector] = useState<boolean>(false);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [useWebGL, setUseWebGL] = useState<boolean>(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Check if WebGL can be used for this algorithm
  useEffect(() => {
    if (!originalImage) return;
    
    const canUseWebGL = isWebGLSupported() && 
      (algorithm === 'ordered' || algorithm === 'halftone' || algorithm === 'pattern');
    setUseWebGL(canUseWebGL);
  }, [originalImage, algorithm]);
  
  // Process the image when parameters change
  useEffect(() => {
    if (!originalImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const processCurrentImage = async () => {
      setIsProcessing(true);
      setShowProgress(true);
      setProgressPercent(0);
      
      try {
        // Set canvas dimensions to match the image
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        
        if (algorithm === 'selective' && regions.length > 0) {
          // Process with selective dithering when we have regions defined
          await processWithSelectiveDithering(originalImage, canvas);
        } else if (useWebGL) {
          // Use WebGL-accelerated progressive processing
          processImageProgressively(
            originalImage,
            algorithm,
            {
              dotSize,
              contrast,
              colorMode,
              spacing,
              angle,
              patternType,
              patternSize,
              onProgress: (progress, partialResult) => {
                setProgressPercent(progress);
                
                // Show incremental updates if available
                if (partialResult && ctx) {
                  ctx.putImageData(partialResult, 0, 0);
                }
              },
              onComplete: (result) => {
                ctx.putImageData(result, 0, 0);
                setIsProcessing(false);
                setShowProgress(false);
              }
            }
          );
          
          // Don't continue since the asynchronous processing is handled by callbacks
          return;
        } else {
          // Process with standard single algorithm (CPU-based)
          const processedImageData = processImage(
            originalImage,
            algorithm,
            dotSize,
            contrast,
            colorMode,
            spacing,
            angle,
            customColors,
            0, // brightness
            1.0, // gamma
            0, // hue
            0, // saturation
            0, // lightness
            0, // sharpness
            0, // blur radius
            patternType,
            patternSize
          );
          
          // Draw the processed image to the canvas
          ctx.putImageData(processedImageData, 0, 0);
        }
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        setIsProcessing(false);
        setShowProgress(false);
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
    patternType,
    patternSize,
    regions,
    useWebGL,
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
  
  // Toggle comparison view
  const toggleComparisonView = () => {
    setShowComparison(!showComparison);
  };
  
  // Download the processed image
  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `halftone-${algorithm}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };
  
  // Download SVG version - best for halftone and pattern effects
  const handleDownloadSVG = () => {
    if (!canvasRef.current) return;
    
    downloadSVG(
      canvasRef.current,
      algorithm,
      {
        dotSize,
        spacing,
        angle,
        patternType,
        simplified: false, // Better quality (larger file)
        fileName: `halftone-${algorithm}-vector-${Date.now()}.svg`,
      }
    );
  };
  
  if (!originalImage) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 border border-gray-200 dark:border-gray-700 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} h-96`}>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Upload an image to see the preview</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          Preview
          {useWebGL && <span className="ml-2 text-xs text-primary-600 font-normal">(GPU Accelerated)</span>}
        </h2>
        
        <div className="flex space-x-2">
          <button
            onClick={toggleComparisonView}
            className={`btn ${showComparison ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
            disabled={isProcessing}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
            </svg>
            {showComparison ? 'Standard View' : 'Comparison View'}
          </button>
          
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
          
          <div className="dropdown dropdown-end">
            <button 
              className="btn btn-secondary flex items-center gap-2"
              disabled={isProcessing}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <ul className="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <a onClick={handleDownload}>
                  <span className="text-sm">PNG Image</span>
                </a>
              </li>
              <li>
                <a onClick={handleDownloadSVG}>
                  <span className="text-sm">SVG Vector</span>
                  {(algorithm === 'halftone' || algorithm === 'pattern') && 
                    <span className="badge badge-sm badge-primary">Recommended</span>
                  }
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className={`relative border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg overflow-hidden`}>
        {isProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-gray-800/70 z-10">
            {showProgress ? (
              <>
                <div className="w-48 mb-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {progressPercent}% complete
                  </p>
                </div>
              </>
            ) : (
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
            )}
          </div>
        )}
        
        <div className="w-full overflow-auto">
          {showComparison ? (
            <div className="h-[500px]">
              <ImageComparison 
                originalSrc={originalImage.src}
                processedCanvas={canvasRef.current}
              />
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="max-w-full"
            />
          )}
        </div>
        
        {showRegionSelector && (
          <RegionSelector 
            originalImage={originalImage}
            canvasRef={canvasRef}
          />
        )}
      </div>
    </div>
  );
};

export default ImagePreview;