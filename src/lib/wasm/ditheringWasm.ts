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

// Check if WebAssembly is supported
export function isWasmSupported(): boolean {
  const supported = (
    typeof WebAssembly === 'object' &&
    typeof WebAssembly.instantiate === 'function' &&
    typeof WebAssembly.Memory === 'function'
  );
  
  // Check if we previously had a loading error
  const hadLoadError = localStorage.getItem('wasm_load_error') === 'true';
  
  if (hadLoadError) {
    console.warn('WebAssembly was previously unable to load, disabling support');
    return false;
  }
  
  return supported;
}

// Track WebAssembly loading success/failure
export function setWasmLoadError(hasError: boolean): void {
  if (hasError) {
    localStorage.setItem('wasm_load_error', 'true');
    console.error('WebAssembly loading failed, disabling for future requests');
  } else {
    localStorage.removeItem('wasm_load_error');
  }
}

// Asynchronously load the WebAssembly module
export async function loadWasmModule(): Promise<void> {
  if (wasmModule !== null) {
    return Promise.resolve();
  }
  
  if (isLoading && loadPromise) {
    return loadPromise;
  }
  
  isLoading = true;
  
  loadPromise = (async () => {
    try {
      // Get the base URL from Vite's import.meta.env or use a default
      const base = (window as any).__VITE_BASE_URL__ || '/DitheringApp/';
      
      // Use the correct path considering GitHub Pages base path
      // We're using a relative path with the base to avoid issues with GitHub Pages subdirectory
      const wasmPath = `${base}assets/dithering_wasm.wasm`;
      
      console.log(`Loading WebAssembly module from: ${wasmPath}`);
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
      
      // Mark successful loading
      setWasmLoadError(false);
    } catch (error) {
      console.error('Failed to load WebAssembly module:', error);
      // Mark the error so we don't try again in this session
      setWasmLoadError(true);
      throw error;
    } finally {
      isLoading = false;
    }
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