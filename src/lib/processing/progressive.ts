import { DitheringAlgorithm, ColorMode } from '../../store/useEditingSessionStore';
import { processImageWithWebGL, patternMatrixToImageData, isWebGLSupported } from '../webgl/webglDithering';
import { processImage } from '../algorithms'; // JS fallback
import { getPatternMatrix, PatternType } from '../algorithms/patternDithering';
import { MultiToneAlgorithm } from '../algorithms/multiTone'; // Import the correct type
import { 
  orderedDitheringWasm, 
  floydSteinbergDitheringWasm, 
  atkinsonDitheringWasm, 
  halftoneDitheringWasm,
  isWasmSupported,
  loadWasmModule, // Make sure WASM is loaded if used
  preloadWasmModule // New preload function
} from '../wasm/ditheringWasm';
import { rgbToGrayscale } from '../algorithms/grayscale'; // Needed for WASM

// Interface for processing options, similar to existing ones
export interface ProgressiveOptions {
  algorithm: DitheringAlgorithm;
  sourceImageData: ImageData;
  dotSize?: number;
  contrast?: number;
  colorMode?: ColorMode;
  spacing?: number;
  angle?: number;
  patternType?: PatternType;
  patternSize?: number;
  customColors?: string[];
  brightness?: number;
  gammaCorrection?: number;
  hue?: number;
  saturation?: number;
  lightness?: number;
  sharpness?: number;
  blurRadius?: number;
  toneLevel?: number;
  multiToneAlgorithm?: MultiToneAlgorithm;
  onProgress?: (progress: number, partialResult?: ImageData) => void;
  onComplete?: (result: ImageData) => void;
  onError?: (error: Error) => void;
  progressSteps?: number; // How many chunks/steps
  minChunkSize?: number; // Minimum pixel rows per chunk
  maxChunkSize?: number; // Maximum pixel rows per chunk
  forceJS?: boolean; // Option to force JS for testing/fallback
  batchProcessing?: boolean; // Whether to process in batch (sync) or async queue
}

// Default values for options
const defaultOptions = {
  dotSize: 4,
  contrast: 50,
  colorMode: 'bw' as ColorMode,
  spacing: 8,
  angle: 45,
  patternType: 'dots' as PatternType,
  patternSize: 4,
  customColors: [],
  brightness: 0,
  gammaCorrection: 1.0,
  hue: 0,
  saturation: 0,
  lightness: 0,
  sharpness: 0,
  blurRadius: 0,
  toneLevel: 4,
  multiToneAlgorithm: 'ordered' as MultiToneAlgorithm,
  onProgress: () => {},
  onComplete: () => {},
  onError: (error: Error) => { console.error('Progressive processing error:', error); },
  progressSteps: 10, // More steps for potentially slower JS/WASM chunks
  minChunkSize: 50, // Don't make chunks too small
  maxChunkSize: 300, // Don't make chunks too large either
  forceJS: false,
  batchProcessing: false, // Default to async processing
};

// Detect device capabilities for better performance tuning
interface DeviceCapabilities {
  cores: number;
  isHighEnd: boolean;
  hasSharedArrayBuffer: boolean;
  hasOffscreenCanvas: boolean;
  maxTextureSize: number; // For WebGL
}

function detectDeviceCapabilities(): DeviceCapabilities {
  // Detect number of logical cores
  const cores = navigator.hardwareConcurrency || 2;
  
  // Detect if this is likely a high-end device
  // This is a simple heuristic - could be improved with more signals
  const isHighEnd = cores >= 4;
  
  // Check for advanced features
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
  
  // Get max texture size for WebGL (useful for chunking large images)
  let maxTextureSize = 2048; // Safe default
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    if (gl) {
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    }
  } catch (e) {
    console.warn('Could not detect WebGL max texture size', e);
  }
  
  return {
    cores,
    isHighEnd,
    hasSharedArrayBuffer,
    hasOffscreenCanvas,
    maxTextureSize
  };
}

// Module-level variable to avoid re-detection
let deviceCapabilities: DeviceCapabilities | null = null;

/**
 * Processes an image progressively, applying dithering in chunks to avoid blocking the UI.
 * Automatically selects WebGL, WebAssembly, or JavaScript based on support and algorithm.
 */
