// Direct Binary Search (DBS) dithering - comprehensive implementation
export function directBinarySearchDithering(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number = 128
): ImageData {
  // Create output ImageData
  const outputData = new ImageData(width, height);
  const output = outputData.data;
  
  // Initial binary pattern using simple thresholding
  const binaryPattern = new Uint8Array(width * height);
  for (let i = 0; i < grayscale.length; i++) {
    binaryPattern[i] = grayscale[i] < threshold ? 0 : 1;
  }
  
  // Calculate initial error
  const targetImage = new Float32Array(grayscale);
  
  // Define a more accurate human visual system filter
  // This uses a circularly symmetric Gaussian filter to model the human visual system
  const filterSize = 7; // Larger filter for more accurate HVS modeling
  const filter = createHVSFilter(filterSize);
  
  // Pre-compute filtered versions of basis functions for efficiency
  const filteredBasisFunctions = precomputeFilteredBasisFunctions(width, height, filterSize, filter);
  
  // Initialize error metrics
  const currentErrorMetrics = calculateErrorMetrics(targetImage, binaryPattern, width, height, filteredBasisFunctions);
  
  // Number of iterations (higher = better quality but slower)
  const maxIterations = 15;
  const minImprovement = 0.01; // Minimum improvement ratio to continue iterations
  
  // Pixel swap candidates per iteration
  const swapCandidates = Math.min(width * height, 10000); // Cap to avoid excessive computation
  
  // DBS optimization process - iterative improvement
  let iteration = 0;
  let improvementRatio = 1.0;
  let previousTotalError = currentErrorMetrics.totalError;
  
  while (iteration < maxIterations && improvementRatio > minImprovement) {
    // Track changes in this iteration
    let changesInIteration = 0;
    
    // Try random pixel toggle candidates
    for (let c = 0; c < swapCandidates; c++) {
      // Randomly select a pixel to toggle
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const idx = y * width + x;
      
      // Calculate potential error change if we toggle this pixel
      const errorChange = calculateToggleErrorChange(
        targetImage, binaryPattern, x, y, width, height, 
        filteredBasisFunctions, currentErrorMetrics
      );
      
      // Toggle pixel if it reduces error
      if (errorChange < 0) {
        // Toggle the pixel
        binaryPattern[idx] = binaryPattern[idx] === 0 ? 1 : 0;
        
        // Update error metrics
        updateErrorMetrics(currentErrorMetrics, errorChange);
        
        changesInIteration++;
      }
    }
    
    // Calculate improvement ratio
    improvementRatio = (previousTotalError - currentErrorMetrics.totalError) / previousTotalError;
    previousTotalError = currentErrorMetrics.totalError;
    
    // Break if no changes were made in this iteration
    if (changesInIteration === 0) break;
    
    iteration++;
  }
  
  // Convert binary pattern to output
  for (let i = 0; i < binaryPattern.length; i++) {
    const value = binaryPattern[i] === 0 ? 0 : 255;
    output[i * 4] = value;     // R
    output[i * 4 + 1] = value; // G
    output[i * 4 + 2] = value; // B
    output[i * 4 + 3] = 255;   // A (fully opaque)
  }
  
  return outputData;
}

// Create a Human Visual System filter based on a circularly symmetric Gaussian
function createHVSFilter(size: number): Float32Array {
  const radius = Math.floor(size / 2);
  const filter = new Float32Array(size * size);
  let sum = 0;
  
  // Parameters for the HVS model - these can be adjusted based on viewing distance/conditions
  const sigma = radius / 2.5;
  
  // Generate the filter
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - radius;
      const dy = y - radius;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Gaussian function modified to model human visual sensitivity
      const weight = Math.exp(-(distance * distance) / (2 * sigma * sigma));
      
      filter[y * size + x] = weight;
      sum += weight;
    }
  }
  
  // Normalize the filter
  for (let i = 0; i < filter.length; i++) {
    filter[i] /= sum;
  }
  
  return filter;
}

