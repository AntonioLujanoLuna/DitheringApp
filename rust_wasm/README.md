# Dithering WebAssembly Module

This Rust crate compiles to WebAssembly (Wasm) to provide high-performance dithering algorithms for web applications.

## Algorithms Implemented

*   Ordered (Bayer)
*   Floyd-Steinberg
*   Atkinson
*   Halftone
*   Random
*   Sierra Lite
*   Burkes
*   Stucki
*   Jarvis-Judice-Ninke
*   Pattern (Dots, Lines, Crosses, etc.)
*   Riemersma (Hilbert Curve)
*   Blue Noise (Mitchell's Best Candidate approx.)
*   Void and Cluster
*   Direct Binary Search (DBS) - **Note:** Memory intensive precomputation.
*   Multi-Tone (using Ordered, Error Diffusion, or Blue Noise)
*   Selective (applying different algorithms to masked regions)

## Building

To compile the Rust code into WebAssembly, you need `wasm-pack`.

1.  **Install `wasm-pack`** (if you haven't already):
    ```bash
    cargo install wasm-pack
    ```

2.  **Navigate to this directory** (`rust_wasm`):
    ```bash
    cd rust_wasm
    ```

3.  **Build the Wasm package** targeting the web:
    ```bash
    wasm-pack build --target web
    ```

This command will generate a `pkg` directory within `rust_wasm`. This directory contains:

*   `dithering_wasm_bg.wasm`: The compiled WebAssembly binary.
*   `dithering_wasm.js`: JavaScript bindings (glue code) to load and interact with the Wasm module.
*   `dithering_wasm.d.ts`: TypeScript definitions for the JS bindings.
*   `package.json`: Defines the package details.

## Integration

1.  Copy or link the generated `pkg` directory into your web application (e.g., `src/lib/wasm_pkg`).
2.  Import the necessary functions and the `init` function from the generated JavaScript file (e.g., `dithering_wasm.js`).
3.  Call `await init()` once before using any Wasm functions.
4.  Use the exported Wasm functions (like `floyd_steinberg_dither`, `selective_dither`, etc.).
5.  **Remember to manage Wasm memory:** Use the provided `allocate` and `deallocate` functions to create/free memory buffers passed to/from the Wasm module. Copy data into and out of the Wasm memory space.

## Performance Notes

The Rust WebAssembly implementation provides significant performance improvements over JavaScript for the following algorithms:

- Ordered Dithering
- Floyd-Steinberg Dithering
- Atkinson Dithering
- Halftone Dithering
- Sobel Edge Detection

The performance gain is particularly noticeable for large images and animations. 