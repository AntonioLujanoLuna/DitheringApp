export * from './grayscale';
export * from './ordered';
export * from './floydSteinberg';
export * from './atkinson';
export * from './halftone';
export * from './jarvisJudiceNinke';
export * from './stucki';
export * from './burkes';
export * from './sierraLite';
export * from './random';
export * from './voidAndCluster';
export * from './blueNoise';
export * from './riemersma';
export * from './directBinarySearch';
export * from './patternDithering';
export * from './multiTone';
export * from './imageProcessing';
export * from './selectiveDithering';

// Fix circular dependency by importing directly from individual files
// instead of from './index'
import { rgbToGrayscale } from './grayscale';
import { orderedDithering } from './ordered';
import { floydSteinbergDithering } from './floydSteinberg';
import { atkinsonDithering } from './atkinson';
import { halftoneDithering } from './halftone';
import { jarvisJudiceNinkeDithering } from './jarvisJudiceNinke';
import { stuckiDithering } from './stucki';
import { burkesDithering } from './burkes';
import { sierraLiteDithering } from './sierraLite';
import { randomDithering } from './random';
import { voidAndClusterDithering } from './voidAndCluster';
import { blueNoiseDithering } from './blueNoise';
import { riemersmaDithering } from './riemersma';
import { directBinarySearchDithering } from './directBinarySearch';
import { patternDithering, PatternType } from './patternDithering';
import { multiToneDithering, MultiToneAlgorithm } from './multiTone';
import { 
  adjustBrightnessContrast, 
  applyGamma, 
  adjustHSL,
  sharpen as sharpenImage,
  blur as blurImage
} from './imageProcessing';

import { DitheringAlgorithm, ColorMode } from '../../store/useEditingSessionStore';

