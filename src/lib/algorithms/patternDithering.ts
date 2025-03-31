// Pattern dithering - using custom patterns instead of dots
export function patternDithering(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  patternType: PatternType = 'dots',
  patternSize: number = 4,
  threshold: number = 128
): ImageData {
  // Create output ImageData
  const outputData = new ImageData(width, height);
  const output = outputData.data;
  
  // Get the selected pattern matrix
  const pattern = getPatternMatrix(patternType, patternSize);
  const patternWidth = pattern[0].length;
  const patternHeight = pattern.length;
  
  // Apply pattern dithering
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pixel = grayscale[idx];
      
      // Get the pattern threshold for this position
      const patternX = x % patternWidth;
      const patternY = y % patternHeight;
      const patternThreshold = pattern[patternY][patternX] * 255;
      
      // Apply threshold
      const newPixel = pixel < patternThreshold ? 0 : 255;
      
      // Set all RGB channels to the result
      output[idx * 4] = newPixel;     // R
      output[idx * 4 + 1] = newPixel; // G
      output[idx * 4 + 2] = newPixel; // B
      output[idx * 4 + 3] = 255;      // A (fully opaque)
    }
  }
  
  return outputData;
}

// Available pattern types
export type PatternType = 'dots' | 'lines' | 'crosses' | 'diamonds' | 'waves' | 'bricks' | 'custom';

// Get the pattern matrix for the selected pattern type
export function getPatternMatrix(patternType: PatternType, size: number = 4): number[][] {
  switch (patternType) {
    case 'dots':
      return createDotPattern(size);
    case 'lines':
      return createLinePattern(size);
    case 'crosses':
      return createCrossPattern(size);
    case 'diamonds':
      return createDiamondPattern(size);
    case 'waves':
      return createWavePattern(size);
    case 'bricks':
      return createBrickPattern(size);
    case 'custom':
      return createCustomPattern(size);
    default:
      return createDotPattern(size);
  }
}

// Create a dot pattern
function createDotPattern(size: number): number[][] {
  const pattern = Array(size).fill(0).map(() => Array(size).fill(0));
  const center = size / 2;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Calculate distance from center (normalized to 0-1)
      const dx = (x + 0.5) / size - 0.5;
      const dy = (y + 0.5) / size - 0.5;
      const distance = Math.sqrt(dx * dx + dy * dy) * 2; // Multiply by 2 to normalize to 0-1
      
      // Threshold increases with distance from center
      pattern[y][x] = Math.min(1, distance);
    }
  }
  
  return pattern;
}

// Create a line pattern
function createLinePattern(size: number): number[][] {
  const pattern = Array(size).fill(0).map(() => Array(size).fill(0));
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Horizontal lines that get thicker as you go down
      pattern[y][x] = y / size;
    }
  }
  
  return pattern;
}

// Create a cross pattern
function createCrossPattern(size: number): number[][] {
  const pattern = Array(size).fill(0).map(() => Array(size).fill(0));
  const center = size / 2;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Distance to nearest cross line
      const distToHorizontal = Math.abs((y + 0.5) / size - 0.5) * 2;
      const distToVertical = Math.abs((x + 0.5) / size - 0.5) * 2;
      const distToCross = Math.min(distToHorizontal, distToVertical);
      
      // Threshold increases with distance from cross
      pattern[y][x] = distToCross;
    }
  }
  
  return pattern;
}

// Create a diamond pattern
function createDiamondPattern(size: number): number[][] {
  const pattern = Array(size).fill(0).map(() => Array(size).fill(0));
  const center = size / 2;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Manhattan distance from center (creates diamond shape)
      const dx = Math.abs((x + 0.5) / size - 0.5);
      const dy = Math.abs((y + 0.5) / size - 0.5);
      const distance = (dx + dy); // Manhattan distance
      
      // Threshold increases with distance from center
      pattern[y][x] = Math.min(1, distance * 2); // Multiply by 2 to normalize to 0-1
    }
  }
  
  return pattern;
}

// Create a wave pattern
function createWavePattern(size: number): number[][] {
  const pattern = Array(size).fill(0).map(() => Array(size).fill(0));
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Sine wave pattern
      const normalized = (x + y) / size;
      const wave = (Math.sin(normalized * Math.PI * 2) + 1) / 2; // Normalize sin to 0-1
      
      pattern[y][x] = wave;
    }
  }
  
  return pattern;
}

// Create a brick pattern
function createBrickPattern(size: number): number[][] {
  const pattern = Array(size).fill(0).map(() => Array(size).fill(0));
  const brickHeight = Math.max(2, Math.floor(size / 3));
  
  for (let y = 0; y < size; y++) {
    const row = Math.floor(y / brickHeight);
    const offset = (row % 2) * Math.floor(size / 2); // Offset every other row
    
    for (let x = 0; x < size; x++) {
      const adjustedX = (x + offset) % size;
      const brickX = Math.floor(adjustedX / (size / 2)) * (size / 2);
      
      // Distance to nearest brick edge
      const edgeDistX = Math.min(Math.abs(adjustedX - brickX), Math.abs(adjustedX - (brickX + size / 2 - 1)));
      const edgeDistY = Math.min(Math.abs(y - Math.floor(y / brickHeight) * brickHeight), 
                                Math.abs(y - (Math.floor(y / brickHeight) + 1) * brickHeight - 1));
      const edgeDist = Math.min(edgeDistX, edgeDistY) / (size / 10);
      
      // Higher value (threshold) near edges
      pattern[y][x] = Math.max(0, Math.min(1, 1 - edgeDist));
    }
  }
  
  return pattern;
}

// Create a custom pattern - can be replaced with user-provided pattern
function createCustomPattern(size: number): number[][] {
  // Default to a checkerboard pattern
  const pattern = Array(size).fill(0).map(() => Array(size).fill(0));
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      pattern[y][x] = (x + y) % 2 === 0 ? 0.25 : 0.75;
    }
  }
  
  return pattern;
}

// Allow for custom pattern registration
let customPatternMatrix: number[][] | null = null;

export function registerCustomPattern(pattern: number[][]): void {
  customPatternMatrix = pattern;
}

// Get registered custom pattern if available
function getCustomPattern(size: number): number[][] {
  if (customPatternMatrix) {
    // Use registered pattern or scale it if needed
    return customPatternMatrix;
  }
  
  // Return default pattern if no custom pattern is registered
  return createCustomPattern(size);
} 