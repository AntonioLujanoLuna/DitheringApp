// Selective dithering with masking to apply different dithering effects to different parts of an image
import { DitheringAlgorithm } from '../../store/useEditorStore';
import { 
  orderedDithering, 
  floydSteinbergDithering, 
  atkinsonDithering, 
  halftoneDithering,
  jarvisJudiceNinkeDithering,
  stuckiDithering,
  burkesDithering,
  sierraLiteDithering,
  randomDithering,
  voidAndClusterDithering,
  blueNoiseDithering,
  riemersmaDithering,
  directBinarySearchDithering
} from './index';

// Type for mask regions with different algorithms
export interface MaskRegion {
  mask: Uint8ClampedArray;
  algorithm: DitheringAlgorithm;
  threshold?: number;
  dotSize?: number;
  spacing?: number;
  angle?: number;
}

// Selective dithering with multiple algorithms applied to different regions
export function selectiveDithering(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  regions: MaskRegion[],
  defaultAlgorithm: DitheringAlgorithm = 'ordered',
  defaultThreshold: number = 128,
  defaultDotSize: number = 4,
  defaultSpacing: number = 5,
  defaultAngle: number = 45
): ImageData {
  // Create output ImageData
  const outputData = new ImageData(width, height);
  const output = outputData.data;
  
  // Create a map to track which pixels have been processed
  const processedMap = new Uint8Array(width * height).fill(0);
  
  // Apply selective dithering for each region
  for (const region of regions) {
    // Get the mask
    const mask = region.mask;
    
    // Apply the specific algorithm to this region only
    const regionResult = applyAlgorithmToRegion(
      grayscale,
      width,
      height,
      mask,
      region.algorithm,
      region.threshold || defaultThreshold,
      region.dotSize || defaultDotSize,
      region.spacing || defaultSpacing,
      region.angle || defaultAngle
    );
    
    // Merge the region result with the output using the mask
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] > 0) {
        // Mark as processed
        processedMap[i] = 1;
        
        // Copy pixel data from the region result
        const idx = i * 4;
        output[idx] = regionResult.data[idx];
        output[idx + 1] = regionResult.data[idx + 1];
        output[idx + 2] = regionResult.data[idx + 2];
        output[idx + 3] = 255;
      }
    }
  }
  
  // Process any remaining unprocessed pixels with the default algorithm
  const defaultResult = applyAlgorithmToRegion(
    grayscale,
    width,
    height,
    null, // No mask means apply to the entire image
    defaultAlgorithm,
    defaultThreshold,
    defaultDotSize,
    defaultSpacing,
    defaultAngle
  );
  
  // Copy default result only for unprocessed pixels
  for (let i = 0; i < processedMap.length; i++) {
    if (processedMap[i] === 0) {
      const idx = i * 4;
      output[idx] = defaultResult.data[idx];
      output[idx + 1] = defaultResult.data[idx + 1];
      output[idx + 2] = defaultResult.data[idx + 2];
      output[idx + 3] = 255;
    }
  }
  
  return outputData;
}