export function processImage(
  sourceImage: HTMLImageElement,
  algorithm: DitheringAlgorithm,
  dotSize: number,
  contrast: number,
  colorMode: ColorMode,
  spacing: number,
  angle: number,
  customColors: string[] = [],
  brightness: number = 0,
  gammaCorrection: number = 1.0,
  hue: number = 0,
  saturation: number = 0,
  lightness: number = 0,
  sharpness: number = 0,
  blurRadius: number = 0,
  patternType: PatternType = 'dots',
  patternSize: number = 4,
  toneLevel: number = 4,
  multiToneAlgorithm: MultiToneAlgorithm = 'ordered'
): ImageData {
  // Create canvas to draw the image
  const canvas = document.createElement('canvas');
  canvas.width = sourceImage.width;
  canvas.height = sourceImage.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Draw the image to get its pixel data
  ctx.drawImage(sourceImage, 0, 0);
  
  // First, apply any pre-processing
  let processedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  if (contrast !== 50) {
    // Apply contrast adjustment (0-100 range, 50 is neutral)
    const contrastValue = ((contrast - 50) * 2); // Convert to -100 to 100 range
    processedImageData = adjustBrightnessContrast(processedImageData, 0, contrastValue);
  }
  
  // Apply specified image processing if values are non-default
  if (brightness !== 0) {
    processedImageData = adjustBrightnessContrast(processedImageData, brightness, 0);
  }
  
  if (gammaCorrection !== 1.0) {
    processedImageData = applyGamma(processedImageData, gammaCorrection);
  }
  
  if (hue !== 0 || saturation !== 0 || lightness !== 0) {
    processedImageData = adjustHSL(processedImageData, hue, saturation, lightness);
  }
  
  if (sharpness > 0) {
    processedImageData = sharpenImage(processedImageData, sharpness);
  }
  
  if (blurRadius > 0) {
    processedImageData = blurImage(processedImageData, blurRadius);
  }
  
  // Put the processed image back on the canvas
  ctx.putImageData(processedImageData, 0, 0);
  
  // Re-get the image data after processing
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Process based on color mode
  if (colorMode === 'bw') {
    // Convert to grayscale
    const grayscale = rgbToGrayscale(imageData);
    
    // Apply the selected algorithm
    let result: ImageData;
    
    switch (algorithm) {
      case 'ordered':
        result = orderedDithering(grayscale, canvas.width, canvas.height, dotSize);
        break;
      case 'floydSteinberg':
        result = floydSteinbergDithering(grayscale, canvas.width, canvas.height);
        break;
      case 'atkinson':
        result = atkinsonDithering(grayscale, canvas.width, canvas.height);
        break;
      case 'halftone':
        result = halftoneDithering(grayscale, canvas.width, canvas.height, dotSize, spacing, angle);
        break;
      case 'jarvisJudiceNinke':
        result = jarvisJudiceNinkeDithering(grayscale, canvas.width, canvas.height);
        break;
      case 'stucki':
        result = stuckiDithering(grayscale, canvas.width, canvas.height);
        break;
      case 'burkes':
        result = burkesDithering(grayscale, canvas.width, canvas.height);
        break;
      case 'sierraLite':
        result = sierraLiteDithering(grayscale, canvas.width, canvas.height);
        break;
      case 'random':
        result = randomDithering(grayscale, canvas.width, canvas.height);
        break;
      case 'voidAndCluster':
        result = voidAndClusterDithering(grayscale, canvas.width, canvas.height);
        break;
      case 'blueNoise':
        result = blueNoiseDithering(grayscale, canvas.width, canvas.height);
        break;
      case 'riemersma':
        result = riemersmaDithering(grayscale, canvas.width, canvas.height);
        break;
      case 'directBinarySearch':
        result = directBinarySearchDithering(grayscale, canvas.width, canvas.height);
        break;
      case 'pattern':
        // Use additional parameters from store
        result = patternDithering(grayscale, canvas.width, canvas.height, patternType, patternSize);
        break;
      case 'multiTone':
        // Use additional parameters from store
        result = multiToneDithering(grayscale, canvas.width, canvas.height, toneLevel, multiToneAlgorithm, dotSize);
        break;
      case 'selective':
        // For selective dithering, we need a default implementation since we have no regions defined by default
        // Default to just using the standard ordered dithering
        result = orderedDithering(grayscale, canvas.width, canvas.height, dotSize);
        break;
      default:
        result = orderedDithering(grayscale, canvas.width, canvas.height, dotSize);
    }
    
    return result;
  } else if (colorMode === 'cmyk') {
    // CMYK processing (simplified version)
    // In a real implementation, you'd separate into C, M, Y, K channels
    // and apply dithering to each
    
    // For this example, we'll just simulate it by applying the algorithm
    // to each RGB channel with different angles
    
    // Create an output ImageData
    const result = new ImageData(canvas.width, canvas.height);
    
    // Process each RGB channel separately with different angles
    const redChannel = processChannel(imageData, 0, algorithm, dotSize, spacing, angle, patternType, patternSize, toneLevel, multiToneAlgorithm);
    const greenChannel = processChannel(imageData, 1, algorithm, dotSize, spacing, angle + 30, patternType, patternSize, toneLevel, multiToneAlgorithm);
    const blueChannel = processChannel(imageData, 2, algorithm, dotSize, spacing, angle + 60, patternType, patternSize, toneLevel, multiToneAlgorithm);
    
    // Combine channels
    for (let i = 0; i < result.data.length; i += 4) {
      result.data[i] = redChannel.data[i];
      result.data[i + 1] = greenChannel.data[i + 1];
      result.data[i + 2] = blueChannel.data[i + 2];
      result.data[i + 3] = 255; // Alpha
    }
    
    return result;
  } else if (colorMode === 'rgb') {
    // RGB processing
    // Process each channel separately and combine
    
    // Create an output ImageData
    const result = new ImageData(canvas.width, canvas.height);
    
    // Extract and process each channel
    const redGrayscale = extractChannel(imageData, 0);
    const greenGrayscale = extractChannel(imageData, 1);
    const blueGrayscale = extractChannel(imageData, 2);
    
    // Apply dithering to each channel
    let redResult: ImageData;
    let greenResult: ImageData;
    let blueResult: ImageData;
    
    switch (algorithm) {
      case 'ordered':
        redResult = orderedDithering(redGrayscale, canvas.width, canvas.height, dotSize);
        greenResult = orderedDithering(greenGrayscale, canvas.width, canvas.height, dotSize);
        blueResult = orderedDithering(blueGrayscale, canvas.width, canvas.height, dotSize);
        break;
      case 'floydSteinberg':
        redResult = floydSteinbergDithering(redGrayscale, canvas.width, canvas.height);
        greenResult = floydSteinbergDithering(greenGrayscale, canvas.width, canvas.height);
        blueResult = floydSteinbergDithering(blueGrayscale, canvas.width, canvas.height);
        break;
      case 'atkinson':
        redResult = atkinsonDithering(redGrayscale, canvas.width, canvas.height);
        greenResult = atkinsonDithering(greenGrayscale, canvas.width, canvas.height);
        blueResult = atkinsonDithering(blueGrayscale, canvas.width, canvas.height);
        break;
      case 'halftone':
        redResult = halftoneDithering(redGrayscale, canvas.width, canvas.height, dotSize, spacing, angle);
        greenResult = halftoneDithering(greenGrayscale, canvas.width, canvas.height, dotSize, spacing, angle + 30);
        blueResult = halftoneDithering(blueGrayscale, canvas.width, canvas.height, dotSize, spacing, angle + 60);
        break;
      case 'jarvisJudiceNinke':
        redResult = jarvisJudiceNinkeDithering(redGrayscale, canvas.width, canvas.height);
        greenResult = jarvisJudiceNinkeDithering(greenGrayscale, canvas.width, canvas.height);
        blueResult = jarvisJudiceNinkeDithering(blueGrayscale, canvas.width, canvas.height);
        break;
      case 'stucki':
        redResult = stuckiDithering(redGrayscale, canvas.width, canvas.height);
        greenResult = stuckiDithering(greenGrayscale, canvas.width, canvas.height);
        blueResult = stuckiDithering(blueGrayscale, canvas.width, canvas.height);
        break;
      case 'burkes':
        redResult = burkesDithering(redGrayscale, canvas.width, canvas.height);
        greenResult = burkesDithering(greenGrayscale, canvas.width, canvas.height);
        blueResult = burkesDithering(blueGrayscale, canvas.width, canvas.height);
        break;
      case 'sierraLite':
        redResult = sierraLiteDithering(redGrayscale, canvas.width, canvas.height);
        greenResult = sierraLiteDithering(greenGrayscale, canvas.width, canvas.height);
        blueResult = sierraLiteDithering(blueGrayscale, canvas.width, canvas.height);
        break;
      case 'random':
        redResult = randomDithering(redGrayscale, canvas.width, canvas.height);
        greenResult = randomDithering(greenGrayscale, canvas.width, canvas.height);
        blueResult = randomDithering(blueGrayscale, canvas.width, canvas.height);
        break;
      case 'voidAndCluster':
        redResult = voidAndClusterDithering(redGrayscale, canvas.width, canvas.height);
        greenResult = voidAndClusterDithering(greenGrayscale, canvas.width, canvas.height);
        blueResult = voidAndClusterDithering(blueGrayscale, canvas.width, canvas.height);
        break;
      case 'blueNoise':
        redResult = blueNoiseDithering(redGrayscale, canvas.width, canvas.height);
        greenResult = blueNoiseDithering(greenGrayscale, canvas.width, canvas.height);
        blueResult = blueNoiseDithering(blueGrayscale, canvas.width, canvas.height);
        break;
      case 'riemersma':
        redResult = riemersmaDithering(redGrayscale, canvas.width, canvas.height);
        greenResult = riemersmaDithering(greenGrayscale, canvas.width, canvas.height);
        blueResult = riemersmaDithering(blueGrayscale, canvas.width, canvas.height);
        break;
      case 'directBinarySearch':
        redResult = directBinarySearchDithering(redGrayscale, canvas.width, canvas.height);
        greenResult = directBinarySearchDithering(greenGrayscale, canvas.width, canvas.height);
        blueResult = directBinarySearchDithering(blueGrayscale, canvas.width, canvas.height);
        break;
      case 'pattern':
        redResult = patternDithering(redGrayscale, canvas.width, canvas.height, patternType, patternSize);
        greenResult = patternDithering(greenGrayscale, canvas.width, canvas.height, patternType, patternSize);
        blueResult = patternDithering(blueGrayscale, canvas.width, canvas.height, patternType, patternSize);
        break;
      case 'multiTone':
        redResult = multiToneDithering(redGrayscale, canvas.width, canvas.height, toneLevel, multiToneAlgorithm, dotSize);
        greenResult = multiToneDithering(greenGrayscale, canvas.width, canvas.height, toneLevel, multiToneAlgorithm, dotSize);
        blueResult = multiToneDithering(blueGrayscale, canvas.width, canvas.height, toneLevel, multiToneAlgorithm, dotSize);
        break;
      default:
        redResult = orderedDithering(redGrayscale, canvas.width, canvas.height, dotSize);
        greenResult = orderedDithering(greenGrayscale, canvas.width, canvas.height, dotSize);
        blueResult = orderedDithering(blueGrayscale, canvas.width, canvas.height, dotSize);
    }
    
    // Combine channels
    for (let i = 0; i < result.data.length; i += 4) {
      result.data[i] = redResult.data[i];
      result.data[i + 1] = greenResult.data[i + 1];
      result.data[i + 2] = blueResult.data[i + 2];
      result.data[i + 3] = 255; // Alpha
    }
    
    return result;
  } else if (colorMode === 'custom') {
    // Custom color mode
    // For this example, we'll implement a simple custom palette with dithering
    
    // Convert to grayscale
    const grayscale = rgbToGrayscale(imageData);
    
    // Create an output ImageData
    const result = new ImageData(canvas.width, canvas.height);
    
    // Ensure we have at least 2 colors in the palette
    const palette = customColors.length >= 2 ? customColors : ['#000000', '#ffffff'];
    
    // Convert hex colors to RGB
    const rgbPalette = palette.map(hexToRgb);
    
    // Sort palette by luminance
    rgbPalette.sort((a, b) => {
      const luminanceA = 0.299 * a.r + 0.587 * a.g + 0.114 * a.b;
      const luminanceB = 0.299 * b.r + 0.587 * b.g + 0.114 * b.b;
      return luminanceA - luminanceB;
    });
    
    // Apply dithering
    // Create a copy of the grayscale image for error diffusion
    const buffer = new Float32Array(grayscale);
    
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = y * canvas.width + x;
        const pixelValue = buffer[idx];
        
        // Map the grayscale value to the palette
        const normalizedValue = pixelValue / 255;
        const paletteIndex = Math.min(
          Math.floor(normalizedValue * rgbPalette.length),
          rgbPalette.length - 1
        );
        
        const selectedColor = rgbPalette[paletteIndex];
        
        // Set the pixel color
        const outputIdx = idx * 4;
        result.data[outputIdx] = selectedColor.r;
        result.data[outputIdx + 1] = selectedColor.g;
        result.data[outputIdx + 2] = selectedColor.b;
        result.data[outputIdx + 3] = 255; // Alpha
        
        // Calculate error for error diffusion
        if (algorithm === 'floydSteinberg' || algorithm === 'atkinson' || 
            algorithm === 'jarvisJudiceNinke' || algorithm === 'stucki' || 
            algorithm === 'burkes' || algorithm === 'sierraLite') {
          const selectedLuminance = 0.299 * selectedColor.r + 0.587 * selectedColor.g + 0.114 * selectedColor.b;
          const error = pixelValue - selectedLuminance;
          
          if (algorithm === 'floydSteinberg') {
            // Distribute error using Floyd-Steinberg pattern
            if (x + 1 < canvas.width) {
              buffer[idx + 1] += error * (7 / 16);
            }
            
            if (y + 1 < canvas.height) {
              if (x - 1 >= 0) {
                buffer[idx + canvas.width - 1] += error * (3 / 16);
              }
              
              buffer[idx + canvas.width] += error * (5 / 16);
              
              if (x + 1 < canvas.width) {
                buffer[idx + canvas.width + 1] += error * (1 / 16);
              }
            }
          } else if (algorithm === 'atkinson') {
            // Distribute error using Atkinson pattern
            const atkinsonError = error / 8;
            
            if (x + 1 < canvas.width) {
              buffer[idx + 1] += atkinsonError;
            }
            
            if (x + 2 < canvas.width) {
              buffer[idx + 2] += atkinsonError;
            }
            
            if (y + 1 < canvas.height) {
              if (x - 1 >= 0) {
                buffer[idx + canvas.width - 1] += atkinsonError;
              }
              
              buffer[idx + canvas.width] += atkinsonError;
              
              if (x + 1 < canvas.width) {
                buffer[idx + canvas.width + 1] += atkinsonError;
              }
            }
            
            if (y + 2 < canvas.height) {
              buffer[idx + canvas.width * 2] += atkinsonError;
            }
          } else if (algorithm === 'jarvisJudiceNinke') {
            // Distribute error using JJN pattern
            if (x + 1 < canvas.width) buffer[idx + 1] += error * (7 / 48);
            if (x + 2 < canvas.width) buffer[idx + 2] += error * (5 / 48);
            
            if (y + 1 < canvas.height) {
              if (x - 2 >= 0) buffer[idx + canvas.width - 2] += error * (3 / 48);
              if (x - 1 >= 0) buffer[idx + canvas.width - 1] += error * (5 / 48);
              buffer[idx + canvas.width] += error * (7 / 48);
              if (x + 1 < canvas.width) buffer[idx + canvas.width + 1] += error * (5 / 48);
              if (x + 2 < canvas.width) buffer[idx + canvas.width + 2] += error * (3 / 48);
            }
            
            if (y + 2 < canvas.height) {
              if (x - 2 >= 0) buffer[idx + 2 * canvas.width - 2] += error * (1 / 48);
              if (x - 1 >= 0) buffer[idx + 2 * canvas.width - 1] += error * (3 / 48);
              buffer[idx + 2 * canvas.width] += error * (5 / 48);
              if (x + 1 < canvas.width) buffer[idx + 2 * canvas.width + 1] += error * (3 / 48);
              if (x + 2 < canvas.width) buffer[idx + 2 * canvas.width + 2] += error * (1 / 48);
            }
          } else if (algorithm === 'stucki') {
            // Distribute error using Stucki pattern
            if (x + 1 < canvas.width) buffer[idx + 1] += error * (8 / 42);
            if (x + 2 < canvas.width) buffer[idx + 2] += error * (4 / 42);
            
            if (y + 1 < canvas.height) {
              if (x - 2 >= 0) buffer[idx + canvas.width - 2] += error * (2 / 42);
              if (x - 1 >= 0) buffer[idx + canvas.width - 1] += error * (4 / 42);
              buffer[idx + canvas.width] += error * (8 / 42);
              if (x + 1 < canvas.width) buffer[idx + canvas.width + 1] += error * (4 / 42);
              if (x + 2 < canvas.width) buffer[idx + canvas.width + 2] += error * (2 / 42);
            }
            
            if (y + 2 < canvas.height) {
              if (x - 2 >= 0) buffer[idx + 2 * canvas.width - 2] += error * (1 / 42);
              if (x - 1 >= 0) buffer[idx + 2 * canvas.width - 1] += error * (2 / 42);
              buffer[idx + 2 * canvas.width] += error * (4 / 42);
              if (x + 1 < canvas.width) buffer[idx + 2 * canvas.width + 1] += error * (2 / 42);
              if (x + 2 < canvas.width) buffer[idx + 2 * canvas.width + 2] += error * (1 / 42);
            }
          } else if (algorithm === 'burkes') {
            // Distribute error using Burkes pattern
            if (x + 1 < canvas.width) buffer[idx + 1] += error * (8 / 32);
            if (x + 2 < canvas.width) buffer[idx + 2] += error * (4 / 32);
            
            if (y + 1 < canvas.height) {
              if (x - 2 >= 0) buffer[idx + canvas.width - 2] += error * (2 / 32);
              if (x - 1 >= 0) buffer[idx + canvas.width - 1] += error * (4 / 32);
              buffer[idx + canvas.width] += error * (8 / 32);
              if (x + 1 < canvas.width) buffer[idx + canvas.width + 1] += error * (4 / 32);
              if (x + 2 < canvas.width) buffer[idx + canvas.width + 2] += error * (2 / 32);
            }
          } else if (algorithm === 'sierraLite') {
            // Distribute error using Sierra-Lite pattern
            if (x + 1 < canvas.width) buffer[idx + 1] += error * (2 / 4);
            
            if (y + 1 < canvas.height) {
              if (x - 1 >= 0) buffer[idx + canvas.width - 1] += error * (1 / 4);
              buffer[idx + canvas.width] += error * (1 / 4);
            }
          }
        }
      }
    }
    
    return result;
  }
  
  // Default: return a copy of the original image
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}

