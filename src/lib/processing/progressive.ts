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
  loadWasmModule // Make sure WASM is loaded if used
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
  forceJS?: boolean; // Option to force JS for testing/fallback
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
  forceJS: false,
};

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
    forceJS,
    colorMode,
    // other options passed down
    ...processingOpts 
  } = opts;

  const width = sourceImageData.width;
  const totalHeight = sourceImageData.height;

  // Check OffscreenCanvas support
  const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

  // Create a canvas to composite the results
  const resultCanvas = hasOffscreenCanvas 
    ? new OffscreenCanvas(width, totalHeight) 
    : document.createElement('canvas');
  resultCanvas.width = width;
  resultCanvas.height = totalHeight;
  const resultCtx = resultCanvas.getContext('2d', { 
      willReadFrequently: true, 
      // alpha: false // Consider if transparency isn't needed
  }) as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D; // Type assertion

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
  if (canUseWebGL) engine = 'webgl';
  if (canUseWasm) engine = 'wasm'; // Prioritize WASM if available for BW

  console.info(`Progressive processing using: ${engine.toUpperCase()}`);

  // Calculate chunk size, ensuring it meets the minimum
  let chunkSize = Math.ceil(totalHeight / progressSteps);
  chunkSize = Math.max(minChunkSize, chunkSize);
  const actualSteps = Math.ceil(totalHeight / chunkSize);

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

  // Function to process the next chunk
  const processNextChunk = async () => {
    // Declare variables used across different engine paths and in finally block
    let chunkResultData: ImageData | null = null;
    let tempCanvas: HTMLCanvasElement | null = null;
    let tempCtx: CanvasRenderingContext2D | null = null;
    let fakeChunkImg: any = null; // Adjust type as needed
    let grayscaleChunk: Uint8ClampedArray | null = null;
    let ditheredGrayscale: Uint8ClampedArray | null = null;
    let ditheredChunkData: Uint8ClampedArray | null = null;
    // chunkSourceData is declared as const later, cannot nullify it without changing to let

    // Ensure WASM is loaded if we intend to use it
    if (engine === 'wasm' && wasmLoadCheckPromise) {
      try {
        await wasmLoadCheckPromise; // Wait for the initial load attempt
      } catch (err) {
         // Already warned, engine should be JS now.
      }
    }
    
    // Calculate the height of this chunk
    const currentChunkHeight = Math.min(chunkSize, totalHeight - processedHeight);

    if (currentChunkHeight <= 0) {
      // Should have finished, but double-check
      const finalResult = resultCtx.getImageData(0, 0, width, totalHeight);
      onProgress(100, finalResult);
      onComplete(finalResult);
      return;
    }

    const startY = processedHeight;

    try {
      // Extract the source chunk 
      // NOTE: Creating ImageData per chunk might be inefficient for very small chunks.
      // Consider optimizing later if needed (e.g., operate directly on source buffer).
      const chunkSourceData = new ImageData(
        sourceImageData.data.slice(startY * width * 4, (startY + currentChunkHeight) * width * 4),
        width,
        currentChunkHeight
      );
      
      // --- Processing Logic per Engine ---
      
      if (engine === 'wasm') {
        // --- WASM Processing ---
        try {
          // Convert chunk to grayscale Uint8ClampedArray for WASM functions
          grayscaleChunk = new Uint8ClampedArray(width * currentChunkHeight);
          for (let j = 0; j < chunkSourceData.data.length; j += 4) {
            grayscaleChunk[j/4] = Math.round(
              0.299 * chunkSourceData.data[j] + 
              0.587 * chunkSourceData.data[j+1] + 
              0.114 * chunkSourceData.data[j+2]
            );
          }
          // TODO: Apply contrast adjustment to grayscaleChunk if needed, matching gifProcessor
          
          // Call the specific WASM function based on algorithm
          switch (algorithm) {
             case 'ordered':
               ditheredGrayscale = await orderedDitheringWasm(grayscaleChunk, width, currentChunkHeight, opts.dotSize);
               break;
             case 'floydSteinberg':
               ditheredGrayscale = await floydSteinbergDitheringWasm(grayscaleChunk, width, currentChunkHeight); // Add threshold option if needed
               break;
             case 'atkinson':
               ditheredGrayscale = await atkinsonDitheringWasm(grayscaleChunk, width, currentChunkHeight); // Add threshold option if needed
               break;
             case 'halftone':
                ditheredGrayscale = await halftoneDitheringWasm(grayscaleChunk, width, currentChunkHeight, opts.dotSize, opts.spacing, opts.angle);
                break;
             default:
               throw new Error(`Unsupported WASM algorithm: ${algorithm}`);
          }

          // Convert dithered grayscale back to ImageData
          ditheredChunkData = new Uint8ClampedArray(width * currentChunkHeight * 4);
          for (let j = 0; j < ditheredGrayscale.length; j++) {
            const pixelValue = ditheredGrayscale[j];
            ditheredChunkData[j * 4] = pixelValue;     // R
            ditheredChunkData[j * 4 + 1] = pixelValue; // G
            ditheredChunkData[j * 4 + 2] = pixelValue; // B
            ditheredChunkData[j * 4 + 3] = 255;        // A
          }
          chunkResultData = new ImageData(ditheredChunkData, width, currentChunkHeight);

        } catch (wasmError) {
          console.warn(`WASM processing failed for chunk at y=${startY}, falling back to JS`, wasmError);
          engine = 'js'; // Fallback for remaining chunks too
          // Rerun processing logic for this chunk using JS below
        }
      } 
      
      if (engine === 'webgl' && !chunkResultData) {
         // --- WebGL Processing ---
         // Note: Assumes processImageWithWebGL handles ImageData input
          try {
             chunkResultData = processImageWithWebGL(
               chunkSourceData,
               algorithm === 'pattern' ? 'pattern' : 
               algorithm === 'ordered' ? 'ordered' : 'halftone',
               { // Pass relevant options from processingOpts
                 patternSize: opts.patternSize,
                 dotSize: opts.dotSize,
                 spacing: opts.spacing,
                 angle: opts.angle,
                 patternTexture: algorithm === 'pattern' ? 
                   patternMatrixToImageData(getPatternMatrix(opts.patternType, opts.patternSize)) : undefined
               }
             );
          } catch (webglError) {
             console.warn(`WebGL processing failed for chunk at y=${startY}, falling back to JS`, webglError);
             engine = 'js'; // Fallback for remaining chunks
          }
      }
      
      if (engine === 'js' && !chunkResultData) {
         // --- JavaScript Processing ---
         // Create a temporary canvas for the JS processImage function, which expects an HTMLImageElement
         // This is inefficient but avoids modifying the core processImage structure for now.
         tempCanvas = document.createElement('canvas');
         tempCanvas.width = width;
         tempCanvas.height = currentChunkHeight;
         tempCtx = tempCanvas.getContext('2d');

         // Add null checks for safety
         if (!tempCanvas || !tempCtx) {
            throw new Error('Could not create temporary canvas context for JS processing');
         }

         tempCtx.putImageData(chunkSourceData, 0, 0);

         // processImage expects an 'image-like' object, not ImageData directly
         fakeChunkImg = {
           width: width,
           height: currentChunkHeight,
           // processImage uses drawImage, so the data needs to be on the canvas
           _canvas: tempCanvas // Pass canvas for potential internal use if needed
         };

         // Call the main JS dispatcher
         chunkResultData = processImage(
           fakeChunkImg as unknown as HTMLImageElement, // Cast needed due to function signature
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


      // --- Compositing ---
      if (chunkResultData) {
         // Draw the processed chunk onto the main result canvas
         // Use createImageBitmap for potentially better performance if supported
         // const bitmap = await createImageBitmap(chunkResultData);
         resultCtx.putImageData(chunkResultData, 0, startY);
      } else {
         // If chunk processing failed entirely (e.g., JS also threw an error)
         throw new Error(`Chunk processing failed for algorithm ${algorithm} at y=${startY}`);
      }
      
      // Update progress
      processedHeight += currentChunkHeight;
      currentStep++;
      // Send progress slightly less than 100 until the very end
      const progress = Math.min(99, Math.round((processedHeight / totalHeight) * 100));

      // Get the current composite state for the progress update
      // Reading back frequently can be slow, consider only sending progress %
      // or sending partial updates less often if performance is an issue.
      const currentResult = resultCtx.getImageData(0, 0, width, totalHeight); 
      onProgress(progress, currentResult);

      // --- Loop continuation ---
      if (processedHeight >= totalHeight) {
        // All done
        onProgress(100, currentResult); // Send final 100%
        onComplete(currentResult);
      } else {
        // Schedule the next chunk using setTimeout to yield to the main thread
        setTimeout(processNextChunk, 0); 
      }

    } catch (error) {
       // Catch errors during chunk extraction, processing call, or compositing
       onError(error instanceof Error ? error : new Error(String(error)));
       // Stop processing further chunks on error
    } finally {
        // Explicitly nullify large objects to potentially help GC
        // Type safety note: Need to ensure these variables are declared with types allowing null
        // For simplicity, assuming they are correctly typed or using 'any' implicitly here.
        // Consider stricter typing if needed.

        // Cannot assign to 'chunkSourceData' because it is a constant.
        // chunkSourceData = null; // Declared as const, cannot reassign
        chunkResultData = null;

        // Need to check if tempCanvas etc were actually created (only in JS path)
        if (typeof tempCanvas !== 'undefined' && tempCanvas !== null) {
          // Assuming tempCanvas, tempCtx, fakeChunkImg were declared with 'let' in the JS block's scope
          // tempCanvas = null; // Cannot find name 'tempCanvas'.
          // tempCtx = null; // Cannot find name 'tempCtx'.
          // fakeChunkImg = null; // Cannot find name 'fakeChunkImg'.
          // These need to be declared outside the 'if (engine === 'js')' block to be accessed here.
          // For now, skipping these assignments as they would require scope changes.
        }
        
        // Similar issue for grayscaleChunk if declared inside 'if (engine === 'wasm')'
        // grayscaleChunk = null; 
        // ditheredGrayscale = null;
        // ditheredChunkData = null;

        // Nullify variables declared at the top of the function scope
        tempCanvas = null; 
        tempCtx = null;
        fakeChunkImg = null;
        grayscaleChunk = null;
        ditheredGrayscale = null;
        ditheredChunkData = null;
    }
  };

  // Start the first chunk processing
  onProgress(0); // Initial progress = 0
  setTimeout(processNextChunk, 0); // Start async loop
} 