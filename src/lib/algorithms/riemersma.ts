// Riemersma dithering (Hilbert curve dithering)
export function riemersmaDithering(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number = 128
): ImageData {
  // Create output ImageData
  const outputData = new ImageData(width, height);
  const output = outputData.data;
  
  // Create a copy of the grayscale image
  const buffer = new Float32Array(grayscale);
  
  // Determine the size of the Hilbert curve
  // We'll use a power of 2 that's larger than or equal to the image size
  const maxDimension = Math.max(width, height);
  const order = Math.ceil(Math.log2(maxDimension));
  const curveSize = Math.pow(2, order);
  
  // Generate the Hilbert curve path
  const hilbertPath = generateHilbertCurve(order);
  
  // Set up error diffusion
  const errorBuffer = new Float32Array(3).fill(0); // We'll use a simple 3-tap filter
  
  // Apply dithering along the Hilbert curve
  for (let i = 0; i < hilbertPath.length; i++) {
    const [x, y] = hilbertPath[i];
    
    // Skip points outside the image
    if (x >= width || y >= height) continue;
    
    const idx = y * width + x;
    
    // Add accumulated error to this pixel
    const pixelValue = buffer[idx] + errorBuffer[0];
    
    // Apply threshold
    const newPixel = pixelValue < threshold ? 0 : 255;
    
    // Calculate error
    const error = pixelValue - newPixel;
    
    // Update error buffer (simple shift register)
    errorBuffer[0] = errorBuffer[1] + error * 0.4;
    errorBuffer[1] = errorBuffer[2] + error * 0.3;
    errorBuffer[2] = error * 0.3;
    
    // Set all RGB channels to the result (black or white)
    output[idx * 4] = newPixel;     // R
    output[idx * 4 + 1] = newPixel; // G
    output[idx * 4 + 2] = newPixel; // B
    output[idx * 4 + 3] = 255;      // A (fully opaque)
  }
  
  return outputData;
}

// Generate a Hilbert curve of the given order
function generateHilbertCurve(order: number): [number, number][] {
  const size = Math.pow(2, order);
  const points: [number, number][] = new Array(size * size);
  
  // Initialize with zeros
  for (let i = 0; i < points.length; i++) {
    points[i] = [0, 0];
  }
  
  // Generate the curve
  hilbertCurveHelper(points, 0, 0, size, 0, 0, size - 1, 0, size - 1);
  
  return points;
}

// Helper function to recursively generate the Hilbert curve
function hilbertCurveHelper(
  points: [number, number][],
  index: number,
  x: number,
  y: number,
  xi: number,
  xj: number,
  yi: number,
  yj: number,
  length: number
): number {
  if (length === 1) {
    points[index] = [x, y];
    return index + 1;
  }
  
  length = length / 2;
  
  // Recursively generate the four quadrants
  index = hilbertCurveHelper(
    points, index, 
    x + xi * length, y + yi * length, 
    yi, yj, xi, xj, 
    length
  );
  
  index = hilbertCurveHelper(
    points, index, 
    x + xi * length + yi * length, y + yi * length + yj * length, 
    xi, xj, yi, yj, 
    length
  );
  
  index = hilbertCurveHelper(
    points, index, 
    x + xi * length + yi * length + xi * length, y + yi * length + yj * length + yi * length, 
    xi, xj, yi, yj, 
    length
  );
  
  index = hilbertCurveHelper(
    points, index, 
    x + xi * length + yi * length + xi * length - yj * length, y + yi * length + yj * length + yi * length - xj * length, 
    -yi, -yj, -xi, -xj, 
    length
  );
  
  return index;
} 