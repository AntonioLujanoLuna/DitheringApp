/**
 * Dithering WebAssembly module interface
 * This file provides TypeScript bindings for the Rust-compiled WebAssembly functions
 */

// Define interface for the exported WebAssembly functions
interface DitheringWasmExports {
  // Core memory management functions
  memory: WebAssembly.Memory;
  allocate: (size: number) => number;
  deallocate: (pointer: number, size: number) => void;
  
  // Dithering algorithms
  ordered_dither: (
    inputPtr: number, 
    width: number, 
    height: number, 
    dotSize: number, 
    outputPtr: number
  ) => void;
  
  floyd_steinberg_dither: (
    inputPtr: number, 
    width: number, 
    height: number, 
    threshold: number, 
    outputPtr: number
  ) => void;
  
  atkinson_dither: (
    inputPtr: number, 
    width: number, 
    height: number, 
    threshold: number, 
    outputPtr: number
  ) => void;
  
  halftone_dither: (
    inputPtr: number, 
    width: number, 
    height: number, 
    dotSize: number, 
    spacing: number, 
    angle: number, 
    outputPtr: number
  ) => void;
  
  // Edge detection and region finding
  sobel_edge_detection: (
    inputPtr: number, 
    width: number, 
    height: number, 
    threshold: number, 
    outputPtr: number
  ) => void;
}

// Module state
let wasmModule: WebAssembly.WebAssemblyInstantiatedSource | null = null;
let wasmExports: DitheringWasmExports | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;
let wasmLoadAttempts = 0;
const MAX_WASM_LOAD_ATTEMPTS = 3;
let wasmUnavailable = false; // Tracks if WASM is definitively unavailable after retries

// Check if WebAssembly is supported
export function isWasmSupported(): boolean {
  // Only check for browser feature support initially
  const supported = (
    typeof WebAssembly === 'object' &&
    typeof WebAssembly.instantiate === 'function' &&
    typeof WebAssembly.Memory === 'function'
  );
  
  return supported;
}

