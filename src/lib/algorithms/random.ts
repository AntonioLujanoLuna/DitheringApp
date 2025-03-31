// Random dithering
export function randomDithering(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number = 128,
  noiseAmount: number = 50
): ImageData {
  // Create output ImageData
  const outputData = new ImageData(width, height);
  const output = outputData.data;
  
  // Apply dithering
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pixel = grayscale[idx];
      
      // Generate random noise between -noiseAmount/2 and +noiseAmount/2
      const noise = (Math.random() - 0.5) * noiseAmount;
      
      // Add noise to the pixel value
      const noisyPixel = pixel + noise;
      
      // Apply threshold
      const newPixel = noisyPixel < threshold ? 0 : 255;
      
      // Set all RGB channels to the result (black or white)
      output[idx * 4] = newPixel;     // R
      output[idx * 4 + 1] = newPixel; // G
      output[idx * 4 + 2] = newPixel; // B
      output[idx * 4 + 3] = 255;      // A (fully opaque)
    }
  }
  
  return outputData;
} 