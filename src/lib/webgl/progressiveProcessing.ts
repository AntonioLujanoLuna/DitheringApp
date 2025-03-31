// Progressive image processing utilities
// This allows for showing incremental updates during processing

import { processImageWithWebGL, patternMatrixToImageData, isWebGLSupported } from './webglDithering';
import { DitheringAlgorithm, ColorMode } from '../../store/useEditorStore';
import { getPatternMatrix } from '../algorithms/patternDithering';
import type { PatternType } from '../algorithms/patternDithering';

// Progressive processing with callbacks for progress updates
export function processImageProgressively(
  sourceImage: HTMLImageElement,
  algorithm: DitheringAlgorithm,
  options: {
    dotSize?: number;
    contrast?: number;
    colorMode?: ColorMode;
    spacing?: number;
    angle?: number;
    patternType?: PatternType;
    patternSize?: number;
    onProgress?: (progress: number, partialResult?: ImageData) => void;
    onComplete?: (result: ImageData) => void;
    progressSteps?: number;
  }
): void {
  // Default values
  const {
    dotSize = 4,
    contrast = 50,
    colorMode = 'bw',
    spacing = 8,
    angle = 45,
    patternType = 'dots',
    patternSize = 4,
    onProgress = () => {},
    onComplete = () => {},
    progressSteps = 4
  } = options;

  // Check if WebGL is supported
  const useWebGL = isWebGLSupported() && 
    (algorithm === 'ordered' || algorithm === 'halftone' || algorithm === 'pattern');

  // If the image is small or WebGL isn't supported, process in one go
  const isSmallImage = sourceImage.width * sourceImage.height < 500000;
  if (isSmallImage || !useWebGL) {
    // Signal start
    onProgress(0);
    
    // Process on the next tick to allow UI to update
    setTimeout(() => {
      try {
        const result = processImageWithWebGL(
          sourceImage,
          algorithm === 'pattern' ? 'pattern' : 
          algorithm === 'ordered' ? 'ordered' : 'halftone',
          {
            patternSize,
            dotSize,
            spacing,
            angle,
            patternTexture: algorithm === 'pattern' ? 
              patternMatrixToImageData(getPatternMatrix(patternType, patternSize)) : undefined
          }
        );
        
        onProgress(100, result);
        onComplete(result);
      } catch (error) {
        console.error('Error processing image:', error);
        // Fall back to non-WebGL processing here if needed
      }
    }, 0);
    
    return;
  }

  // For larger images, process in chunks to show progress
  const canvas = document.createElement('canvas');
  canvas.width = sourceImage.width;
  canvas.height = sourceImage.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Draw the image to get its pixel data
  ctx.drawImage(sourceImage, 0, 0);
  
  // Setup for processing in chunks
  const totalHeight = sourceImage.height;
  const chunkSize = Math.ceil(totalHeight / progressSteps);
  let processedHeight = 0;
  
  // Function to process the next chunk
  const processNextChunk = () => {
    // Calculate the height of this chunk
    const currentChunkHeight = Math.min(chunkSize, totalHeight - processedHeight);
    
    if (currentChunkHeight <= 0) {
      // All chunks processed
      return;
    }
    
    // Extract the next chunk of the image
    const chunkImageData = ctx.getImageData(0, processedHeight, canvas.width, currentChunkHeight);
    
    try {
      // Process this chunk with WebGL
      const chunkResult = processImageWithWebGL(
        chunkImageData,
        algorithm === 'pattern' ? 'pattern' : 
        algorithm === 'ordered' ? 'ordered' : 'halftone',
        {
          patternSize,
          dotSize,
          spacing,
          angle,
          patternTexture: algorithm === 'pattern' ? 
            patternMatrixToImageData(getPatternMatrix(patternType, patternSize)) : undefined
        }
      );
      
      // Put the processed chunk back on the canvas
      ctx.putImageData(chunkResult, 0, processedHeight);
      
      // Update processed height and calculate progress
      processedHeight += currentChunkHeight;
      const progress = Math.min(100, Math.round((processedHeight / totalHeight) * 100));
      
      // Get the current state of the canvas for progress updates
      const currentResult = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Report progress
      onProgress(progress, currentResult);
      
      if (processedHeight >= totalHeight) {
        // All done
        onComplete(currentResult);
      } else {
        // Schedule the next chunk
        setTimeout(processNextChunk, 0);
      }
    } catch (error) {
      console.error('Error processing image chunk:', error);
      // Fall back to non-WebGL processing here if needed
    }
  };
  
  // Start processing
  onProgress(0);
  setTimeout(processNextChunk, 0);
}

// Process a batch of images progressively
export function processBatchProgressively(
  images: HTMLImageElement[],
  algorithm: DitheringAlgorithm,
  options: {
    dotSize?: number;
    contrast?: number;
    colorMode?: ColorMode;
    spacing?: number;
    angle?: number;
    patternType?: PatternType;
    patternSize?: number;
    onImageProgress?: (imageIndex: number, imageProgress: number) => void;
    onBatchProgress?: (batchProgress: number, processedImages: ImageData[]) => void;
    onComplete?: (results: ImageData[]) => void;
  }
): void {
  const {
    onImageProgress = () => {},
    onBatchProgress = () => {},
    onComplete = () => {}
  } = options;
  
  const results: ImageData[] = [];
  let currentIndex = 0;
  
  // Process images one by one
  const processNextImage = () => {
    if (currentIndex >= images.length) {
      // All images processed
      onBatchProgress(100, results);
      onComplete(results);
      return;
    }
    
    const image = images[currentIndex];
    
    // Process this image with progress updates
    processImageProgressively(
      image,
      algorithm,
      {
        ...options,
        onProgress: (progress) => {
          onImageProgress(currentIndex, progress);
          
          // Calculate overall batch progress
          const overallProgress = Math.round(
            ((currentIndex + (progress / 100)) / images.length) * 100
          );
          onBatchProgress(overallProgress, results);
        },
        onComplete: (result) => {
          results.push(result);
          currentIndex++;
          
          // Process the next image
          setTimeout(processNextImage, 0);
        }
      }
    );
  };
  
  // Start processing
  processNextImage();
} 