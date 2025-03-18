// src/lib/workers/ditheringWorker.ts
// This file will be loaded as a web worker to process images in a background thread


  import { processImage } from '../../lib/algorithms';
  import { DitheringAlgorithm, ColorMode } from '../../store/useEditorStore';
  
  // Define the message type for TypeScript
  interface WorkerMessage {
    imageData: ImageData;
    algorithm: DitheringAlgorithm;
    dotSize: number;
    contrast: number;
    colorMode: ColorMode;
    spacing: number;
    angle: number;
    customColors: string[];
  }
  
  // Listen for messages from the main thread
  self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
    try {
      const {
        imageData,
        algorithm,
        dotSize,
        contrast,
        colorMode,
        spacing,
        angle,
        customColors
      } = event.data;
      
      // Create an HTMLImageElement from the image data
      // (Web Workers don't have direct access to DOM APIs, so we need to handle this differently)
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
        // The actual image data will be retrieved from the canvas in processImage
      };
      
      // Process the image
      const processedData = processImage(
        fakeImg as unknown as HTMLImageElement,
        algorithm,
        dotSize,
        contrast,
        colorMode,
        spacing,
        angle,
        customColors
      );
      
      // Send the processed data back to the main thread
      self.postMessage({
        success: true,
        processedData
      });
    } catch (error) {
      // Send any errors back to the main thread
      self.postMessage({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });