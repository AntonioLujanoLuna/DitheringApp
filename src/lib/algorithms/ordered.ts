// Ordered dithering using Bayer matrices
export function orderedDithering(
    grayscale: Uint8ClampedArray,
    width: number,
    height: number,
    dotSize: number = 1,
    threshold: number = 128
  ): ImageData {
    // 4x4 Bayer matrix
    const bayerMatrix = [
      [ 0, 8, 2, 10],
      [12, 4, 14, 6],
      [ 3, 11, 1, 9],
      [15, 7, 13, 5]
    ];
    
    // Scale the Bayer matrix values to the threshold range
    const bayerScaled = bayerMatrix.map(row => 
      row.map(val => Math.floor((val / 16) * 256 - 128))
    );
    
    // Create output ImageData
    const outputData = new ImageData(width, height);
    const output = outputData.data;
    
    // Apply dithering
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const pixelValue = grayscale[idx];
        
        // Get the Bayer threshold adjustment for this position
        const bayerX = Math.floor(x / dotSize) % 4;
        const bayerY = Math.floor(y / dotSize) % 4;
        const bayerValue = bayerScaled[bayerY][bayerX];
        
        // Apply threshold with Bayer adjustment
        const result = pixelValue + bayerValue > threshold ? 255 : 0;
        
        // Set all RGB channels to the result (black or white)
        output[idx * 4] = result;     // R
        output[idx * 4 + 1] = result; // G
        output[idx * 4 + 2] = result; // B
        output[idx * 4 + 3] = 255;    // A (fully opaque)
      }
    }
    
    return outputData;
  }