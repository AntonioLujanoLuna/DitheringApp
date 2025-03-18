// Halftone dithering
export function halftoneDithering(
    grayscale: Uint8ClampedArray,
    width: number,
    height: number,
    dotSize: number = 3,
    spacing: number = 5,
    angle: number = 45
  ): ImageData {
    // Create output ImageData
    const outputData = new ImageData(width, height);
    const output = outputData.data;
    
    // Clear the output to white
    for (let i = 0; i < output.length; i += 4) {
      output[i] = 255;     // R
      output[i + 1] = 255; // G
      output[i + 2] = 255; // B
      output[i + 3] = 255; // A
    }
    
    // Convert angle to radians
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // Determine the cell size (dot + spacing)
    const cellSize = dotSize + spacing;
    
    // Calculate rotated grid coordinates
    for (let cy = 0; cy < height; cy += cellSize) {
      for (let cx = 0; cx < width; cx += cellSize) {
        // Center of the cell
        const centerX = cx + cellSize / 2;
        const centerY = cy + cellSize / 2;
        
        // Skip if center is outside the image
        if (centerX < 0 || centerX >= width || centerY < 0 || centerY >= height) {
          continue;
        }
        
        // Get the pixel value at the center
        const pixelIdx = Math.floor(centerY) * width + Math.floor(centerX);
        if (pixelIdx >= grayscale.length) continue;
        
        const pixelValue = grayscale[pixelIdx];
        
        // Calculate dot size based on pixel value (darker pixel = larger dot)
        const intensity = 1 - pixelValue / 255;
        const radius = (dotSize / 2) * intensity;
        
        // Draw the dot
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            // Rotate the point
            const rotX = dx * cos - dy * sin;
            const rotY = dx * sin + dy * cos;
            
            // Calculate the pixel coordinates
            const x = Math.floor(centerX + rotX);
            const y = Math.floor(centerY + rotY);
            
            // Check if within image bounds
            if (x >= 0 && x < width && y >= 0 && y < height) {
              // Check if within circle
              if (dx * dx + dy * dy <= radius * radius) {
                const idx = (y * width + x) * 4;
                output[idx] = 0;     // R
                output[idx + 1] = 0; // G
                output[idx + 2] = 0; // B
                // Alpha already set to 255
              }
            }
          }
        }
      }
    }
    
    return outputData;
  }