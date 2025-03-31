// GIF processing with dithering effects
// This enables animation support for the app

import { DitheringAlgorithm, ColorMode } from '../../store/useEditorStore';
import { processImageWithWebGL } from '../webgl/webglDithering';
import { patternMatrixToImageData } from '../webgl/webglDithering';
import { getPatternMatrix } from '../algorithms/patternDithering';
import type { PatternType } from '../algorithms/patternDithering';
import { processImage } from '../algorithms';
import { isWebGLSupported } from '../webgl/webglDithering';

// GIF frame extraction types
interface GifFrame {
  imageData: ImageData;
  delay: number; // Delay in ms
}

/**
 * Process a GIF file and apply dithering effects to each frame
 */
export async function processGif(
  gifUrl: string,
  algorithm: DitheringAlgorithm,
  options: {
    dotSize?: number;
    contrast?: number;
    colorMode?: ColorMode;
    spacing?: number;
    angle?: number;
    patternType?: PatternType;
    patternSize?: number;
    customColors?: string[];
    onProgress?: (progress: number) => void;
  }
): Promise<Blob> {
  const {
    dotSize = 4,
    contrast = 50,
    colorMode = 'bw',
    spacing = 8,
    angle = 45,
    patternType = 'dots',
    patternSize = 4,
    customColors = [],
    onProgress = () => {}
  } = options;
  
  // Try to load the GIF.js library dynamically
  const GIFModule = await importGifJs();
  
  // Extract frames from the GIF
  onProgress(10);
  const frames = await extractGifFrames(gifUrl);
  onProgress(30);
  
  // Process each frame with dithering
  const processedFrames: ImageData[] = [];
  const delays: number[] = [];
  
  const useWebGL = isWebGLSupported() && 
    (algorithm === 'ordered' || algorithm === 'halftone' || algorithm === 'pattern');
  
  // Process all frames with the selected algorithm
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    delays.push(frame.delay);
    
    let processedFrame: ImageData;
    
    if (useWebGL) {
      // Use WebGL acceleration
      processedFrame = processImageWithWebGL(
        frame.imageData,
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
    } else {
      // Use CPU processing
      // Since processImage expects HTMLImageElement, we need to create a fake one
      const canvas = document.createElement('canvas');
      canvas.width = frame.imageData.width;
      canvas.height = frame.imageData.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(frame.imageData, 0, 0);
      
      // Create a fake image object
      const fakeImg = {
        width: frame.imageData.width,
        height: frame.imageData.height,
        // Actual data will be retrieved from the canvas in processImage
      };
      
      processedFrame = processImage(
        fakeImg as unknown as HTMLImageElement,
        algorithm,
        dotSize,
        contrast,
        colorMode,
        spacing,
        angle,
        customColors,
        0, // brightness
        1.0, // gamma
        0, // hue
        0, // saturation
        0, // lightness
        0, // sharpness
        0, // blur
        patternType,
        patternSize
      );
    }
    
    processedFrames.push(processedFrame);
    onProgress(30 + Math.floor((i + 1) / frames.length * 40));
  }
  
  // Create a new GIF from the processed frames
  onProgress(70);
  const outputGif = await createGifFromFrames(processedFrames, delays);
  onProgress(100);
  
  return outputGif;
}

/**
 * Extract frames from a GIF file
 */
async function extractGifFrames(gifUrl: string): Promise<GifFrame[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = gifUrl;
    img.onload = () => {
      const frames: GifFrame[] = [];
      
      // Use SuperGif to parse the GIF
      // @ts-ignore: SuperGif is loaded dynamically
      const gifInstance = new SuperGif({ gif: img });
      
      gifInstance.load(() => {
        const numFrames = gifInstance.get_length();
        
        for (let i = 0; i < numFrames; i++) {
          gifInstance.move_to(i);
          const canvas = gifInstance.get_canvas();
          const ctx = canvas.getContext('2d')!;
          const frameImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Get frame delay in ms (SuperGif returns it in 1/100th of a second)
          const delay = gifInstance.get_frames()[i].delay * 10;
          
          frames.push({
            imageData: frameImageData,
            delay: delay > 0 ? delay : 100 // Default to 100ms if delay is 0
          });
        }
        
        resolve(frames);
      });
    };
    img.onerror = reject;
  });
}

/**
 * Create a GIF from processed frames
 */
async function createGifFromFrames(frames: ImageData[], delays: number[]): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create a new GIF encoder using GIF.js
    // @ts-ignore: GIF is loaded dynamically
    const gif = new GIF({
      workers: 4,
      quality: 10,
      workerScript: '/gif.worker.js', // Path to the worker script
      width: frames[0].width,
      height: frames[0].height
    });
    
    // Add each frame to the GIF
    frames.forEach((frame, index) => {
      const canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(frame, 0, 0);
      
      gif.addFrame(canvas, { delay: delays[index], copy: true });
    });
    
    // Generate the GIF
    gif.on('finished', (blob: Blob) => {
      resolve(blob);
    });
    
    gif.on('error', (error: Error) => {
      reject(error);
    });
    
    gif.render();
  });
}

/**
 * Dynamically import the GIF.js and SuperGif libraries
 */
async function importGifJs(): Promise<any> {
  // Check if the libraries are already loaded
  if (window.GIF && window.SuperGif) {
    return { GIF: window.GIF, SuperGif: window.SuperGif };
  }
  
  // Load the libraries dynamically
  return new Promise((resolve, reject) => {
    // Load SuperGif first
    const supergifScript = document.createElement('script');
    supergifScript.src = 'https://cdn.jsdelivr.net/npm/libgif@0.0.3/libgif.js';
    supergifScript.onload = () => {
      // Then load GIF.js
      const gifScript = document.createElement('script');
      gifScript.src = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js';
      gifScript.onload = () => {
        // Both libraries loaded
        resolve({ GIF: window.GIF, SuperGif: window.SuperGif });
      };
      gifScript.onerror = reject;
      document.head.appendChild(gifScript);
      
      // Also load the GIF.js worker
      const workerScript = document.createElement('script');
      workerScript.src = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js';
      document.head.appendChild(workerScript);
    };
    supergifScript.onerror = reject;
    document.head.appendChild(supergifScript);
  });
}

/**
 * Create a download link for a processed GIF
 */
export function downloadProcessedGif(gifBlob: Blob, fileName: string = `dithered-animation-${Date.now()}.gif`): void {
  const url = URL.createObjectURL(gifBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Add types for external libraries
declare global {
  interface Window {
    GIF: any;
    SuperGif: any;
  }
} 