// Apply a specific algorithm to a masked region of the image
function applyAlgorithmToRegion(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  mask: Uint8ClampedArray | null,
  algorithm: DitheringAlgorithm,
  threshold: number = 128,
  dotSize: number = 4,
  spacing: number = 5,
  angle: number = 45
): ImageData {
  // Create a copy of the grayscale data if using mask
  let regionalGrayscale = grayscale;
  
  // If a mask is provided, we could optimize by only processing the masked region
  // but for simplicity we'll just process the whole image and then apply the mask later
  
  // Apply the specified algorithm
  let result: ImageData;
  
  switch (algorithm) {
    case 'ordered':
      result = orderedDithering(regionalGrayscale, width, height, dotSize);
      break;
    case 'floydSteinberg':
      result = floydSteinbergDithering(regionalGrayscale, width, height, threshold);
      break;
    case 'atkinson':
      result = atkinsonDithering(regionalGrayscale, width, height, threshold);
      break;
    case 'halftone':
      result = halftoneDithering(regionalGrayscale, width, height, dotSize, spacing, angle);
      break;
    case 'jarvisJudiceNinke':
      result = jarvisJudiceNinkeDithering(regionalGrayscale, width, height, threshold);
      break;
    case 'stucki':
      result = stuckiDithering(regionalGrayscale, width, height, threshold);
      break;
    case 'burkes':
      result = burkesDithering(regionalGrayscale, width, height, threshold);
      break;
    case 'sierraLite':
      result = sierraLiteDithering(regionalGrayscale, width, height, threshold);
      break;
    case 'random':
      result = randomDithering(regionalGrayscale, width, height, threshold);
      break;
    case 'voidAndCluster':
      result = voidAndClusterDithering(regionalGrayscale, width, height, threshold);
      break;
    case 'blueNoise':
      result = blueNoiseDithering(regionalGrayscale, width, height, threshold);
      break;
    case 'riemersma':
      result = riemersmaDithering(regionalGrayscale, width, height, threshold);
      break;
    case 'directBinarySearch':
      result = directBinarySearchDithering(regionalGrayscale, width, height, threshold);
      break;
    default:
      result = orderedDithering(regionalGrayscale, width, height, dotSize);
  }
  
  return result;
}

// Create a circular mask centered at (x, y) with the given radius
export function createCircularMask(
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
  feather: number = 0
): Uint8ClampedArray {
  const mask = new Uint8ClampedArray(width * height);
  
  // Convert to pixel coordinates if input is normalized (0-1)
  if (centerX <= 1) centerX = Math.floor(centerX * width);
  if (centerY <= 1) centerY = Math.floor(centerY * height);
  if (radius <= 1) radius = Math.floor(radius * Math.min(width, height));
  if (feather <= 1) feather = Math.floor(feather * radius);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      // Calculate distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Apply mask with optional feather (soft edge)
      if (distance <= radius - feather) {
        // Inside the mask (solid)
        mask[idx] = 255;
      } else if (distance <= radius) {
        // Feathered edge
        const featherAmount = 1 - (distance - (radius - feather)) / feather;
        mask[idx] = Math.floor(featherAmount * 255);
      } else {
        // Outside the mask
        mask[idx] = 0;
      }
    }
  }
  
  return mask;
}

// Create a rectangular mask defined by top-left corner (x1, y1) and bottom-right corner (x2, y2)
export function createRectangularMask(
  width: number,
  height: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  feather: number = 0
): Uint8ClampedArray {
  const mask = new Uint8ClampedArray(width * height);
  
  // Convert to pixel coordinates if input is normalized (0-1)
  if (x1 <= 1) x1 = Math.floor(x1 * width);
  if (y1 <= 1) y1 = Math.floor(y1 * height);
  if (x2 <= 1) x2 = Math.floor(x2 * width);
  if (y2 <= 1) y2 = Math.floor(y2 * height);
  if (feather <= 1) feather = Math.floor(feather * Math.min(width, height));
  
  // Ensure x1,y1 is top-left and x2,y2 is bottom-right
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      // Calculate distance to the nearest edge
      let distToEdge;
      
      if (x < minX) {
        if (y < minY) {
          // Top-left corner
          distToEdge = Math.sqrt((x - minX) * (x - minX) + (y - minY) * (y - minY));
        } else if (y > maxY) {
          // Bottom-left corner
          distToEdge = Math.sqrt((x - minX) * (x - minX) + (y - maxY) * (y - maxY));
        } else {
          // Left edge
          distToEdge = minX - x;
        }
      } else if (x > maxX) {
        if (y < minY) {
          // Top-right corner
          distToEdge = Math.sqrt((x - maxX) * (x - maxX) + (y - minY) * (y - minY));
        } else if (y > maxY) {
          // Bottom-right corner
          distToEdge = Math.sqrt((x - maxX) * (x - maxX) + (y - maxY) * (y - maxY));
        } else {
          // Right edge
          distToEdge = x - maxX;
        }
      } else {
        if (y < minY) {
          // Top edge
          distToEdge = minY - y;
        } else if (y > maxY) {
          // Bottom edge
          distToEdge = y - maxY;
        } else {
          // Inside rectangle
          distToEdge = -1;
        }
      }
      
      // Apply mask with optional feather (soft edge)
      if (distToEdge < 0) {
        // Inside the mask (solid)
        mask[idx] = 255;
      } else if (distToEdge <= feather) {
        // Feathered edge
        const featherAmount = 1 - distToEdge / feather;
        mask[idx] = Math.floor(featherAmount * 255);
      } else {
        // Outside the mask
        mask[idx] = 0;
      }
    }
  }
  
  return mask;
}

