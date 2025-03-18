// Atkinson dithering algorithm
export function atkinsonDithering(
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
        const error = (oldPixel - newPixel) / 8; // Distribute 1/8 of error to each neighbor
        
        // Distribute error to neighboring pixels using Atkinson pattern
        if (x + 1 < width) {
          buffer[idx + 1] += error;
        }
        
        if (x + 2 < width) {
          buffer[idx + 2] += error;
        }
        
        if (y + 1 < height) {
          if (x - 1 >= 0) {
            buffer[idx + width - 1] += error;
          }
          
          buffer[idx + width] += error;
          
          if (x + 1 < width) {
            buffer[idx + width + 1] += error;
          }
        }
        
        if (y + 2 < height) {
          buffer[idx + width * 2] += error;
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