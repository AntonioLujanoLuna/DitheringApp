// SVG export utilities for dithering effects
// Particularly useful for halftone patterns

import { SVGExporter } from './svgUtils';
import { 
  rgbToGrayscale,
  // applyColorToBinaryImage, // Commented out - function not found in expected location
  processImage // Assuming processImage handles various dithering types
} from '../algorithms';
import { DitheringAlgorithm } from '../../store/useEditingSessionStore'; // Updated import
import { getPatternMatrix } from '../algorithms/patternDithering';
import type { PatternType } from '../algorithms/patternDithering';

/**
 * Convert a processed canvas to an SVG representation
 * This is particularly useful for halftone patterns which can be represented as vector dots
 */
export function canvasToSVG(
  canvas: HTMLCanvasElement,
  algorithm: DitheringAlgorithm,
  options: {
    dotSize?: number;
    spacing?: number;
    angle?: number;
    patternType?: PatternType;
    simplified?: boolean; // If true, will use a simplified SVG representation to reduce file size
    includeBackground?: boolean; // If true, includes a white background
  } = {}
): string {
  const {
    dotSize = 4,
    spacing = 8,
    angle = 45,
    patternType = 'dots',
    simplified = false,
    includeBackground = true,
  } = options;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Get the pixel data from the canvas
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  
  // Create SVG document
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Add white background if requested
  if (includeBackground) {
    svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  }
  
  // Special handling for halftone pattern which is best represented as circles
  if (algorithm === 'halftone') {
    svg += generateHalftoneSVG(pixels, width, height, dotSize, spacing, angle, simplified);
  }
  // Pattern dithering can be represented more efficiently as shapes
  else if (algorithm === 'pattern') {
    svg += generatePatternSVG(pixels, width, height, dotSize, patternType, simplified);
  }
  // For ordered dithering and other methods, use a pixel-based approach
  else {
    svg += generatePixelBasedSVG(pixels, width, height, simplified);
  }
  
  svg += '</svg>';
  return svg;
}

/**
 * Generate SVG representation of a halftone pattern
 */
function generateHalftoneSVG(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  dotSize: number,
  spacing: number,
  angle: number,
  simplified: boolean
): string {
  let content = '';
  
  // SVG Group for all dots
  content += '<g fill="black">';
  
  // Calculate the rotated grid
  const angleRad = angle * Math.PI / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  
  // Calculate number of dots in each direction with some margin
  const spacingX = spacing;
  const spacingY = spacing;
  const dotsX = Math.ceil(width / spacingX) + 2;
  const dotsY = Math.ceil(height / spacingY) + 2;
  
  // Center of rotation
  const centerX = width / 2;
  const centerY = height / 2;
  
  // If simplified, use fewer dots by sampling at grid points
  if (simplified) {
    // Create a path for all dots to reduce file size
    content += '<path d="';
    
    for (let gridY = -1; gridY < dotsY + 1; gridY++) {
      for (let gridX = -1; gridX < dotsX + 1; gridX++) {
        // Original grid position
        const unrotatedX = gridX * spacingX;
        const unrotatedY = gridY * spacingY;
        
        // Rotate the grid
        const rotatedX = cos * (unrotatedX - centerX) - sin * (unrotatedY - centerY) + centerX;
        const rotatedY = sin * (unrotatedX - centerX) + cos * (unrotatedY - centerY) + centerY;
        
        // Skip if out of bounds
        if (rotatedX < -spacing || rotatedX > width + spacing || 
            rotatedY < -spacing || rotatedY > height + spacing) {
          continue;
        }
        
        // Get the pixel value at this location
        const pixelX = Math.floor(rotatedX);
        const pixelY = Math.floor(rotatedY);
        
        if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
          const pixelIndex = (pixelY * width + pixelX) * 4;
          const r = pixels[pixelIndex];
          const g = pixels[pixelIndex + 1];
          const b = pixels[pixelIndex + 2];
          
          // Calculate the brightness (0-1)
          const brightness = (r + g + b) / (3 * 255);
          
          // Only draw dot if brightness is below threshold (black areas)
          if (brightness < 0.5) {
            // Calculate the dot radius based on brightness
            const radius = (1 - brightness) * (dotSize / 2);
            
            // Only add dot if it's visible
            if (radius > 0.2) {
              // Add a circle to the path
              content += `M ${rotatedX} ${rotatedY} m 0 ${-radius} a ${radius} ${radius} 0 1 0 0 ${2 * radius} a ${radius} ${radius} 0 1 0 0 ${-2 * radius} `;
            }
          }
        }
      }
    }
    
    content += '" />';
  } else {
    // Use individual circles for higher quality but larger file size
    for (let gridY = -1; gridY < dotsY + 1; gridY++) {
      for (let gridX = -1; gridX < dotsX + 1; gridX++) {
        // Original grid position
        const unrotatedX = gridX * spacingX;
        const unrotatedY = gridY * spacingY;
        
        // Rotate the grid
        const rotatedX = cos * (unrotatedX - centerX) - sin * (unrotatedY - centerY) + centerX;
        const rotatedY = sin * (unrotatedX - centerX) + cos * (unrotatedY - centerY) + centerY;
        
        // Skip if out of bounds
        if (rotatedX < -spacing || rotatedX > width + spacing || 
            rotatedY < -spacing || rotatedY > height + spacing) {
          continue;
        }
        
        // Sample the image at this location
        const pixelX = Math.floor(rotatedX);
        const pixelY = Math.floor(rotatedY);
        
        if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
          const pixelIndex = (pixelY * width + pixelX) * 4;
          const r = pixels[pixelIndex];
          const g = pixels[pixelIndex + 1];
          const b = pixels[pixelIndex + 2];
          
          // Calculate the brightness (0-1)
          const brightness = (r + g + b) / (3 * 255);
          
          // Calculate the dot radius based on brightness
          const radius = (1 - brightness) * (dotSize / 2);
          
          // Only add dot if it's visible
          if (radius > 0.5) {
            content += `<circle cx="${rotatedX}" cy="${rotatedY}" r="${radius}" />`;
          }
        }
      }
    }
  }
  
  content += '</g>';
  return content;
}

