import React, { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../../store/useThemeStore';

interface ImageComparisonProps {
  originalSrc: string;
  processedCanvas: HTMLCanvasElement | null;
}

const ImageComparison: React.FC<ImageComparisonProps> = ({ 
  originalSrc, 
  processedCanvas 
}) => {
  const { darkMode } = useThemeStore();
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle mouse and touch events for slider
  const handleMouseDown = () => {
    setIsDragging(true);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    
    // Get container dimensions
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Get mouse/touch x position
    let clientX;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    // Calculate position as percentage
    const position = ((clientX - containerRect.left) / containerRect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };
  
  // Add and remove event listeners
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);
  
  return (
    <div className="w-full h-full">
      <div 
        ref={containerRef}
        className="relative w-full h-full overflow-hidden border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        {/* Original image (left side) */}
        <div className="absolute top-0 left-0 w-full h-full">
          <img 
            src={originalSrc} 
            alt="Original" 
            className="object-contain w-full h-full"
          />
        </div>
        
        {/* Processed image (right side with clip-path) */}
        <div 
          className="absolute top-0 left-0 w-full h-full"
          style={{ 
            clipPath: `inset(0 0 0 ${sliderPosition}%)` 
          }}
        >
          {processedCanvas && (
            <div className="w-full h-full flex items-center justify-center">
              <img 
                src={processedCanvas.toDataURL()} 
                alt="Processed" 
                className="object-contain max-w-full max-h-full"
              />
            </div>
          )}
        </div>
        
        {/* Slider */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-md cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Slider handle - more visible and touch-friendly */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full border-2 border-primary-500 shadow-md flex items-center justify-center touch-manipulation">
            <svg className="w-4 h-4 text-primary-500" viewBox="0 0 24 24">
              <path fill="currentColor" d="M8 5v14l11-7z" transform="scale(-1, 1) translate(-24, 0)"/>
              <path fill="currentColor" d="M8 5v14l11-7z"/>
            </svg>
          </div>
          
          {/* Visual indicators for sides */}
          <div className="absolute left-0 top-4 -translate-x-full -ml-2 bg-black/70 text-white text-xs px-2 py-1 rounded">Original</div>
          <div className="absolute right-0 top-4 translate-x-full ml-2 bg-black/70 text-white text-xs px-2 py-1 rounded">Processed</div>
          
          {/* Vertical line indicator */}
          <div className="absolute inset-y-0 left-0 w-px bg-primary-500"></div>
        </div>
        
        {/* Labels on corners - responsive with different visibility */}
        <div className="absolute top-4 left-4 md:opacity-100 opacity-0 bg-black/50 text-white px-2 py-1 text-sm rounded transition-opacity duration-200">
          Original
        </div>
        <div className="absolute top-4 right-4 md:opacity-100 opacity-0 bg-black/50 text-white px-2 py-1 text-sm rounded transition-opacity duration-200">
          Processed
        </div>
      </div>
    </div>
  );
};

export default ImageComparison; 