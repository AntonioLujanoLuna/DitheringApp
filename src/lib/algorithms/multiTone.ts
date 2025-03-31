// Multi-tone dithering - expand beyond binary dithering to support multiple threshold levels
export function multiToneDithering(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  levels: number = 4,
  algorithm: MultiToneAlgorithm = 'ordered',
  dotSize: number = 4
): ImageData {
  // Create output ImageData
  const outputData = new ImageData(width, height);
  const output = outputData.data;
  
  // Generate the tone levels
  const toneValues = generateToneValues(levels);
  
  // Get thresholds for the tone levels
  const thresholds = generateThresholds(levels);
  
  // Create a copy of the grayscale image for error diffusion algorithms
  const buffer = new Float32Array(grayscale);
  
  if (algorithm === 'ordered') {
    // Get the dither matrix
    const ditherMatrix = generateBayerMatrix(dotSize);
    const matrixSize = ditherMatrix.length;
    
    // Apply ordered dithering with multiple levels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const pixel = grayscale[idx];
        
        // Get the threshold adjustment from the dither matrix
        const thresholdAdjustment = ditherMatrix[y % matrixSize][x % matrixSize] * (255 / (levels + 1));
        
        // Find the appropriate tone level
        let toneIdx = 0;
        for (let i = 0; i < thresholds.length; i++) {
          if (pixel > thresholds[i] - thresholdAdjustment) {
            toneIdx = i + 1;
          }
        }
        
        // Set output value
        const newPixel = toneValues[toneIdx];
        
        // Set all RGB channels to the result
        output[idx * 4] = newPixel;     // R
        output[idx * 4 + 1] = newPixel; // G
        output[idx * 4 + 2] = newPixel; // B
        output[idx * 4 + 3] = 255;      // A (fully opaque)
      }
    }
  } else if (algorithm === 'errorDiffusion') {
    // Apply error diffusion with multiple levels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const pixel = buffer[idx];
        
        // Find the closest tone level
        let closestTone = toneValues[0];
        let minDistance = Math.abs(pixel - toneValues[0]);
        
        for (let i = 1; i < toneValues.length; i++) {
          const distance = Math.abs(pixel - toneValues[i]);
          if (distance < minDistance) {
            minDistance = distance;
            closestTone = toneValues[i];
          }
        }
        
        // Calculate error
        const error = pixel - closestTone;
        
        // Distribute error using Floyd-Steinberg pattern
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
        
        // Set output value
        output[idx * 4] = closestTone;     // R
        output[idx * 4 + 1] = closestTone; // G
        output[idx * 4 + 2] = closestTone; // B
        output[idx * 4 + 3] = 255;         // A (fully opaque)
      }
    }
  } else if (algorithm === 'blueNoise') {
    // Generate blue noise pattern
    const blueNoiseMatrix = generateBlueNoiseMatrix(width, height);
    
    // Apply blue noise dithering with multiple levels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const pixel = grayscale[idx];
        
        // Get the threshold adjustment from the blue noise
        const thresholdAdjustment = blueNoiseMatrix[y][x] * (255 / (levels + 1));
        
        // Find the appropriate tone level
        let toneIdx = 0;
        for (let i = 0; i < thresholds.length; i++) {
          if (pixel > thresholds[i] - thresholdAdjustment) {
            toneIdx = i + 1;
          }
        }
        
        // Set output value
        const newPixel = toneValues[toneIdx];
        
        // Set all RGB channels to the result
        output[idx * 4] = newPixel;     // R
        output[idx * 4 + 1] = newPixel; // G
        output[idx * 4 + 2] = newPixel; // B
        output[idx * 4 + 3] = 255;      // A (fully opaque)
      }
    }
  }
  
  return outputData;
}

// Available multi-tone dithering algorithms
export type MultiToneAlgorithm = 'ordered' | 'errorDiffusion' | 'blueNoise';

// Generate tone values for the specified number of levels
function generateToneValues(levels: number): number[] {
  const values: number[] = [];
  
  // Generate evenly spaced tone values
  for (let i = 0; i <= levels; i++) {
    values.push(Math.round((i / levels) * 255));
  }
  
  return values;
}

// Generate thresholds for multi-tone dithering
function generateThresholds(levels: number): number[] {
  const thresholds: number[] = [];
  
  // Generate thresholds between tone values
  for (let i = 1; i <= levels; i++) {
    thresholds.push(Math.round((i / (levels + 1)) * 255));
  }
  
  return thresholds;
}

// Generate a Bayer dither matrix of the specified size
function generateBayerMatrix(n: number): number[][] {
  if (n === 2) {
    return [
      [0, 2],
      [3, 1]
    ];
  }
  
  // Generate recursively for larger sizes (must be power of 2)
  const size = Math.pow(2, Math.ceil(Math.log2(n)));
  const matrix = Array(size).fill(0).map(() => Array(size).fill(0));
  
  if (size === 2) {
    matrix[0][0] = 0;
    matrix[0][1] = 2;
    matrix[1][0] = 3;
    matrix[1][1] = 1;
  } else {
    // Get the matrix for half the size
    const subMatrix = generateBayerMatrix(size / 2);
    const subSize = subMatrix.length;
    
    // Fill the four quadrants with modified versions of the sub-matrix
    for (let y = 0; y < subSize; y++) {
      for (let x = 0; x < subSize; x++) {
        matrix[y][x] = subMatrix[y][x] * 4;
        matrix[y][x + subSize] = subMatrix[y][x] * 4 + 2;
        matrix[y + subSize][x] = subMatrix[y][x] * 4 + 3;
        matrix[y + subSize][x + subSize] = subMatrix[y][x] * 4 + 1;
      }
    }
  }
  
  // Normalize values to 0-1 range
  const maxValue = size * size - 1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      matrix[y][x] = matrix[y][x] / maxValue;
    }
  }
  
  return matrix;
}

// Generate a simple blue noise matrix
// In a real implementation, this would be more sophisticated or pre-computed
function generateBlueNoiseMatrix(width: number, height: number): number[][] {
  // For simplicity, we'll use a pre-computed blue noise pattern with tiling
  const patternSize = 64;
  const blueNoise = Array(height).fill(0).map(() => Array(width).fill(0));
  
  // Initialize with random values
  for (let y = 0; y < patternSize; y++) {
    for (let x = 0; x < patternSize; x++) {
      blueNoise[y][x] = Math.random();
    }
  }
  
  // Apply simple relaxation to improve blue noise characteristics
  // This is a highly simplified approach - real blue noise generation is more complex
  for (let iterations = 0; iterations < 5; iterations++) {
    for (let y = 0; y < patternSize; y++) {
      for (let x = 0; x < patternSize; x++) {
        let sum = 0;
        let count = 0;
        
        // Average surrounding pixels
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const ny = (y + dy + patternSize) % patternSize;
            const nx = (x + dx + patternSize) % patternSize;
            
            sum += blueNoise[ny][nx];
            count++;
          }
        }
        
        // Adjust pixel towards opposite of local average
        const avg = sum / count;
        blueNoise[y][x] = (blueNoise[y][x] + (0.5 - avg) * 0.2) % 1.0;
      }
    }
  }
  
  // Tile the pattern if needed
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y < patternSize && x < patternSize) continue; // Already filled
      
      blueNoise[y][x] = blueNoise[y % patternSize][x % patternSize];
    }
  }
  
  return blueNoise;
} 