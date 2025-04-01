import React, { RefObject } from 'react';
import ProcessingOverlay from './ProcessingOverlay';
import ImageComparison from './ImageComparison';
import ProcessedImageView from './ProcessedImageView';
import RegionSelector from '../regions/RegionSelector';

interface ImagePreviewDisplayProps {
  isProcessing: boolean;
  showProgress: boolean;
  progressPercent: number;
  darkMode: boolean;
  showComparison: boolean;
  originalImage: HTMLImageElement; // Needed for Comparison and RegionSelector
  canvasRef: RefObject<HTMLCanvasElement>;
  showRegionSelector: boolean;
}

const ImagePreviewDisplay: React.FC<ImagePreviewDisplayProps> = ({ 
  isProcessing, 
  showProgress, 
  progressPercent, 
  darkMode, 
  showComparison, 
  originalImage, 
  canvasRef, 
  showRegionSelector 
}) => {
  return (
    <div className={`relative border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg overflow-hidden`}>
      <ProcessingOverlay 
        isProcessing={isProcessing} 
        showProgress={showProgress} 
        progressPercent={progressPercent} 
      />
      
      <div className="w-full overflow-auto">
        {showComparison ? (
          <div className="h-[500px]"> {/* Adjust height as needed */}
            <ImageComparison 
              originalSrc={originalImage.src}
              processedCanvas={canvasRef.current}
            />
          </div>
        ) : (
          <ProcessedImageView ref={canvasRef} />
        )}
      </div>
      
      {showRegionSelector && (
        <RegionSelector 
          originalImage={originalImage}
          canvasRef={canvasRef}
        />
      )}
    </div>
  );
};

export default ImagePreviewDisplay; 