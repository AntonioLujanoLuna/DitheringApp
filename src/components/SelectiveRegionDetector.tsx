import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DitheringAlgorithm } from '../store/useEditorStore';

interface SelectiveRegionDetectorProps {
  imageUrl: string;
  onRegionsDetected: (regions: DetectedRegion[]) => void;
  className?: string;
  sensitivity?: number;
  minRegionSize?: number;
}

export interface DetectedRegion {
  id: string;
  bounds: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  algorithm: DitheringAlgorithm;
}

const SelectiveRegionDetector: React.FC<SelectiveRegionDetectorProps> = ({
  imageUrl,
  onRegionsDetected,
  className = '',
  sensitivity = 30,
  minRegionSize = 500
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [detectedRegions, setDetectedRegions] = useState<DetectedRegion[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Initialize the worker
  useEffect(() => {
    // Create the worker
    workerRef.current = new Worker(
      new URL('../lib/workers/ditheringWorker.ts', import.meta.url),
      { type: 'module' }
    );

    // Set up the message handler
    workerRef.current.onmessage = (event) => {
      if (event.data.type === 'detectRegionsResult') {
        if (event.data.success) {
          // Convert the detected regions to our format
          const regions: DetectedRegion[] = event.data.regions.bounds.map((bound: any, index: number) => ({
            id: `region-${index}`,
            bounds: bound,
            algorithm: 'ordered' // Default algorithm
          }));

          setDetectedRegions(regions);
          onRegionsDetected(regions);
          setIsLoading(false);
        } else {
          setError('Failed to detect regions: ' + event.data.error);
          setIsLoading(false);
        }
      }
    };

    // Clean up the worker
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [onRegionsDetected]);

  // Load the image when the URL changes
  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      drawImageOnCanvas();
    };
    img.onerror = () => {
      setError('Failed to load image');
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Draw the image and regions on the canvas
  const drawImageOnCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match the image
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw the image
    ctx.drawImage(img, 0, 0, img.width, img.height);

    // Draw the detected regions
    detectedRegions.forEach((region) => {
      const { x1, y1, x2, y2 } = region.bounds;
      const isSelected = region.id === selectedRegion;

      // Set the style based on whether the region is selected
      ctx.strokeStyle = isSelected ? '#00f8ff' : '#ff0000';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.setLineDash(isSelected ? [] : [5, 5]);

      // Draw the rectangle
      ctx.beginPath();
      ctx.rect(x1, y1, x2 - x1, y2 - y1);
      ctx.stroke();

      // Draw the region label
      ctx.font = '12px Arial';
      ctx.fillStyle = isSelected ? '#00f8ff' : '#ff0000';
      ctx.fillText(region.algorithm, x1, y1 - 5);
    });
  }, [detectedRegions, selectedRegion]);

  // Update the canvas when regions or selection changes
  useEffect(() => {
    drawImageOnCanvas();
  }, [detectedRegions, selectedRegion, drawImageOnCanvas]);

  // Handler for detecting regions
  const handleDetectRegions = () => {
    if (!canvasRef.current || !imageRef.current) {
      setError('No image loaded');
      return;
    }

    setIsLoading(true);
    setError(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Canvas context not available');
      setIsLoading(false);
      return;
    }

    // Get the image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Process with the worker
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'detectRegions',
        imageData,
        sensitivity,
        minSize: minRegionSize
      });
    } else {
      setError('Worker not initialized');
      setIsLoading(false);
    }
  };

  // Handler for region click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get the click coordinates relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if any region was clicked
    for (const region of detectedRegions) {
      const { x1, y1, x2, y2 } = region.bounds;
      if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
        setSelectedRegion(region.id);
        return;
      }
    }

    // If no region was clicked, deselect
    setSelectedRegion(null);
  };

  // Handler for changing the algorithm of a selected region
  const handleAlgorithmChange = (algorithm: DitheringAlgorithm) => {
    if (!selectedRegion) return;

    setDetectedRegions((prevRegions) =>
      prevRegions.map((region) =>
        region.id === selectedRegion ? { ...region, algorithm } : region
      )
    );

    // Notify the parent component
    onRegionsDetected(
      detectedRegions.map((region) =>
        region.id === selectedRegion ? { ...region, algorithm } : region
      )
    );
  };

  return (
    <div className={`selective-region-detector ${className}`}>
      <div className="controls mb-3">
        <button
          className="btn btn-primary mr-2"
          onClick={handleDetectRegions}
          disabled={isLoading || !imageUrl}
        >
          {isLoading ? 'Detecting...' : 'Detect Objects'}
        </button>

        {selectedRegion && (
          <div className="algorithm-selector mt-2">
            <label htmlFor="algorithm-select">Algorithm for selected region:</label>
            <select
              id="algorithm-select"
              className="form-select"
              onChange={(e) => handleAlgorithmChange(e.target.value as DitheringAlgorithm)}
              value={
                detectedRegions.find((r) => r.id === selectedRegion)?.algorithm || 'ordered'
              }
            >
              <option value="ordered">Ordered Dithering</option>
              <option value="floydSteinberg">Floyd-Steinberg</option>
              <option value="atkinson">Atkinson</option>
              <option value="halftone">Halftone</option>
              <option value="jarvisJudiceNinke">Jarvis-Judice-Ninke</option>
              <option value="stucki">Stucki</option>
              <option value="burkes">Burkes</option>
              <option value="sierraLite">Sierra Lite</option>
              <option value="random">Random</option>
            </select>
          </div>
        )}

        {detectedRegions.length > 0 && (
          <p className="text-success mt-2">
            {detectedRegions.length} region(s) detected. Click on a region to select it.
          </p>
        )}

        {error && <p className="text-danger mt-2">{error}</p>}
      </div>

      <div className="canvas-container" style={{ maxWidth: '100%', overflow: 'auto' }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{ border: '1px solid #ccc' }}
        />
      </div>
    </div>
  );
};

export default SelectiveRegionDetector; 