export function processImageProgressively(options: ProgressiveOptions): void {
  const opts = { ...defaultOptions, ...options };
  const {
    sourceImageData,
    algorithm,
    onProgress,
    onComplete,
    onError,
    progressSteps,
    minChunkSize,
    maxChunkSize,
    forceJS,
    colorMode,
    batchProcessing,
    // other options passed down
    ...processingOpts 
  } = opts;

  // Detect device capabilities if we haven't already
  if (!deviceCapabilities) {
    deviceCapabilities = detectDeviceCapabilities();
    console.info('Detected device capabilities:', deviceCapabilities);
  }

  const width = sourceImageData.width;
  const totalHeight = sourceImageData.height;

  // Use optimal chunk size based on image size and device capabilities
  let optimalChunkSize = calculateOptimalChunkSize(
    width, 
    totalHeight, 
    algorithm, 
    deviceCapabilities,
    progressSteps
  );
  
  // Apply min/max boundaries
  optimalChunkSize = Math.max(minChunkSize, Math.min(maxChunkSize, optimalChunkSize));
  
  // Recalculate actual steps based on chunk size
  const actualSteps = Math.ceil(totalHeight / optimalChunkSize);
  
  console.info(`Processing with chunk size: ${optimalChunkSize}px, steps: ${actualSteps}`);

  // Create a canvas to composite the results
  const resultCanvas = deviceCapabilities.hasOffscreenCanvas 
    ? new OffscreenCanvas(width, totalHeight) 
    : document.createElement('canvas');
  resultCanvas.width = width;
  resultCanvas.height = totalHeight;
  const resultCtx = resultCanvas.getContext('2d', { 
      willReadFrequently: true, 
      alpha: false // We don't need transparency for most dithering operations
  }) as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

  if (!resultCtx) {
    onError(new Error('Could not get result canvas context'));
    return;
  }

  // Determine the processing engine
  const canUseWebGL = !forceJS && isWebGLSupported() && 
    (algorithm === 'ordered' || algorithm === 'halftone' || algorithm === 'pattern');
    
  const canUseWasm = !forceJS && isWasmSupported() && colorMode === 'bw' &&
    (algorithm === 'ordered' || algorithm === 'floydSteinberg' || 
     algorithm === 'atkinson' || algorithm === 'halftone');

  let engine: 'webgl' | 'wasm' | 'js' = 'js'; // Default to JS
  
  // Choose engine based on algorithm and capabilities
  if (canUseWebGL) engine = 'webgl';
  if (canUseWasm) engine = 'wasm'; // Prioritize WASM if available for BW
  
  // Consider using WebGL for larger images (better parallelization)
  if (width * totalHeight > 1000000 && canUseWebGL) { // > 1 megapixel
    engine = 'webgl';
  }

  console.info(`Progressive processing using: ${engine.toUpperCase()}`);

  let processedHeight = 0;
  let currentStep = 0;

  // Preload WASM if it's going to be used
  let wasmLoadCheckPromise: Promise<void> | null = null;
  if (engine === 'wasm') {
    wasmLoadCheckPromise = loadWasmModule().catch(err => {
      // If preloading fails here, fallback to JS inside processNextChunk
      console.warn('WASM preloading failed, will fallback to JS', err);
      engine = 'js'; 
    });
  }

  // Batch processing - process all chunks synchronously (for smaller images)
  if (batchProcessing && totalHeight <= 1000) {
    const processBatchedChunks = async () => {
      try {
        // Make sure WASM is loaded if needed
        if (engine === 'wasm' && wasmLoadCheckPromise) {
          await wasmLoadCheckPromise;
        }
        
        let batchProgress = 0;
        for (let y = 0; y < totalHeight; y += optimalChunkSize) {
          const chunkHeight = Math.min(optimalChunkSize, totalHeight - y);
          await processChunk(y, chunkHeight);
          
          batchProgress = Math.round(((y + chunkHeight) / totalHeight) * 100);
          onProgress(batchProgress);
        }
        
        // Finish and deliver final result
        const finalResult = resultCtx.getImageData(0, 0, width, totalHeight);
        onProgress(100, finalResult);
        onComplete(finalResult);
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    };
    
    processBatchedChunks();
    return;
  }
  
  // Process chunks in a queue using requestAnimationFrame
  const processNextChunk = async () => {
    // Stop condition
    if (processedHeight >= totalHeight) {
      const finalResult = resultCtx.getImageData(0, 0, width, totalHeight);
      onProgress(100, finalResult);
      onComplete(finalResult);
      return;
    }
    
    const chunkHeight = Math.min(optimalChunkSize, totalHeight - processedHeight);
    const startY = processedHeight;
    
    try {
      // Process current chunk
      await processChunk(startY, chunkHeight);
      
      // Update progress
      processedHeight += chunkHeight;
      currentStep++;
      const progressPercent = Math.round((processedHeight / totalHeight) * 100);
      
      // Report partial result
      const partialResult = resultCtx.getImageData(0, 0, width, totalHeight);
      onProgress(progressPercent, partialResult);
      
      // Schedule next chunk using requestAnimationFrame for smoother UI updates
      requestAnimationFrame(() => processNextChunk());
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  };

  // Process a single chunk
  const processChunk = async (startY: number, chunkHeight: number): Promise<void> => {
    // Declare variables used across different engine paths and in finally block
    let chunkResultData: ImageData | null = null;
    let tempCanvas: HTMLCanvasElement | OffscreenCanvas | null = null;
    let tempCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
    let grayscaleChunk: Uint8ClampedArray | null = null;
    let ditheredGrayscale: Uint8ClampedArray | null = null;
    let ditheredChunkData: Uint8ClampedArray | null = null;
    
    // Ensure WASM is loaded if we intend to use it
    if (engine === 'wasm' && wasmLoadCheckPromise) {
      try {
        await wasmLoadCheckPromise; // Wait for the initial load attempt
      } catch (err) {
         // Already warned, engine should be JS now.
      }
    }
    
    try {
      // Extract the source chunk 
      // Use subarray with TypedArray views to avoid unnecessary allocations
      const sourceDataStart = startY * width * 4;
      const sourceDataLength = chunkHeight * width * 4;
      const chunkSourceData = new ImageData(
        new Uint8ClampedArray(sourceImageData.data.buffer, 
                             sourceDataStart, 
                             sourceDataLength),
        width,
        chunkHeight
      );
      
      // --- Processing Logic per Engine ---
      
      if (engine === 'wasm') {
        // --- WASM Processing ---
        try {
          // Convert chunk to grayscale Uint8ClampedArray for WASM functions
          grayscaleChunk = new Uint8ClampedArray(width * chunkHeight);
          for (let j = 0; j < chunkSourceData.data.length; j += 4) {
            grayscaleChunk[j/4] = Math.round(
              0.299 * chunkSourceData.data[j] + 
              0.587 * chunkSourceData.data[j+1] + 
              0.114 * chunkSourceData.data[j+2]
            );
          }
          
          // Apply contrast adjustment if needed
          if (opts.contrast !== 50) {
            const factor = (opts.contrast / 50);
            for (let i = 0; i < grayscaleChunk.length; i++) {
              const pixel = grayscaleChunk[i];
              const adjusted = 128 + factor * (pixel - 128);
              grayscaleChunk[i] = Math.max(0, Math.min(255, adjusted));
            }
          }
          
          // Call the specific WASM function based on algorithm
          switch (algorithm) {
             case 'ordered':
               ditheredGrayscale = await orderedDitheringWasm(grayscaleChunk, width, chunkHeight, opts.dotSize);
               break;
             case 'floydSteinberg':
               ditheredGrayscale = await floydSteinbergDitheringWasm(grayscaleChunk, width, chunkHeight); // Add threshold option if needed
               break;
             case 'atkinson':
               ditheredGrayscale = await atkinsonDitheringWasm(grayscaleChunk, width, chunkHeight); // Add threshold option if needed
               break;
             case 'halftone':
                ditheredGrayscale = await halftoneDitheringWasm(grayscaleChunk, width, chunkHeight, opts.dotSize, opts.spacing, opts.angle);
                break;
             default:
               throw new Error(`Unsupported WASM algorithm: ${algorithm}`);
          }

          // Convert dithered grayscale back to ImageData
          ditheredChunkData = new Uint8ClampedArray(width * chunkHeight * 4);
          for (let j = 0; j < ditheredGrayscale.length; j++) {
            const pixelValue = ditheredGrayscale[j];
            ditheredChunkData[j * 4] = pixelValue;     // R
            ditheredChunkData[j * 4 + 1] = pixelValue; // G
            ditheredChunkData[j * 4 + 2] = pixelValue; // B
            ditheredChunkData[j * 4 + 3] = 255;        // A
          }
          chunkResultData = new ImageData(ditheredChunkData, width, chunkHeight);

        } catch (wasmError) {
          console.warn(`WASM processing failed for chunk at y=${startY}, falling back to JS`, wasmError);
          engine = 'js'; // Fallback for remaining chunks too
          // Rerun processing logic for this chunk using JS below
        }
      } 
      
      if (engine === 'webgl' && !chunkResultData) {
        // --- WebGL Processing ---
        try {
          chunkResultData = processImageWithWebGL(
            chunkSourceData,
            algorithm === 'pattern' ? 'pattern' : 
            algorithm === 'ordered' ? 'ordered' : 'halftone',
            { 
              dotSize: opts.dotSize,
              spacing: opts.spacing,
              angle: opts.angle,
              // For pattern algorithm
              ...(algorithm === 'pattern' ? {
                patternSize: opts.patternSize,
                patternTexture: patternMatrixToImageData(getPatternMatrix(opts.patternType || 'dots', opts.patternSize || 4))
              } : {})
            }
          );
        } catch (webglError) {
          console.warn(`WebGL processing failed for chunk at y=${startY}, falling back to JS`, webglError);
          engine = 'js'; // Fallback for remaining chunks
        }
      }
      
      if (!chunkResultData) {
        // --- JavaScript Processing (fallback) ---
        chunkResultData = processImage(
          chunkSourceData as unknown as HTMLImageElement, 
          algorithm,
          opts.dotSize,
          opts.contrast,
          opts.colorMode,
          opts.spacing,
          opts.angle,
          opts.customColors,
          opts.brightness,
          opts.gammaCorrection,
          opts.hue,
          opts.saturation,
          opts.lightness,
          opts.sharpness,
          opts.blurRadius,
          opts.patternType,
          opts.patternSize,
          opts.toneLevel,
          opts.multiToneAlgorithm
        );
      }
      
      // Draw chunk onto the result canvas
      resultCtx.putImageData(chunkResultData, 0, startY);
      
    } finally {
      // Clean up large buffers to help with memory management
      grayscaleChunk = null;
      ditheredGrayscale = null;
      ditheredChunkData = null;
      
      // Clean up canvas resources
      if (tempCanvas) {
        // Use type assertion to help the type checker
        const offscreenCanvasCheck = typeof OffscreenCanvas !== 'undefined' && 
          (tempCanvas as any) instanceof OffscreenCanvas;
        
        if (offscreenCanvasCheck && 'close' in tempCanvas) {
          (tempCanvas as any).close();
        }
      }
      tempCanvas = null;
      tempCtx = null;
    }
  };
  
  // Explicitly trigger garbage collection if available (Node.js environment only)
  // In browsers, we can only hint to the GC by nullifying references
  if (typeof window === 'undefined' && typeof globalThis !== 'undefined' && 'gc' in globalThis) {
    (globalThis as any).gc();
  }

  // Start processing
  processNextChunk();
}

/**
 * Calculate optimal chunk size based on image size and device capabilities
 */
function calculateOptimalChunkSize(
  width: number, 
  height: number, 
  algorithm: DitheringAlgorithm, 
  capabilities: DeviceCapabilities,
  requestedSteps: number
): number {
  // Base chunk height on requested steps
  let chunkSize = Math.ceil(height / requestedSteps);
  
  // For error diffusion algorithms (which are more memory intensive),
  // use smaller chunks on lower-end devices
  if ((algorithm === 'floydSteinberg' || algorithm === 'atkinson') && !capabilities.isHighEnd) {
    chunkSize = Math.min(chunkSize, 100);
  }
  
  // For WebGL, ensure chunks aren't too large for texture limits
  if (width > capabilities.maxTextureSize || height > capabilities.maxTextureSize) {
    chunkSize = Math.min(chunkSize, Math.floor(capabilities.maxTextureSize * 0.8));
  }
  
  // For high-end devices with multiple cores, we can process larger chunks
  if (capabilities.isHighEnd && capabilities.cores >= 6) {
    chunkSize = Math.max(chunkSize, 200); // Larger chunks for better throughput
  }
  
  // For small images, just process in 2-4 chunks to reduce overhead
  if (height < 400) {
    chunkSize = Math.ceil(height / Math.min(4, requestedSteps));
  }
  
  return chunkSize;
}

// Preload WASM on module import to make it ready earlier
if (isWasmSupported()) {
  preloadWasmModule();
} 