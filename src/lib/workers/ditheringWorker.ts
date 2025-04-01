// src/lib/workers/ditheringWorker.ts
// This file will be loaded as a web worker to process images in a background thread

import { 
  processImage, 
  createCircularMask, 
  createRectangularMask, 
  createPolygonMask,
  selectiveDithering,
  MaskRegion
} from '../../lib/algorithms';
import { DitheringAlgorithm, ColorMode } from '../../store/useEditingSessionStore';

// Define the message types for TypeScript
interface ProcessImageMessage {
  type: 'processImage';
  imageData: ImageData;
  algorithm: DitheringAlgorithm;
  dotSize: number;
  contrast: number;
  colorMode: ColorMode;
  spacing: number;
  angle: number;
  customColors: string[];
  brightness?: number;
  gammaCorrection?: number; 
  hue?: number;
  saturation?: number;
  lightness?: number;
  sharpness?: number;
  blurRadius?: number;
}

interface DetectRegionsMessage {
  type: 'detectRegions';
  imageData: ImageData;
  sensitivity: number;
  minSize: number;
}

interface ProcessSelectiveMessage {
  type: 'processSelective';
  imageData: ImageData;
  regions: SerializedMaskRegion[];
  defaultAlgorithm: DitheringAlgorithm;
  defaultThreshold?: number;
  defaultDotSize?: number;
  defaultSpacing?: number;
  defaultAngle?: number;
}

// Interface for serializable mask regions (web workers can't transfer complex objects)
interface SerializedMaskRegion {
  maskData: Uint8ClampedArray;
  algorithm: DitheringAlgorithm;
  threshold?: number;
  dotSize?: number;
  spacing?: number;
  angle?: number;
}

type WorkerMessage = ProcessImageMessage | DetectRegionsMessage | ProcessSelectiveMessage;