/**
 * Generate SVG representation of a pattern-based dithering
 */
function generatePatternSVG(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  patternSize: number,
  patternType: PatternType,
  simplified: boolean
): string {
  let content = '';
  
  // Different paths based on pattern type
  switch (patternType) {
    case 'lines':
      content += generateLineSVG(pixels, width, height, patternSize, simplified);
      break;
    case 'crosses':
      content += generateCrossSVG(pixels, width, height, patternSize, simplified);
      break;
    case 'diamonds':
      content += generateDiamondSVG(pixels, width, height, patternSize, simplified);
      break;
    case 'dots':
    default:
      content += generateDotPatternSVG(pixels, width, height, patternSize, simplified);
      break;
  }
  
  return content;
}

/**
 * Generate SVG for line patterns
 */
function generateLineSVG(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  lineSpacing: number,
  simplified: boolean
): string {
  let content = '<g stroke="black">';
  
  // For lines, create horizontal strokes with varying thickness
  for (let y = 0; y < height; y += lineSpacing) {
    let inLine = false;
    let lineStart = 0;
    let lineThickness = 1;
    
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      const isBlack = pixels[pixelIndex] < 128;
      
      if (isBlack && !inLine) {
        // Start of a new line
        inLine = true;
        lineStart = x;
        
        // Sample rows above and below to determine thickness
        let thickness = 1;
        for (let i = 1; i < lineSpacing && y + i < height; i++) {
          const sampleIndex = ((y + i) * width + x) * 4;
          if (pixels[sampleIndex] < 128) thickness++;
        }
        lineThickness = thickness;
      } else if (!isBlack && inLine) {
        // End of the line
        inLine = false;
        content += `<line x1="${lineStart}" y1="${y + lineThickness/2}" x2="${x}" y2="${y + lineThickness/2}" stroke-width="${lineThickness}" />`;
      }
    }
    
    // Handle case where line extends to the edge
    if (inLine) {
      content += `<line x1="${lineStart}" y1="${y + lineThickness/2}" x2="${width}" y2="${y + lineThickness/2}" stroke-width="${lineThickness}" />`;
    }
  }
  
  content += '</g>';
  return content;
}

