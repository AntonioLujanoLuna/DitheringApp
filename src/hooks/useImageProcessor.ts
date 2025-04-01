import { useEffect, useState, useRef, RefObject } from 'react';
import { useEditingSessionStore, Region, DitheringAlgorithm } from '../store/useEditingSessionStore';
import { processImageProgressively, ProgressiveOptions } from '../lib/processing/progressive';
import { selectiveDithering, createCircularMask, createRectangularMask, createPolygonMask, MaskRegion } from '../lib/algorithms/selectiveDithering';

interface UseImageProcessorProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  originalImage: HTMLImageElement | null;
  algorithm: DitheringAlgorithm;
  dotSize: number;
  contrast: number;
  colorMode: string; // Assuming ColorMode is string-based
  spacing: number;
  angle: number;
  customColors: string[];
  patternType: string; // Assuming PatternType is string-based
  patternSize: number;
  regions: Region[];
  // Add other settings needed for progressive/selective processing
}

interface UseImageProcessorReturn {
  isProcessing: boolean;
  progressPercent: number;
  showProgress: boolean;
}

export function useImageProcessor({
  canvasRef,
  originalImage,
  algorithm,
  dotSize,
  contrast,
  colorMode,
  spacing,
  angle,
  customColors,
  patternType,
  patternSize,
  regions,
  // Destructure other settings here
}: UseImageProcessorProps): UseImageProcessorReturn {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const { setIsProcessing: setStoreProcessingState } = useEditingSessionStore(); // To update global state if needed

  // Variable to hold the timeout ID for debouncing/cancellation
  const processingTimeoutId = useRef<number | null>(null);

  // Function to process the image with selective dithering (moved from ImagePreview)
  const processWithSelectiveDithering = async (
    sourceImageData: ImageData,
    canvas: HTMLCanvasElement
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get grayscale image data
    const grayscaleArray = new Uint8ClampedArray(canvas.width * canvas.height);
    for (let i = 0; i < sourceImageData.data.length; i += 4) {
      const r = sourceImageData.data[i];
      const g = sourceImageData.data[i + 1];
      const b = sourceImageData.data[i + 2];
      grayscaleArray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }
    
    // Create mask regions
    const maskRegions: MaskRegion[] = regions.map((region: Region) => {
      let mask: Uint8ClampedArray;
      if (region.type === 'circle' && region.centerX !== undefined && region.centerY !== undefined && region.radius !== undefined) {
        mask = createCircularMask(canvas.width, canvas.height, region.centerX, region.centerY, region.radius, region.feather);
      } else if (region.type === 'rectangle' && region.x1 !== undefined && region.y1 !== undefined && region.x2 !== undefined && region.y2 !== undefined) {
        mask = createRectangularMask(canvas.width, canvas.height, region.x1, region.y1, region.x2, region.y2, region.feather);
      } else if (region.type === 'polygon' && region.vertices) {
        mask = createPolygonMask(canvas.width, canvas.height, region.vertices, region.feather);
      } else {
        mask = new Uint8ClampedArray(canvas.width * canvas.height);
      }
      return {
        mask,
        algorithm: region.algorithm,
        dotSize: region.dotSize,
        spacing: region.spacing,
        angle: region.angle,
        threshold: region.threshold
      };
    });
    
    // Apply selective dithering
    const processedImageData = selectiveDithering(
      grayscaleArray,
      canvas.width,
      canvas.height,
      maskRegions,
      algorithm === 'selective' ? 'ordered' : algorithm, // Default algorithm if no regions are selected
      128, // Default threshold
      dotSize,
      spacing,
      angle
    );
    
    // Update the canvas
    ctx.putImageData(processedImageData, 0, 0);
  };

  // Process the image when parameters change (moved useEffect from ImagePreview)
  useEffect(() => {
    if (!originalImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) { 
      console.error("Failed to get canvas context for processing");
      return; 
    }
    
    const processCurrentImage = async () => {
      setIsProcessing(true);
      setStoreProcessingState(true); // Update global state
      setShowProgress(true);
      setProgressPercent(0);
      
      if (canvas.width !== originalImage.width || canvas.height !== originalImage.height) {
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
      }

      ctx.drawImage(originalImage, 0, 0);
      const sourceImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (algorithm === 'selective' && regions.length > 0) {
        console.log("Processing with selective dithering (non-progressive)...");
        try {
          await processWithSelectiveDithering(sourceImageData, canvas);
        } catch (error) {
           console.error('Error during selective dithering:', error);
        } finally {
          setIsProcessing(false);
          setStoreProcessingState(false);
          setShowProgress(false);
        }
      } else {
        console.log(`Processing with ${algorithm} (progressive)...`);

        const progressiveOpts: ProgressiveOptions = {
          sourceImageData: sourceImageData,
          algorithm: algorithm,
          dotSize: dotSize,
          contrast: contrast,
          colorMode: colorMode as any, // Cast needed if ColorMode type is stricter
          spacing: spacing,
          angle: angle,
          customColors: customColors,
          patternType: patternType as any, // Cast needed if PatternType is stricter
          patternSize: patternSize,
          // Pass other relevant settings from props
          
          onProgress: (progress, partialResult) => {
            setProgressPercent(progress);
            if (partialResult && ctx) {
              ctx.putImageData(partialResult, 0, 0);
            }
          },
          onComplete: (result) => {
            if (ctx) {
               ctx.putImageData(result, 0, 0);
            }
            setIsProcessing(false);
            setStoreProcessingState(false);
            setShowProgress(false);
            console.log("Progressive processing complete.");
          },
          onError: (error) => {
            console.error('Error during progressive processing:', error);
            setIsProcessing(false);
            setStoreProcessingState(false);
            setShowProgress(false);
          }
        };

        if (processingTimeoutId.current !== null) {
           clearTimeout(processingTimeoutId.current);
        }

        processingTimeoutId.current = window.setTimeout(() => { // Use window.setTimeout for clarity
          try {
            processImageProgressively(progressiveOpts);
          } catch (syncError) {
            console.error('Error initiating progressive processing:', syncError);
            setIsProcessing(false);
            setStoreProcessingState(false);
            setShowProgress(false);
          }
        }, 100); // Debounce time
      }
    };

    processCurrentImage();

    return () => {
      if (processingTimeoutId.current !== null) {
        clearTimeout(processingTimeoutId.current);
      }
    };

  }, [
    // Include all dependencies from the original useEffect
    originalImage, canvasRef,
    algorithm, dotSize, contrast, colorMode, spacing, angle, customColors, patternType, patternSize,
    regions, 
    setStoreProcessingState // Include the store setter function
    // Add other settings passed as props
  ]);

  return { isProcessing, progressPercent, showProgress };
} 