// Listen for messages from the main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  try {
    const { type } = event.data;
    
    switch (type) {
      case 'processImage':
        handleProcessImage(event.data);
        break;
      case 'detectRegions':
        handleDetectRegions(event.data);
        break;
      case 'processSelective':
        handleProcessSelective(event.data);
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    // Send any errors back to the main thread
    self.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Handler for standard image processing
function handleProcessImage(data: ProcessImageMessage) {
  const {
    imageData,
    algorithm,
    dotSize,
    contrast,
    colorMode,
    spacing,
    angle,
    customColors,
    brightness = 0,
    gammaCorrection = 1.0,
    hue = 0,
    saturation = 0,
    lightness = 0,
    sharpness = 0,
    blurRadius = 0
  } = data;
  
  // Create an OffscreenCanvas for processing
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Put the image data on the canvas
  ctx.putImageData(imageData, 0, 0);
  
  // Create a fake image object that the processImage function can use
  const fakeImg = {
    width: imageData.width,
    height: imageData.height,
  };
  
  // Process the image with all supported parameters
  const processedData = processImage(
    fakeImg as unknown as HTMLImageElement,
    algorithm,
    dotSize,
    contrast,
    colorMode,
    spacing,
    angle,
    customColors,
    brightness,
    gammaCorrection,
    hue,
    saturation,
    lightness,
    sharpness,
    blurRadius
  );
  
  // Send the processed data back to the main thread
  self.postMessage(
    {
      type: 'processImageResult',
      success: true,
      processedData
    },
    {
      transfer: [processedData.data.buffer]
    }
  );
}

// Handler for automatic region detection
function handleDetectRegions(data: DetectRegionsMessage) {
  const { imageData, sensitivity, minSize } = data;
  
  // Create canvas for processing
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  // Implement a simple edge detection for regions
  const regions = detectEdgesAndRegions(imageData, sensitivity, minSize);
  
  // Send the detected regions back
  self.postMessage({
    type: 'detectRegionsResult',
    success: true,
    regions
  });
}

// Handler for selective dithering
function handleProcessSelective(data: ProcessSelectiveMessage) {
  const { 
    imageData, 
    regions, 
    defaultAlgorithm,
    defaultThreshold = 128,
    defaultDotSize = 4,
    defaultSpacing = 5,
    defaultAngle = 45
  } = data;
  
  // Convert serialized mask regions to MaskRegion objects
  const maskRegions: MaskRegion[] = regions.map(region => ({
    mask: region.maskData,
    algorithm: region.algorithm,
    threshold: region.threshold,
    dotSize: region.dotSize,
    spacing: region.spacing,
    angle: region.angle
  }));
  
  // Create grayscale representation
  const grayscale = new Uint8ClampedArray(imageData.width * imageData.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    // Standard grayscale conversion
    grayscale[i/4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  
  // Apply selective dithering
  const processedData = selectiveDithering(
    grayscale,
    imageData.width,
    imageData.height,
    maskRegions,
    defaultAlgorithm,
    defaultThreshold,
    defaultDotSize,
    defaultSpacing,
    defaultAngle
  );
  
  // Send the processed data back
  self.postMessage(
    {
      type: 'processSelectiveResult',
      success: true,
      processedData
    },
    {
      transfer: [processedData.data.buffer]
    }
  );
}

// Simple edge detection and region segmentation
function detectEdgesAndRegions(
  imageData: ImageData, 
  sensitivity: number = 30, 
  minSize: number = 500
): { bounds: { x1: number, y1: number, x2: number, y2: number }[] } {
  const { width, height, data } = imageData;
  
  // Convert to grayscale for edge detection
  const grayscale = new Uint8ClampedArray(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    grayscale[i/4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  
  // Simple Sobel edge detection
  const edgeMap = applySobelOperator(grayscale, width, height, sensitivity);
  
  // Find connected regions using a simple flood fill
  const regions = findConnectedRegions(edgeMap, width, height, minSize);
  
  return { bounds: regions };
}

// Apply Sobel operator for edge detection
function applySobelOperator(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number
): Uint8ClampedArray {
  const edges = new Uint8ClampedArray(width * height).fill(0);
  
  // Sobel operators
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      
      // Apply 3x3 convolution
      for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
          const idx = (y + j) * width + (x + i);
          const kernelIdx = (j + 1) * 3 + (i + 1);
          
          gx += grayscale[idx] * sobelX[kernelIdx];
          gy += grayscale[idx] * sobelY[kernelIdx];
        }
      }
      
      // Calculate gradient magnitude
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      // Apply threshold
      edges[y * width + x] = magnitude > threshold ? 255 : 0;
    }
  }
  
  return edges;
}

// Find connected regions using a simple flood fill algorithm
function findConnectedRegions(
  edgeMap: Uint8ClampedArray,
  width: number,
  height: number,
  minSize: number
): { x1: number, y1: number, x2: number, y2: number }[] {
  const visited = new Uint8Array(width * height).fill(0);
  const regions: { x1: number, y1: number, x2: number, y2: number }[] = [];
  
  // Simple flood fill implementation
  function floodFill(x: number, y: number): { x1: number, y1: number, x2: number, y2: number, size: number } {
    const queue: [number, number][] = [[x, y]];
    let minX = x, minY = y, maxX = x, maxY = y;
    let size = 0;
    
    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      const idx = cy * width + cx;
      
      if (cx < 0 || cy < 0 || cx >= width || cy >= height || visited[idx] || edgeMap[idx] > 0) {
        continue;
      }
      
      visited[idx] = 1;
      size++;
      
      // Update bounds
      minX = Math.min(minX, cx);
      minY = Math.min(minY, cy);
      maxX = Math.max(maxX, cx);
      maxY = Math.max(maxY, cy);
      
      // Add neighbors to queue
      queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    
    return { x1: minX, y1: minY, x2: maxX, y2: maxY, size };
  }
  
  // Find regions by scanning the image
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (visited[idx] === 0 && edgeMap[idx] === 0) {
        const region = floodFill(x, y);
        
        // Only keep regions larger than minSize
        if (region.size >= minSize) {
          regions.push({
            x1: region.x1,
            y1: region.y1,
            x2: region.x2,
            y2: region.y2
          });
        }
      }
    }
  }
  
  return regions;
}