// Create a polygon mask defined by an array of vertices
export function createPolygonMask(
  width: number,
  height: number,
  vertices: [number, number][],
  feather: number = 0
): Uint8ClampedArray {
  const mask = new Uint8ClampedArray(width * height);
  
  // Convert vertices to pixel coordinates if normalized (0-1)
  const pixelVertices = vertices.map(([x, y]) => [
    x <= 1 ? Math.floor(x * width) : x,
    y <= 1 ? Math.floor(y * height) : y
  ]) as [number, number][];
  
  if (feather <= 1) feather = Math.floor(feather * Math.min(width, height));
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      // Check if point is inside the polygon
      const isInside = pointInPolygon(x, y, pixelVertices);
      
      if (feather === 0) {
        // No feathering
        mask[idx] = isInside ? 255 : 0;
      } else {
        // With feathering, calculate distance to nearest edge
        const distToEdge = isInside ? 
          calculateDistanceToNearestEdge(x, y, pixelVertices) : 
          -calculateDistanceToNearestEdge(x, y, pixelVertices);
        
        if (isInside && distToEdge >= feather) {
          // Deep inside the mask (solid)
          mask[idx] = 255;
        } else if (!isInside && distToEdge <= -feather) {
          // Far outside the mask
          mask[idx] = 0;
        } else {
          // Feathered edge
          const featherAmount = 0.5 + distToEdge / (2 * feather);
          mask[idx] = Math.floor(Math.max(0, Math.min(1, featherAmount)) * 255);
        }
      }
    }
  }
  
  return mask;
}

// Check if a point is inside a polygon using ray casting algorithm
function pointInPolygon(x: number, y: number, vertices: [number, number][]): boolean {
  let inside = false;
  
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [xi, yi] = vertices[i];
    const [xj, yj] = vertices[j];
    
    const intersect = ((yi > y) !== (yj > y)) && 
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// Calculate distance from a point to the nearest edge of a polygon
function calculateDistanceToNearestEdge(x: number, y: number, vertices: [number, number][]): number {
  let minDistance = Infinity;
  
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [x1, y1] = vertices[i];
    const [x2, y2] = vertices[j];
    
    // Calculate distance from point to line segment
    const segmentLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    
    // If segment has zero length, calculate distance to the point
    if (segmentLength === 0) {
      const dist = Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
      minDistance = Math.min(minDistance, dist);
      continue;
    }
    
    // Calculate projection ratio
    const t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / (segmentLength * segmentLength);
    
    if (t < 0) {
      // Closest to first vertex
      const dist = Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
      minDistance = Math.min(minDistance, dist);
    } else if (t > 1) {
      // Closest to second vertex
      const dist = Math.sqrt(Math.pow(x - x2, 2) + Math.pow(y - y2, 2));
      minDistance = Math.min(minDistance, dist);
    } else {
      // Closest to segment
      const projX = x1 + t * (x2 - x1);
      const projY = y1 + t * (y2 - y1);
      const dist = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));
      minDistance = Math.min(minDistance, dist);
    }
  }
  
  return minDistance;
} 