import { describe, it, expect, beforeEach } from 'vitest';
import {
  rgbToGrayscale,
  orderedDithering,
  floydSteinbergDithering,
  atkinsonDithering,
  halftoneDithering,
  processImage
} from './index';

describe('Dithering Algorithms', () => {
  let mockImageData: ImageData;
  let mockGrayscale: Uint8ClampedArray;

  beforeEach(() => {
    // Create a simple 3x3 image with a gradient
    const pixelData = new Uint8ClampedArray([
      // Row 1
      0, 0, 0, 255,     // Black
      100, 100, 100, 255, // Dark gray
      200, 200, 200, 255, // Light gray
      // Row 2
      50, 50, 50, 255,   // Darker gray
      150, 150, 150, 255, // Medium gray
      250, 250, 250, 255, // Almost white
      // Row 3
      25, 25, 25, 255,    // Very dark gray
      125, 125, 125, 255, // Medium-dark gray
      255, 255, 255, 255  // White
    ]);
    
    mockImageData = new ImageData(pixelData, 3, 3);
    mockGrayscale = new Uint8ClampedArray([
      0, 100, 200,
      50, 150, 250,
      25, 125, 255
    ]);
  });

  describe('rgbToGrayscale', () => {
    it('should convert RGB image data to grayscale', () => {
      const result = rgbToGrayscale(mockImageData);
      
      // Verify some sample conversions using the luminance formula
      expect(result[0]).toEqual(0); // Black
      expect(result[4]).toEqual(150); // Medium gray
      expect(result[8]).toEqual(255); // White
    });
  });

  describe('orderedDithering', () => {
    it('should apply ordered dithering to grayscale data', () => {
      const result = orderedDithering(mockGrayscale, 3, 3);
      
      // Check that we got valid ImageData back
      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toEqual(3);
      expect(result.height).toEqual(3);
      
      // With ordered dithering, pixels above threshold should be white (255)
      // and pixels below threshold should be black (0)
      const threshold = 128;
      
      // Check some known values (simplified check)
      // Very dark pixels should be black
      expect(result.data[0]).toEqual(0); // First pixel (black)
      
      // Very light pixels should be white
      expect(result.data[4 * 8]).toEqual(255); // Last pixel (white)
    });
  });

  describe('floydSteinbergDithering', () => {
    it('should apply Floyd-Steinberg dithering to grayscale data', () => {
      const result = floydSteinbergDithering(mockGrayscale, 3, 3);
      
      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toEqual(3);
      expect(result.height).toEqual(3);
      
      // Basic check for diffusion - error patterns are complex,
      // so we'll just check if the result is binary (0 or 255)
      for (let i = 0; i < result.data.length; i += 4) {
        expect(result.data[i]).to.satisfy((val: number) => val === 0 || val === 255);
      }
    });
  });

  describe('atkinsonDithering', () => {
    it('should apply Atkinson dithering to grayscale data', () => {
      const result = atkinsonDithering(mockGrayscale, 3, 3);
      
      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toEqual(3);
      expect(result.height).toEqual(3);
      
      // Similar to Floyd-Steinberg, just verify binary result
      for (let i = 0; i < result.data.length; i += 4) {
        expect(result.data[i]).to.satisfy((val: number) => val === 0 || val === 255);
      }
    });
  });

  describe('halftoneDithering', () => {
    it('should apply Halftone dithering to grayscale data', () => {
      const result = halftoneDithering(mockGrayscale, 3, 3, 1, 0, 0);
      
      expect(result).toBeInstanceOf(ImageData);
      expect(result.width).toEqual(3);
      expect(result.height).toEqual(3);
      
      // Halftone creates dots, basic check if we have valid data
      const hasPixels = result.data.some(val => val !== 0);
      expect(hasPixels).toBeTruthy();
    });
  });

  describe('processImage', () => {
    it('should process an image with the specified algorithm and settings', () => {
      // Create a mock image
      const mockImage = new Image();
      mockImage.width = 100;
      mockImage.height = 100;
      mockImage.src = 'data:image/png;base64,mockbase64data';
      
      // Test all algorithms
      const algorithms = ['ordered', 'floydSteinberg', 'atkinson', 'halftone'] as const;
      const colorModes = ['bw', 'cmyk', 'rgb', 'custom'] as const;
      
      algorithms.forEach(algorithm => {
        colorModes.forEach(colorMode => {
          const result = processImage(
            mockImage,
            algorithm,
            3, // dotSize
            50, // contrast
            colorMode,
            5, // spacing
            45, // angle
            ['#000000', '#ffffff'] // customColors
          );
          
          expect(result).toBeInstanceOf(ImageData);
          expect(result.width).toEqual(mockImage.width);
          expect(result.height).toEqual(mockImage.height);
        });
      });
    });
  });
});