// Blue Noise dithering
export function blueNoiseDithering(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number = 128
): ImageData {
  // Create output ImageData
  const outputData = new ImageData(width, height);
  const output = outputData.data;
  
  // Generate a blue noise pattern
  const noisePattern = generateBlueNoisePattern(width, height);
  
  // Apply dithering using the blue noise pattern
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pixel = grayscale[idx];
      
      // Add weighted blue noise to the pixel value
      const noiseValue = noisePattern[y][x] * 255;
      const noisedPixel = pixel + (noiseValue - 128) / 2;
      
      // Apply threshold
      const newPixel = noisedPixel < threshold ? 0 : 255;
      
      // Set all RGB channels to the result (black or white)
      output[idx * 4] = newPixel;     // R
      output[idx * 4 + 1] = newPixel; // G
      output[idx * 4 + 2] = newPixel; // B
      output[idx * 4 + 3] = 255;      // A (fully opaque)
    }
  }
  
  return outputData;
}

// Generate a blue noise pattern using a simplified approach
// This is a basic implementation - more sophisticated methods exist
function generateBlueNoisePattern(width: number, height: number): number[][] {
  // For demo purposes, we'll use a precomputed blue noise tile 
  // In a production app, you'd want to generate this dynamically
  // or load a high-quality blue noise texture
  
  // Define a blue noise pattern size - powers of 2 work well
  const patternSize = 64;
  
  // Initialize the pattern with zeros
  const pattern = new Array(patternSize).fill(0).map(() => new Array(patternSize).fill(0));
  
  // Use Mitcell's best candidate algorithm to generate blue noise points
  const numPoints = Math.floor(patternSize * patternSize * 0.1); // 10% coverage
  const candidatesPerPoint = 10;
  
  // Place the first point randomly
  const points: [number, number][] = [];
  points.push([
    Math.floor(Math.random() * patternSize), 
    Math.floor(Math.random() * patternSize)
  ]);
  
  // Set the first point in the pattern
  pattern[points[0][1]][points[0][0]] = 1;
  
  // Add remaining points
  for (let i = 1; i < numPoints; i++) {
    let bestCandidate: [number, number] | null = null;
    let bestDistance = -Infinity;
    
    // Generate candidates
    for (let j = 0; j < candidatesPerPoint; j++) {
      const candidate: [number, number] = [
        Math.floor(Math.random() * patternSize),
        Math.floor(Math.random() * patternSize)
      ];
      
      // Check if this candidate is already used
      if (pattern[candidate[1]][candidate[0]] === 1) {
        continue;
      }
      
      // Find the minimum distance to any existing point
      let minDistance = Infinity;
      for (const point of points) {
        const dx = Math.min(
          Math.abs(candidate[0] - point[0]),
          patternSize - Math.abs(candidate[0] - point[0]) // Account for wrap-around
        );
        const dy = Math.min(
          Math.abs(candidate[1] - point[1]),
          patternSize - Math.abs(candidate[1] - point[1]) // Account for wrap-around
        );
        const distance = dx * dx + dy * dy;
        minDistance = Math.min(minDistance, distance);
      }
      
      // Update best candidate if this one is better
      if (minDistance > bestDistance) {
        bestDistance = minDistance;
        bestCandidate = candidate;
      }
    }
    
    // Add the best candidate to our points
    if (bestCandidate) {
      points.push(bestCandidate);
      pattern[bestCandidate[1]][bestCandidate[0]] = 1;
    }
  }
  
  // Create a distance field from the points
  const distanceField = new Array(patternSize).fill(0).map(() => 
    new Array(patternSize).fill(0).map(() => Infinity)
  );
  
  // For each pixel, calculate the distance to the nearest point
  for (let y = 0; y < patternSize; y++) {
    for (let x = 0; x < patternSize; x++) {
      if (pattern[y][x] === 1) {
        distanceField[y][x] = 0;
        continue;
      }
      
      let minDistance = Infinity;
      for (const [px, py] of points) {
        const dx = Math.min(
          Math.abs(x - px),
          patternSize - Math.abs(x - px)
        );
        const dy = Math.min(
          Math.abs(y - py),
          patternSize - Math.abs(y - py)
        );
        const distance = Math.sqrt(dx * dx + dy * dy);
        minDistance = Math.min(minDistance, distance);
      }
      
      distanceField[y][x] = minDistance;
    }
  }
  
  // Normalize the distance field to 0-1
  const maxDistance = Math.max(...distanceField.map(row => Math.max(...row)));
  const normalizedField = distanceField.map(row => 
    row.map(val => val / maxDistance)
  );
  
  // Tile the pattern to match the requested dimensions
  const result = new Array(height).fill(0).map(() => new Array(width).fill(0));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      result[y][x] = normalizedField[y % patternSize][x % patternSize];
    }
  }
  
  return result;
} 