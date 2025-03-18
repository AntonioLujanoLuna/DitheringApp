// Floyd-Steinberg error diffusion dithering
export function floydSteinbergDithering(
    grayscale: Uint8ClampedArray,
    width: number,
    height: number,
    threshold: number = 128
  ): ImageData {
    // Create output ImageData
    const outputData = new ImageData(width, height);
    const output = outputData.data;
    
    // Create a copy of the grayscale image to apply error diffusion
    const buffer = new Float32Array(grayscale);
    
    // Apply dithering
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const oldPixel = buffer[idx];
        
        // Apply threshold
        const newPixel = oldPixel < threshold ? 0 : 255;
        
        // Calculate error
        const error = oldPixel - newPixel;
        
        // Distribute error to neighboring pixels using Floyd-Steinberg pattern
        if (x + 1 < width) {
          buffer[idx + 1] += error * (7 / 16);
        }
        
        if (y + 1 < height) {
          if (x - 1 >= 0) {
            buffer[idx + width - 1] += error * (3 / 16);
          }
          
          buffer[idx + width] += error * (5 / 16);
          
          if (x + 1 < width) {
            buffer[idx + width + 1] += error * (1 / 16);
          }
        }
        
        // Set all RGB channels to the result (black or white)
        output[idx * 4] = newPixel;     // R
        output[idx * 4 + 1] = newPixel; // G
        output[idx * 4 + 2] = newPixel; // B
        output[idx * 4 + 3] = 255;      // A (fully opaque)
      }
    }
    
    return outputData;
  }