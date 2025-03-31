// Void and Cluster dithering
export function voidAndClusterDithering(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number = 128
): ImageData {
  // Create output ImageData
  const outputData = new ImageData(width, height);
  const output = outputData.data;
  
  // Generate the dither array
  const ditherMatrix = generateVoidAndClusterMatrix(width, height);
  
  // Apply dithering using the dither matrix
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pixel = grayscale[idx];
      
      // Get normalized threshold from the dither matrix (0-255 range)
      const matrixThreshold = ditherMatrix[y % ditherMatrix.length][x % ditherMatrix[0].length] * 255;
      
      // Apply threshold
      const newPixel = pixel < matrixThreshold ? 0 : 255;
      
      // Set all RGB channels to the result (black or white)
      output[idx * 4] = newPixel;     // R
      output[idx * 4 + 1] = newPixel; // G
      output[idx * 4 + 2] = newPixel; // B
      output[idx * 4 + 3] = 255;      // A (fully opaque)
    }
  }
  
  return outputData;
}

// Generate a void-and-cluster dither matrix
function generateVoidAndClusterMatrix(width: number, height: number): number[][] {
  // For simplicity and performance, we'll use a predefined size for the matrix
  // In a real implementation, you might want to generate this dynamically
  const matrixSize = 32; // Using a 32x32 matrix
  
  // Create initial binary pattern with ~50% of pixels set
  const initialPattern = initializeRandomPattern(matrixSize, matrixSize, 0.5);
  
  // Create the rank matrix
  const rankMatrix = new Array(matrixSize).fill(0).map(() => new Array(matrixSize).fill(0));
  
  // Phase 1: Void phase - find and rank the largest "voids"
  let rank = 0;
  let binaryCount = countOnes(initialPattern);
  const workingPattern = initialPattern.map(row => [...row]);
  
  while (binaryCount < matrixSize * matrixSize) {
    const [voidX, voidY] = findLargestVoid(workingPattern, matrixSize, matrixSize);
    rankMatrix[voidY][voidX] = rank++;
    workingPattern[voidY][voidX] = 1;
    binaryCount++;
  }
  
  // Phase 2: Cluster phase - find and rank the tightest "clusters"
  while (binaryCount > 0) {
    const [clusterX, clusterY] = findTightestCluster(workingPattern, matrixSize, matrixSize);
    rankMatrix[clusterY][clusterX] = rank++;
    workingPattern[clusterY][clusterX] = 0;
    binaryCount--;
  }
  
  // Normalize the rank matrix to 0-1 range
  const normalizedMatrix = rankMatrix.map(row => 
    row.map(val => val / (matrixSize * matrixSize - 1))
  );
  
  return normalizedMatrix;
}

// Initialize a random binary pattern with approximately percentOnes percentage of 1s
function initializeRandomPattern(width: number, height: number, percentOnes: number): number[][] {
  const pattern = new Array(height).fill(0).map(() => new Array(width).fill(0));
  const numOnes = Math.floor(width * height * percentOnes);
  
  // Set random pixels to 1
  let onesPlaced = 0;
  while (onesPlaced < numOnes) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    
    if (pattern[y][x] === 0) {
      pattern[y][x] = 1;
      onesPlaced++;
    }
  }
  
  return pattern;
}

// Count the number of 1s in the pattern
function countOnes(pattern: number[][]): number {
  return pattern.reduce((sum, row) => 
    sum + row.reduce((rowSum, val) => rowSum + val, 0), 0);
}

// Find the largest void (area with fewest 1s nearby)
function findLargestVoid(pattern: number[][], width: number, height: number): [number, number] {
  let minClusterValue = Infinity;
  let voidX = 0;
  let voidY = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pattern[y][x] === 0) {
        const clusterValue = calculateClusterValue(pattern, x, y, width, height);
        if (clusterValue < minClusterValue) {
          minClusterValue = clusterValue;
          voidX = x;
          voidY = y;
        }
      }
    }
  }
  
  return [voidX, voidY];
}

// Find the tightest cluster (area with most 1s nearby)
function findTightestCluster(pattern: number[][], width: number, height: number): [number, number] {
  let maxClusterValue = -Infinity;
  let clusterX = 0;
  let clusterY = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pattern[y][x] === 1) {
        const clusterValue = calculateClusterValue(pattern, x, y, width, height);
        if (clusterValue > maxClusterValue) {
          maxClusterValue = clusterValue;
          clusterX = x;
          clusterY = y;
        }
      }
    }
  }
  
  return [clusterX, clusterY];
}

// Calculate a "cluster value" for a pixel - higher means more neighbors are set
function calculateClusterValue(pattern: number[][], x: number, y: number, width: number, height: number): number {
  let sum = 0;
  
  // Gaussian filter radius (can be adjusted)
  const radius = 2;
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      
      const nx = (x + dx + width) % width;  // Wrap around
      const ny = (y + dy + height) % height;  // Wrap around
      
      // Gaussian weight based on distance
      const distance = Math.sqrt(dx * dx + dy * dy);
      const weight = Math.exp(-(distance * distance) / (2 * radius * radius));
      
      sum += pattern[ny][nx] * weight;
    }
  }
  
  return sum;
} 