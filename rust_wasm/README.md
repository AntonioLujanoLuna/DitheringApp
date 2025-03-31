# Dithering WebAssembly Module

This directory contains the Rust implementation of various dithering algorithms optimized for WebAssembly.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

## Building the WebAssembly Module

1. Install Rust and wasm-pack if not already installed:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
   ```

2. Build the WebAssembly module from this directory:
   ```bash
   wasm-pack build --target web
   ```

3. This will generate a `pkg` directory containing the compiled WebAssembly module.

4. Copy the generated files to the appropriate location in your web application:
   ```bash
   mkdir -p ../public/assets
   cp pkg/dithering_wasm_bg.wasm ../public/assets/dithering_wasm.wasm
   cp pkg/dithering_wasm.js ../src/lib/wasm/
   ```

## Performance Notes

The Rust WebAssembly implementation provides significant performance improvements over JavaScript for the following algorithms:

- Ordered Dithering
- Floyd-Steinberg Dithering
- Atkinson Dithering
- Halftone Dithering
- Sobel Edge Detection

The performance gain is particularly noticeable for large images and animations. 