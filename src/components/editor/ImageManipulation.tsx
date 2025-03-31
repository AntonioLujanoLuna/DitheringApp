import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { useThemeStore } from '../../store/useThemeStore';

interface ImageManipulationProps {
  onClose: () => void;
}

const ImageManipulation: React.FC<ImageManipulationProps> = ({ onClose }) => {
  const { originalImage, setOriginalImage } = useEditorStore();
  const { darkMode } = useThemeStore();
  
  // States for crop/resize
  const [action, setAction] = useState<'crop' | 'resize'>('crop');
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [resize, setResize] = useState({ width: 0, height: 0, maintainAspect: true });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Set initial dimensions
  useEffect(() => {
    if (!originalImage) return;
    
    // Initialize crop to full image
    setCrop({
      x: 0,
      y: 0,
      width: 100,
      height: 100
    });
    
    // Initialize resize to original dimensions
    setResize({
      width: originalImage.width,
      height: originalImage.height,
      maintainAspect: true
    });
    
    // Draw the image on the canvas
    drawImageOnCanvas();
  }, [originalImage]);
  
  // Draw the image and crop overlay on canvas
  const drawImageOnCanvas = () => {
    if (!originalImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match container
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      canvas.width = containerRect.width;
      canvas.height = containerRect.height;
    }
    
    // Calculate scale factor to fit image in the canvas
    const scale = Math.min(
      canvas.width / originalImage.width,
      canvas.height / originalImage.height
    );
    
    // Calculate centered position
    const x = (canvas.width - originalImage.width * scale) / 2;
    const y = (canvas.height - originalImage.height * scale) / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw original image
    ctx.drawImage(originalImage, x, y, originalImage.width * scale, originalImage.height * scale);
    
    // If cropping, draw crop overlay
    if (action === 'crop') {
      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calculate crop rectangle in canvas coordinates
      const cropX = x + (originalImage.width * crop.x / 100) * scale;
      const cropY = y + (originalImage.height * crop.y / 100) * scale;
      const cropWidth = (originalImage.width * crop.width / 100) * scale;
      const cropHeight = (originalImage.height * crop.height / 100) * scale;
      
      // Clear the crop area
      ctx.clearRect(cropX, cropY, cropWidth, cropHeight);
      
      // Draw border around crop area
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);
      
      // Draw corner handles
      drawHandle(ctx, cropX, cropY);
      drawHandle(ctx, cropX + cropWidth, cropY);
      drawHandle(ctx, cropX, cropY + cropHeight);
      drawHandle(ctx, cropX + cropWidth, cropY + cropHeight);
    }
  };
  
  // Draw a handle for resizing the crop area
  const drawHandle = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  };
  
  // Handle mouse/touch down on the canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (action !== 'crop' || !canvasRef.current || !originalImage) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get pointer position
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Start dragging
    setIsDragging(true);
    setDragStart({ x, y });
    setInitialCrop({ ...crop });
  };
  
  // Handle mouse/touch move on the canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || action !== 'crop' || !canvasRef.current || !originalImage) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Get pointer position
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Calculate scale factor
    const scale = Math.min(
      canvas.width / originalImage.width,
      canvas.height / originalImage.height
    );
    
    // Calculate image position
    const imgX = (canvas.width - originalImage.width * scale) / 2;
    const imgY = (canvas.height - originalImage.height * scale) / 2;
    
    // Calculate drag delta in image percentage
    const deltaX = (x - dragStart.x) / (originalImage.width * scale) * 100;
    const deltaY = (y - dragStart.y) / (originalImage.height * scale) * 100;
    
    // Update crop based on drag
    const newCrop = {
      x: Math.max(0, Math.min(100 - crop.width, initialCrop.x + deltaX)),
      y: Math.max(0, Math.min(100 - crop.height, initialCrop.y + deltaY)),
      width: crop.width,
      height: crop.height
    };
    
    setCrop(newCrop);
    drawImageOnCanvas();
  };
  
  // Handle mouse/touch up
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle resize input changes
  const handleResizeChange = (e: React.ChangeEvent<HTMLInputElement>, dimension: 'width' | 'height') => {
    if (!originalImage) return;
    
    const value = parseInt(e.target.value, 10) || 0;
    
    if (resize.maintainAspect) {
      // Maintain aspect ratio
      const aspectRatio = originalImage.width / originalImage.height;
      
      if (dimension === 'width') {
        setResize({
          ...resize,
          width: value,
          height: Math.round(value / aspectRatio)
        });
      } else {
        setResize({
          ...resize,
          width: Math.round(value * aspectRatio),
          height: value
        });
      }
    } else {
      // Free resize
      setResize({
        ...resize,
        [dimension]: value
      });
    }
  };
  
  // Toggle maintain aspect ratio
  const toggleMaintainAspect = () => {
    setResize({
      ...resize,
      maintainAspect: !resize.maintainAspect
    });
  };
  
  // Apply crop or resize
  const applyChanges = () => {
    if (!originalImage) return;
    
    // Create a temporary canvas for the result
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    if (action === 'crop') {
      // Apply crop
      const cropX = originalImage.width * crop.x / 100;
      const cropY = originalImage.height * crop.y / 100;
      const cropWidth = originalImage.width * crop.width / 100;
      const cropHeight = originalImage.height * crop.height / 100;
      
      // Set canvas size to crop dimensions
      tempCanvas.width = cropWidth;
      tempCanvas.height = cropHeight;
      
      // Draw cropped region to the canvas
      tempCtx.drawImage(
        originalImage,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );
    } else {
      // Apply resize
      tempCanvas.width = resize.width;
      tempCanvas.height = resize.height;
      
      // Draw resized image to the canvas
      tempCtx.drawImage(
        originalImage,
        0, 0, originalImage.width, originalImage.height,
        0, 0, resize.width, resize.height
      );
    }
    
    // Create a new image from the canvas
    const newImage = new Image();
    newImage.onload = () => {
      setOriginalImage(newImage);
      onClose();
    };
    newImage.src = tempCanvas.toDataURL('image/png');
  };
  
  // Update canvas when action or crop changes
  useEffect(() => {
    drawImageOnCanvas();
  }, [action, crop]);
  
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
  
  if (!originalImage) return null;
  
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900/80' : 'bg-gray-100/80'}`}>
      <div className={`relative w-full max-w-4xl rounded-lg shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Image</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Canvas for image preview */}
          <div 
            ref={containerRef}
            className="flex-1 flex items-center justify-center h-[400px] border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
            />
          </div>
          
          {/* Controls */}
          <div className="w-full md:w-64 space-y-6">
            <div className="flex gap-2">
              <button
                onClick={() => setAction('crop')}
                className={`flex-1 py-2 px-4 rounded-lg ${action === 'crop' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white'}`}
              >
                Crop
              </button>
              <button
                onClick={() => setAction('resize')}
                className={`flex-1 py-2 px-4 rounded-lg ${action === 'resize' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white'}`}
              >
                Resize
              </button>
            </div>
            
            {action === 'resize' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={resize.width}
                    onChange={(e) => handleResizeChange(e, 'width')}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={resize.height}
                    onChange={(e) => handleResizeChange(e, 'height')}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="maintainAspect"
                    checked={resize.maintainAspect}
                    onChange={toggleMaintainAspect}
                    className="mr-2"
                  />
                  <label htmlFor="maintainAspect">Maintain aspect ratio</label>
                </div>
              </div>
            )}
            
            {action === 'crop' && (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Drag the crop area to adjust it.
                </p>
              </div>
            )}
            
            <div className="pt-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={applyChanges}
                className="py-2 px-4 bg-primary-500 text-white rounded-lg"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageManipulation; 