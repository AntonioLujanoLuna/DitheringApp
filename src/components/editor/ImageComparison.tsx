import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
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
        className="relative w-full h-full overflow-hidden border border-gray-300 dark:border-gray-700 rounded-lg"
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
          className="absolute top-0 bottom-0 w-1 bg-primary-500 cursor-ew-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Slider handle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-800 rounded-full border-2 border-primary-500 shadow-md flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 12h8M8 17h8" />
            </svg>
          </div>
        </div>
        
        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 text-sm rounded">
          Original
        </div>
        <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 text-sm rounded">
          Processed
        </div>
      </div>
    </div>
  );
};

export default ImageComparison; 