/**
 * Generate SVG for cross patterns
 */
function generateCrossSVG(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  crossSize: number,
  simplified: boolean
): string {
  // For the cross pattern, we can use a path for all crosses
  let content = '<path d="';
  
  // Sample the image at regular intervals
  for (let y = 0; y < height; y += crossSize) {
    for (let x = 0; x < width; x += crossSize) {
      // Check if this region has a dark pixel
      let hasBlackPixel = false;
      let avgBrightness = 0;
      let pixelCount = 0;
      
      // Sample a few pixels in this region
      for (let dy = 0; dy < crossSize && y + dy < height; dy += 2) {
        for (let dx = 0; dx < crossSize && x + dx < width; dx += 2) {
          const pixelIndex = ((y + dy) * width + (x + dx)) * 4;
          const brightness = (pixels[pixelIndex] + pixels[pixelIndex + 1] + pixels[pixelIndex + 2]) / (3 * 255);
          avgBrightness += brightness;
          pixelCount++;
          
          if (pixels[pixelIndex] < 128) {
            hasBlackPixel = true;
          }
        }
      }
      
      if (hasBlackPixel) {
        avgBrightness = avgBrightness / pixelCount;
        const crossScale = 1 - avgBrightness;
        
        if (crossScale > 0.2) {
          // Calculate cross size based on brightness
          const size = crossSize * crossScale;
          const centerX = x + crossSize / 2;
          const centerY = y + crossSize / 2;
          
          // Add a cross to the path
          content += `M ${centerX - size/2} ${centerY} h ${size} M ${centerX} ${centerY - size/2} v ${size} `;
        }
      }
    }
  }
  
  content += '" stroke="black" stroke-width="1" fill="none" />';
  return content;
}

/**
 * Generate SVG for diamond patterns
 */
function generateDiamondSVG(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  diamondSize: number,
  simplified: boolean
): string {
  let content = '<g fill="black">';
  
  // For diamonds, use a polygon at each grid point
  for (let y = diamondSize/2; y < height; y += diamondSize) {
    for (let x = diamondSize/2; x < width; x += diamondSize) {
      // Sample this region to determine diamond size
      let avgBrightness = 0;
      let pixelCount = 0;
      
      for (let dy = -diamondSize/2; dy < diamondSize/2; dy++) {
        for (let dx = -diamondSize/2; dx < diamondSize/2; dx++) {
          const pixelX = Math.floor(x + dx);
          const pixelY = Math.floor(y + dy);
          
          if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
            const pixelIndex = (pixelY * width + pixelX) * 4;
            const brightness = (pixels[pixelIndex] + pixels[pixelIndex + 1] + pixels[pixelIndex + 2]) / (3 * 255);
            avgBrightness += brightness;
            pixelCount++;
          }
        }
      }
      
      if (pixelCount > 0) {
        avgBrightness /= pixelCount;
        const scale = 1 - avgBrightness;
        
        if (scale > 0.2) {
          // Calculate diamond size based on brightness
          const size = diamondSize * scale;
          
          // Add a diamond
          const points = [
            `${x},${y - size/2}`,
            `${x + size/2},${y}`,
            `${x},${y + size/2}`,
            `${x - size/2},${y}`
          ].join(' ');
          
          content += `<polygon points="${points}" />`;
        }
      }
    }
  }
  
  content += '</g>';
  return content;
}

/**
 * Generate SVG for dot patterns
 */