// Helper function to process a single channel
function processChannel(
  imageData: ImageData,
  channelIndex: number,
  algorithm: DitheringAlgorithm,
  dotSize: number,
  spacing: number,
  angle: number,
  patternType: PatternType = 'dots',
  patternSize: number = 4,
  toneLevel: number = 4,
  multiToneAlgorithm: MultiToneAlgorithm = 'ordered'
): ImageData {
  // Extract channel
  const channel = extractChannel(imageData, channelIndex);
  
  // Apply dithering
  let result: ImageData;
  
  switch (algorithm) {
    case 'ordered':
      result = orderedDithering(channel, imageData.width, imageData.height, dotSize);
      break;
    case 'floydSteinberg':
      result = floydSteinbergDithering(channel, imageData.width, imageData.height);
      break;
    case 'atkinson':
      result = atkinsonDithering(channel, imageData.width, imageData.height);
      break;
    case 'halftone':
      result = halftoneDithering(channel, imageData.width, imageData.height, dotSize, spacing, angle);
      break;
    case 'jarvisJudiceNinke':
      result = jarvisJudiceNinkeDithering(channel, imageData.width, imageData.height);
      break;
    case 'stucki':
      result = stuckiDithering(channel, imageData.width, imageData.height);
      break;
    case 'burkes':
      result = burkesDithering(channel, imageData.width, imageData.height);
      break;
    case 'sierraLite':
      result = sierraLiteDithering(channel, imageData.width, imageData.height);
      break;
    case 'random':
      result = randomDithering(channel, imageData.width, imageData.height);
      break;
    case 'voidAndCluster':
      result = voidAndClusterDithering(channel, imageData.width, imageData.height);
      break;
    case 'blueNoise':
      result = blueNoiseDithering(channel, imageData.width, imageData.height);
      break;
    case 'riemersma':
      result = riemersmaDithering(channel, imageData.width, imageData.height);
      break;
    case 'directBinarySearch':
      result = directBinarySearchDithering(channel, imageData.width, imageData.height);
      break;
    case 'pattern':
      result = patternDithering(channel, imageData.width, imageData.height, patternType, patternSize);
      break;
    case 'multiTone':
      result = multiToneDithering(channel, imageData.width, imageData.height, toneLevel, multiToneAlgorithm, dotSize);
      break;
    default:
      result = orderedDithering(channel, imageData.width, imageData.height, dotSize);
  }
  
  return result;
}

// Extract a single channel from an ImageData
function extractChannel(imageData: ImageData, channelIndex: number): Uint8ClampedArray {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  const channel = new Uint8ClampedArray(width * height);
  
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    channel[j] = data[i + channelIndex];
  }
  
  return channel;
}

// Helper function to adjust contrast
function applyContrast(imageData: ImageData, contrastValue: number): void {
  const contrast = (contrastValue / 100) * 255;
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = clamp(factor * (imageData.data[i] - 128) + 128);
    imageData.data[i + 1] = clamp(factor * (imageData.data[i + 1] - 128) + 128);
    imageData.data[i + 2] = clamp(factor * (imageData.data[i + 2] - 128) + 128);
    // Alpha remains unchanged
  }
}

// Helper function to clamp values between 0 and 255
function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  let r, g, b;
  
  if (hex.length === 3) {
    // Short form #RGB
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
  } else {
    // Full form #RRGGBB
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  
  return { r, g, b };
}