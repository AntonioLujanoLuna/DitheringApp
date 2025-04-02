use wasm_bindgen::prelude::*;

mod ordered;
mod floyd_steinberg;
mod atkinson;
mod halftone;
mod edge_detection;
mod random;
mod sierra_lite;
mod burkes;
mod stucki;
mod jarvis_judice_ninke;
mod pattern;
mod riemersma;
mod blue_noise;
mod void_and_cluster;
mod direct_binary_search;
mod multi_tone;
mod selective;

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

#[wasm_bindgen]
pub fn random_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    noise_amount: f32,
    output_ptr: *mut u8,
) {
    random::random_dither(input_ptr, width, height, threshold, noise_amount, output_ptr);
}

// Export the new Sierra Lite dither function
#[wasm_bindgen]
pub fn sierra_lite_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    sierra_lite::sierra_lite_dither(input_ptr, width, height, threshold, output_ptr);
}

// Export the new Burkes dither function
#[wasm_bindgen]
pub fn burkes_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    burkes::burkes_dither(input_ptr, width, height, threshold, output_ptr);
}

// Export the new Stucki dither function
#[wasm_bindgen]
pub fn stucki_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    stucki::stucki_dither(input_ptr, width, height, threshold, output_ptr);
}

// Export the new Jarvis-Judice-Ninke dither function
#[wasm_bindgen]
pub fn jarvis_judice_ninke_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    jarvis_judice_ninke::jarvis_judice_ninke_dither(input_ptr, width, height, threshold, output_ptr);
}

// Export the PatternType enum
pub use pattern::PatternType;

// Export the new Pattern dither function
#[wasm_bindgen]
pub fn pattern_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    pattern_type: PatternType,
    pattern_size: usize,
    output_ptr: *mut u8,
) {
    pattern::pattern_dither(input_ptr, width, height, pattern_type, pattern_size, output_ptr);
}

// Export the new Riemersma dither function
#[wasm_bindgen]
pub fn riemersma_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    riemersma::riemersma_dither(input_ptr, width, height, threshold, output_ptr);
}

// Export the new Blue Noise dither function
#[wasm_bindgen]
pub fn blue_noise_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    blue_noise::blue_noise_dither(input_ptr, width, height, threshold, output_ptr);
}

// Export the new Void and Cluster dither function
#[wasm_bindgen]
pub fn void_and_cluster_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    void_and_cluster::void_and_cluster_dither(input_ptr, width, height, threshold, output_ptr);
}

// Export the new Direct Binary Search dither function
#[wasm_bindgen]
pub fn direct_binary_search_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    direct_binary_search::direct_binary_search_dither(input_ptr, width, height, threshold, output_ptr);
}

// Export the MultiToneAlgorithm enum
pub use multi_tone::MultiToneAlgorithm;

// Export the new Multi-Tone dither function
#[wasm_bindgen]
pub fn multi_tone_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    levels: usize,
    algorithm: MultiToneAlgorithm,
    dot_size: usize,
    output_ptr: *mut u8,
) {
    multi_tone::multi_tone_dither(input_ptr, width, height, levels, algorithm, dot_size, output_ptr);
}

// Export the DitheringAlgorithmType enum from the selective module
pub use selective::DitheringAlgorithmType;

// Export the new Selective Dither function
#[wasm_bindgen]
pub fn selective_dither(
    grayscale_ptr: *const u8,
    width: usize,
    height: usize,
    // Region data passed as separate arrays (pointers)
    mask_pointers: *const *const u8,
    algorithms: *const u32,
    thresholds: *const u8,
    dot_sizes: *const usize,
    spacings: *const usize,
    angles: *const f32,
    noise_amounts: *const f32,
    pattern_types: *const u32,
    pattern_sizes: *const usize,
    mt_levels: *const usize,
    mt_algos: *const u32,
    num_regions: usize,
    // Default algorithm parameters
    default_algorithm_type: DitheringAlgorithmType,
    default_threshold: u8,
    default_dot_size: usize,
    default_spacing: usize,
    default_angle: f32,
    default_noise_amount: f32,
    default_pattern_type: PatternType, // Use pattern::PatternType
    default_pattern_size: usize,
    default_mt_levels: usize,
    default_mt_algo: MultiToneAlgorithm, // Use multi_tone::MultiToneAlgorithm
    // Output buffer
    output_ptr: *mut u8,
) {
    selective::selective_dither(
        grayscale_ptr, width, height,
        mask_pointers, algorithms, thresholds, dot_sizes, spacings, angles,
        noise_amounts, pattern_types, pattern_sizes, mt_levels, mt_algos,
        num_regions,
        default_algorithm_type, default_threshold, default_dot_size,
        default_spacing, default_angle, default_noise_amount,
        default_pattern_type, default_pattern_size,
        default_mt_levels, default_mt_algo,
        output_ptr,
    );
} 