function generateDotPatternSVG(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  dotSpacing: number,
  simplified: boolean
): string {
  if (simplified) {
    // Use a single path for all dots to reduce file size
    let content = '<path d="';
    
    for (let y = dotSpacing/2; y < height; y += dotSpacing) {
      for (let x = dotSpacing/2; x < width; x += dotSpacing) {
        // Sample this region
        const pixelX = Math.floor(x);
        const pixelY = Math.floor(y);
        
        if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
          const pixelIndex = (pixelY * width + pixelX) * 4;
          const brightness = (pixels[pixelIndex] + pixels[pixelIndex + 1] + pixels[pixelIndex + 2]) / (3 * 255);
          
          if (brightness < 0.7) {
            // Calculate dot size based on brightness
            const radius = (dotSpacing/2) * (1 - brightness);
            
            if (radius > 0.5) {
              // Add a circle to the path
              content += `M ${x} ${y} m 0 ${-radius} a ${radius} ${radius} 0 1 0 0 ${2 * radius} a ${radius} ${radius} 0 1 0 0 ${-2 * radius} `;
            }
          }
        }
      }
    }
    
    content += '" fill="black" />';
    return content;
  } else {
    // Use individual circles for better quality
    let content = '<g fill="black">';
    
    for (let y = dotSpacing/2; y < height; y += dotSpacing) {
      for (let x = dotSpacing/2; x < width; x += dotSpacing) {
        const pixelX = Math.floor(x);
        const pixelY = Math.floor(y);
        
        if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
          const pixelIndex = (pixelY * width + pixelX) * 4;
          const brightness = (pixels[pixelIndex] + pixels[pixelIndex + 1] + pixels[pixelIndex + 2]) / (3 * 255);
          
          if (brightness < 0.7) {
            const radius = (dotSpacing/2) * (1 - brightness);
            if (radius > 0.5) {
              content += `<circle cx="${x}" cy="${y}" r="${radius}" />`;
            }
          }
        }
      }
    }
    
    content += '</g>';
    return content;
  }
}

/**
 * Generate pixel-based SVG (fallback for algorithms that don't have a specific vector representation)
 */
function generatePixelBasedSVG(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  simplified: boolean
): string {
  if (simplified) {
    // Group nearby pixels into rectangles to reduce file size
    return generateOptimizedPixelSVG(pixels, width, height);
  } else {
    // Use individual rectangles for each pixel
    let content = '<g fill="black">';
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        const r = pixels[pixelIndex];
        const g = pixels[pixelIndex + 1];
        const b = pixels[pixelIndex + 2];
        
        // Only include pixel if it's dark
        if (r < 128 && g < 128 && b < 128) {
          content += `<rect x="${x}" y="${y}" width="1" height="1" />`;
        }
      }
    }
    
    content += '</g>';
    return content;
  }
}

/**
 * Optimize pixel-based SVG by grouping adjacent pixels
 */
function generateOptimizedPixelSVG(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): string {
  // Create a binary map of black pixels
  const blackPixels = new Array(height);
  for (let y = 0; y < height; y++) {
    blackPixels[y] = new Array(width);
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      blackPixels[y][x] = pixels[pixelIndex] < 128 ? 1 : 0;
    }
  }
  
  // Group pixels into rectangles
  const rectangles = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (blackPixels[y][x]) {
        // Found a black pixel
        let w = 1;
        
        // Expand to the right as far as possible
        while (x + w < width && blackPixels[y][x + w]) {
          w++;
        }
        
        // Try to expand down as far as possible
        let h = 1;
        let canExpand = true;
        
        while (y + h < height && canExpand) {
          // Check if the entire row can be included
          for (let i = 0; i < w; i++) {
            if (!blackPixels[y + h][x + i]) {
              canExpand = false;
              break;
            }
          }
          
          if (canExpand) {
            h++;
          }
        }
        
        // Add the rectangle
        rectangles.push({
          x,
          y,
          width: w,
          height: h
        });
        
        // Mark these pixels as processed
        for (let j = 0; j < h; j++) {
          for (let i = 0; i < w; i++) {
            blackPixels[y + j][x + i] = 0;
          }
        }
      }
    }
  }
  
  // Generate SVG from rectangles
  let content = '<g fill="black">';
  
  for (const rect of rectangles) {
    content += `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" />`;
  }
  
  content += '</g>';
  return content;
}

/**
 * Generate a downloadable SVG file
 */
export function downloadSVG(
  canvas: HTMLCanvasElement,
  algorithm: DitheringAlgorithm,
  options: {
    fileName?: string;
    dotSize?: number;
    spacing?: number;
    angle?: number;
    patternType?: PatternType;
    simplified?: boolean;
    includeBackground?: boolean;
  } = {}
): void {
  const {
    fileName = `halftone-${algorithm}-${Date.now()}.svg`,
  } = options;
  
  const svgContent = canvasToSVG(canvas, algorithm, options);
  
  // Create a blob and download
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} 