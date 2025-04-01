// src/components/editor/ImagePreview.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useEditingSessionStore, Region } from '../../store/useEditingSessionStore';
import { processImage } from '../../lib/algorithms'; // Keep for selective dithering fallback maybe?
import { selectiveDithering, createCircularMask, createRectangularMask, createPolygonMask, MaskRegion } from '../../lib/algorithms/selectiveDithering';
import RegionSelector from '../regions/RegionSelector';
import ImageComparison from './ImageComparison';
import { useThemeStore } from '../../store/useThemeStore';
import { processImageProgressively, ProgressiveOptions } from '../../lib/processing/progressive'; // Import the NEW progressive processor
import { downloadSVG } from '../../lib/export/svgExport';
import ProcessedImageView from './ProcessedImageView'; // Import the new component
import ProcessingOverlay from './ProcessingOverlay'; // Import the new overlay component
import ImagePreviewHeader from './ImagePreviewHeader'; // Import the header component
import ImagePreviewDisplay from './ImagePreviewDisplay'; // Import the display component
import { useImageProcessor } from '../../hooks/useImageProcessor'; // Import the new hook
import { useImageExporter } from '../../hooks/useImageExporter'; // Import the exporter hook

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
    regions
  } = useEditingSessionStore();
  
  const { darkMode } = useThemeStore();
  const [showRegionSelector, setShowRegionSelector] = useState<boolean>(false);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Use the image processor hook
  const { isProcessing, progressPercent, showProgress } = useImageProcessor({
    canvasRef,
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
    // Pass other settings as needed
  });
  
  // Use the image exporter hook
  const { handleDownload, handleDownloadSVG } = useImageExporter({
    canvasRef,
    algorithm,
    dotSize,
    spacing,
    angle,
    patternType,
    // Pass other settings if needed
  });
  
  // Toggle region selector
  const toggleRegionSelector = () => {
    setShowRegionSelector(!showRegionSelector);
  };
  
  // Toggle comparison view
  const toggleComparisonView = () => {
    setShowComparison(!showComparison);
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
      {/* Render the ImagePreviewHeader */}
      <ImagePreviewHeader
        showComparison={showComparison}
        toggleComparisonView={toggleComparisonView}
        algorithm={algorithm}
        showRegionSelector={showRegionSelector}
        toggleRegionSelector={toggleRegionSelector}
        isProcessing={isProcessing}
        handleDownload={handleDownload}
        handleDownloadSVG={handleDownloadSVG}
      />
      
      {/* Render the ImagePreviewDisplay component */}
      <ImagePreviewDisplay
        isProcessing={isProcessing}
        showProgress={showProgress}
        progressPercent={progressPercent}
        darkMode={darkMode}
        showComparison={showComparison}
        originalImage={originalImage} // Pass originalImage
        canvasRef={canvasRef}
        showRegionSelector={showRegionSelector}
      />
    </div>
  );
};

export default ImagePreview;