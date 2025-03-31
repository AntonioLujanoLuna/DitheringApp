use wasm_bindgen::prelude::*;

mod ordered;
mod floyd_steinberg;
mod atkinson;
mod halftone;
mod edge_detection;

// Memory allocation functions
#[wasm_bindgen]
pub fn allocate(size: usize) -> *mut u8 {
    let mut buffer = Vec::with_capacity(size);
    let ptr = buffer.as_mut_ptr();
    std::mem::forget(buffer);
    ptr
}

#[wasm_bindgen]
pub fn deallocate(ptr: *mut u8, size: usize) {
    unsafe {
        let _buffer = Vec::from_raw_parts(ptr, 0, size);
        // _buffer is dropped when it goes out of scope
    }
}

// Re-export functions from modules
#[wasm_bindgen]
pub fn ordered_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    dot_size: usize,
    output_ptr: *mut u8,
) {
    ordered::ordered_dither(input_ptr, width, height, dot_size, output_ptr);
}

#[wasm_bindgen]
pub fn floyd_steinberg_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    floyd_steinberg::floyd_steinberg_dither(input_ptr, width, height, threshold, output_ptr);
}

#[wasm_bindgen]
pub fn atkinson_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    atkinson::atkinson_dither(input_ptr, width, height, threshold, output_ptr);
}

#[wasm_bindgen]
pub fn halftone_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    dot_size: usize,
    spacing: usize,
    angle: f32,
    output_ptr: *mut u8,
) {
    halftone::halftone_dither(input_ptr, width, height, dot_size, spacing, angle, output_ptr);
}

#[wasm_bindgen]
pub fn sobel_edge_detection(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    edge_detection::sobel_edge_detection(input_ptr, width, height, threshold, output_ptr);
} 