// Asynchronously load the WebAssembly module
export async function loadWasmModule(): Promise<void> {
  // Initial check for browser support
  if (!isWasmSupported()) {
    console.warn('WebAssembly not supported by this browser.');
    wasmUnavailable = true;
  }

  if (wasmUnavailable) {
    throw new Error('WebAssembly module failed to load after multiple attempts.');
  }

  if (wasmModule !== null) {
    return Promise.resolve();
  }
  
  if (isLoading && loadPromise) {
    return loadPromise;
  }
  
  isLoading = true;
  
  loadPromise = (async () => {
    while (wasmLoadAttempts < MAX_WASM_LOAD_ATTEMPTS) {
      try {
        // Get the base URL from Vite's import.meta.env or use a default
        const base = (window as any).__VITE_BASE_URL__ || '/DitheringApp/';
        
        // Use the correct path considering GitHub Pages base path
        const wasmPath = `${base}assets/dithering_wasm.wasm`;
        
        console.log(`Attempt ${wasmLoadAttempts + 1}: Loading WebAssembly module from: ${wasmPath}`);
        const response = await fetch(wasmPath);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch WebAssembly module: ${response.status} ${response.statusText}`);
        }
        
        const wasmBytes = await response.arrayBuffer();
        
        wasmModule = await WebAssembly.instantiate(wasmBytes, {
          env: {
            // Environment variables and imported JavaScript functions if needed
            memory: new WebAssembly.Memory({ initial: 256, maximum: 512 }),
          },
        });
        
        wasmExports = wasmModule.instance.exports as unknown as DitheringWasmExports;
        console.log('WebAssembly module loaded successfully');
        wasmLoadAttempts = 0; // Reset attempts on success
        wasmUnavailable = false; // Mark as available
        isLoading = false;
        return; // Exit loop and promise on success
      } catch (error) {
        wasmLoadAttempts++;
        console.error(`Failed to load WebAssembly module (attempt ${wasmLoadAttempts}/${MAX_WASM_LOAD_ATTEMPTS}):`, error);

        if (wasmLoadAttempts >= MAX_WASM_LOAD_ATTEMPTS) {
          console.error('Max WebAssembly load attempts reached. Disabling for this session.');
          wasmUnavailable = true;
          isLoading = false;
          // Re-throw the last error to propagate failure
          throw new Error(`WebAssembly module failed to load after ${MAX_WASM_LOAD_ATTEMPTS} attempts. Last error: ${error instanceof Error ? error.message : String(error)}`);
        }

        // Exponential backoff delay
        const delay = Math.pow(2, wasmLoadAttempts - 1) * 1000; // 1s, 2s
        console.log(`Retrying WASM load in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    // This part should technically not be reached due to the throw inside the loop,
    // but ensures the promise rejects if the loop finishes unexpectedly.
    isLoading = false;
    throw new Error("WebAssembly loading failed after multiple retries.");
  })();
  
  return loadPromise;
}

// Helper function to copy grayscale data to WASM memory
function copyToWasmMemory(data: Uint8ClampedArray): number {
  if (!wasmExports) {
    throw new Error('WebAssembly module not loaded');
  }
  
  const pointer = wasmExports.allocate(data.length);
  
  // Create a view of the WASM memory
  const memory = new Uint8ClampedArray(wasmExports.memory.buffer);
  
  // Copy data
  memory.set(data, pointer);
  
  return pointer;
}

// Helper function to copy data from WASM memory
function copyFromWasmMemory(pointer: number, length: number): Uint8ClampedArray {
  if (!wasmExports) {
    throw new Error('WebAssembly module not loaded');
  }
  
  // Create a view of the WASM memory
  const memory = new Uint8ClampedArray(wasmExports.memory.buffer);
  
  // Create a copy of the data
  return new Uint8ClampedArray(memory.slice(pointer, pointer + length));
}

// Wrapper for ordered dithering
export async function orderedDitheringWasm(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  dotSize: number
): Promise<Uint8ClampedArray> {
  if (!isWasmSupported() || wasmUnavailable) { 
    throw new Error('WebAssembly is not available for ordered dithering.'); 
  }
  await loadWasmModule();
  
  if (!wasmExports) {
    throw new Error('WebAssembly module not loaded');
  }
  
  // Allocate memory for input and output
  const inputPtr = copyToWasmMemory(grayscale);
  const outputPtr = wasmExports.allocate(grayscale.length);
  
  // Call WASM function
  wasmExports.ordered_dither(inputPtr, width, height, dotSize, outputPtr);
  
  // Get result
  const result = copyFromWasmMemory(outputPtr, grayscale.length);
  
  // Free memory
  wasmExports.deallocate(inputPtr, grayscale.length);
  wasmExports.deallocate(outputPtr, grayscale.length);
  
  return result;
}

// Wrapper for Floyd-Steinberg dithering
export async function floydSteinbergDitheringWasm(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number = 128
): Promise<Uint8ClampedArray> {
  if (!isWasmSupported() || wasmUnavailable) { 
    throw new Error('WebAssembly is not available for Floyd-Steinberg dithering.'); 
  }
  await loadWasmModule();
  
  if (!wasmExports) {
    throw new Error('WebAssembly module not loaded');
  }
  
  // Allocate memory for input and output
  const inputPtr = copyToWasmMemory(grayscale);
  const outputPtr = wasmExports.allocate(grayscale.length);
  
  // Call WASM function
  wasmExports.floyd_steinberg_dither(inputPtr, width, height, threshold, outputPtr);
  
  // Get result
  const result = copyFromWasmMemory(outputPtr, grayscale.length);
  
  // Free memory
  wasmExports.deallocate(inputPtr, grayscale.length);
  wasmExports.deallocate(outputPtr, grayscale.length);
  
  return result;
}

// Wrapper for Atkinson dithering
export async function atkinsonDitheringWasm(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number = 128
): Promise<Uint8ClampedArray> {
  if (!isWasmSupported() || wasmUnavailable) { 
    throw new Error('WebAssembly is not available for Atkinson dithering.'); 
  }
  await loadWasmModule();
  
  if (!wasmExports) {
    throw new Error('WebAssembly module not loaded');
  }
  
  // Allocate memory for input and output
  const inputPtr = copyToWasmMemory(grayscale);
  const outputPtr = wasmExports.allocate(grayscale.length);
  
  // Call WASM function
  wasmExports.atkinson_dither(inputPtr, width, height, threshold, outputPtr);
  
  // Get result
  const result = copyFromWasmMemory(outputPtr, grayscale.length);
  
  // Free memory
  wasmExports.deallocate(inputPtr, grayscale.length);
  wasmExports.deallocate(outputPtr, grayscale.length);
  
  return result;
}

// Wrapper for halftone dithering
export async function halftoneDitheringWasm(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  dotSize: number,
  spacing: number,
  angle: number
): Promise<Uint8ClampedArray> {
  if (!isWasmSupported() || wasmUnavailable) { 
    throw new Error('WebAssembly is not available for halftone dithering.'); 
  }
  await loadWasmModule();
  
  if (!wasmExports) {
    throw new Error('WebAssembly module not loaded');
  }
  
  // Allocate memory for input and output
  const inputPtr = copyToWasmMemory(grayscale);
  const outputPtr = wasmExports.allocate(grayscale.length);
  
  // Call WASM function
  wasmExports.halftone_dither(inputPtr, width, height, dotSize, spacing, angle, outputPtr);
  
  // Get result
  const result = copyFromWasmMemory(outputPtr, grayscale.length);
  
  // Free memory
  wasmExports.deallocate(inputPtr, grayscale.length);
  wasmExports.deallocate(outputPtr, grayscale.length);
  
  return result;
}

// Wrapper for Sobel edge detection
export async function sobelEdgeDetectionWasm(
  grayscale: Uint8ClampedArray,
  width: number,
  height: number,
  threshold: number
): Promise<Uint8ClampedArray> {
  if (!isWasmSupported() || wasmUnavailable) { 
    throw new Error('WebAssembly is not available for Sobel edge detection.'); 
  }
  await loadWasmModule();
  
  if (!wasmExports) {
    throw new Error('WebAssembly module not loaded');
  }
  
  // Allocate memory for input and output
  const inputPtr = copyToWasmMemory(grayscale);
  const outputPtr = wasmExports.allocate(grayscale.length);
  
  // Call WASM function
  wasmExports.sobel_edge_detection(inputPtr, width, height, threshold, outputPtr);
  
  // Get result
  const result = copyFromWasmMemory(outputPtr, grayscale.length);
  
  // Free memory
  wasmExports.deallocate(inputPtr, grayscale.length);
  wasmExports.deallocate(outputPtr, grayscale.length);
  
  return result;
} 