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
        // As per standard: 1/8 of error to each of the 6 neighbors:
        // (x+1,y), (x+2,y), (x-1,y+1), (x,y+1), (x+1,y+1), (x,y+2)

        // Pixel (x+1, y)
        if (x + 1 < width) {
          buffer[idx + 1] += error;
        }
        
        // Pixel (x+2, y)
        if (x + 2 < width) {
          buffer[idx + 2] += error;
        }
        
        // Pixel (x-1, y+1)
        if (y + 1 < height && x - 1 >= 0) {
          buffer[idx + width - 1] += error;
        }
        
        // Pixel (x, y+1)
        if (y + 1 < height) { // x is implicitly valid within loop bounds
          buffer[idx + width] += error;
        }
        
        // Pixel (x+1, y+1)
        if (y + 1 < height && x + 1 < width) {
          buffer[idx + width + 1] += error;
        }
        
        // Pixel (x, y+2)
        if (y + 2 < height) { // x is implicitly valid within loop bounds
          buffer[idx + 2 * width] += error; 
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