// Pre-compute filtered versions of basis functions for all pixel positions
function precomputeFilteredBasisFunctions(
  width: number,
  height: number,
  filterSize: number,
  filter: Float32Array
): Float32Array[] {
  const numPixels = width * height;
  const filteredBasis = new Array(numPixels);
  const radius = Math.floor(filterSize / 2);
  
  // For each pixel position, compute the filtered impact of toggling that pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const basisFunction = new Float32Array(numPixels);
      
      // Compute the filtered impact of this pixel on its neighborhood
      for (let fy = Math.max(0, y - radius); fy < Math.min(height, y + radius + 1); fy++) {
        for (let fx = Math.max(0, x - radius); fx < Math.min(width, x + radius + 1); fx++) {
          const filterY = fy - (y - radius);
          const filterX = fx - (x - radius);
          
          // Skip out of bounds filter positions
          if (filterY < 0 || filterY >= filterSize || filterX < 0 || filterX >= filterSize) {
            continue;
          }
          
          const filterIdx = filterY * filterSize + filterX;
          const outputIdx = fy * width + fx;
          
          // Store the filtered impact
          basisFunction[outputIdx] = filter[filterIdx];
        }
      }
      
      filteredBasis[idx] = basisFunction;
    }
  }
  
  return filteredBasis;
}

// Calculate comprehensive error metrics
interface ErrorMetrics {
  totalError: number;
  filteredTarget: Float32Array;
  filteredOutput: Float32Array;
}

function calculateErrorMetrics(
  targetImage: Float32Array,
  binaryPattern: Uint8Array,
  width: number,
  height: number,
  filteredBasisFunctions: Float32Array[]
): ErrorMetrics {
  const numPixels = width * height;
  const filteredTarget = new Float32Array(numPixels);
  const filteredOutput = new Float32Array(numPixels);
  
  // Initialize filtered target (we only need to do this once)
  for (let i = 0; i < numPixels; i++) {
    filteredTarget[i] = targetImage[i];
  }
  
  // Calculate filtered output
  for (let i = 0; i < numPixels; i++) {
    if (binaryPattern[i] === 1) {
      const basis = filteredBasisFunctions[i];
      for (let j = 0; j < numPixels; j++) {
        filteredOutput[j] += basis[j] * 255;
      }
    }
  }
  
  // Calculate total error
  let totalError = 0;
  for (let i = 0; i < numPixels; i++) {
    const error = filteredTarget[i] - filteredOutput[i];
    totalError += error * error;
  }
  
  return {
    totalError,
    filteredTarget,
    filteredOutput
  };
}

// Calculate error change if a pixel is toggled
function calculateToggleErrorChange(
  targetImage: Float32Array,
  binaryPattern: Uint8Array,
  x: number,
  y: number,
  width: number,
  height: number,
  filteredBasisFunctions: Float32Array[],
  currentErrorMetrics: ErrorMetrics
): number {
  const idx = y * width + x;
  const basis = filteredBasisFunctions[idx];
  const numPixels = width * height;
  
  // Current pixel value
  const currentValue = binaryPattern[idx];
  const newValue = currentValue === 0 ? 255 : 0;
  const valueDiff = newValue - (currentValue * 255);
  
  // Calculate error change
  let errorChange = 0;
  for (let i = 0; i < numPixels; i++) {
    if (basis[i] === 0) continue; // Skip pixels not affected by this toggle
    
    const currentFilteredOutput = currentErrorMetrics.filteredOutput[i];
    const newFilteredOutput = currentFilteredOutput + basis[i] * valueDiff;
    
    const pixelCurrentError = currentErrorMetrics.filteredTarget[i] - currentFilteredOutput;
    const pixelNewError = currentErrorMetrics.filteredTarget[i] - newFilteredOutput;
    
    errorChange += pixelNewError * pixelNewError - pixelCurrentError * pixelCurrentError;
  }
  
  return errorChange;
}

// Update error metrics after a pixel toggle
function updateErrorMetrics(
  errorMetrics: ErrorMetrics,
  errorChange: number
): void {
  errorMetrics.totalError += errorChange;
} 