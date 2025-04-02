use wasm_bindgen::prelude::*;

// Import necessary functions from other modules
use crate::ordered;
use crate::floyd_steinberg;
use crate::atkinson;
use crate::halftone;
use crate::edge_detection; // Assuming edge detection might be selectable?
use crate::random;
use crate::sierra_lite;
use crate::burkes;
use crate::stucki;
use crate::jarvis_judice_ninke;
use crate::pattern::{self, PatternType};
use crate::riemersma;
use crate::blue_noise;
use crate::void_and_cluster;
use crate::direct_binary_search;
use crate::multi_tone::{self, MultiToneAlgorithm};


// Enum to represent the dithering algorithms selectable from JS
// Ensure the order/values match how they are sent from JavaScript
#[wasm_bindgen]
#[repr(u32)] // Explicit representation, useful for JS interop
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum DitheringAlgorithmType {
    Ordered = 0,
    FloydSteinberg = 1,
    Atkinson = 2,
    Halftone = 3,
    // EdgeDetection = 4, // Example if needed
    Random = 5,
    SierraLite = 6,
    Burkes = 7,
    Stucki = 8,
    JarvisJudiceNinke = 9,
    Pattern = 10,
    Riemersma = 11,
    BlueNoise = 12,
    VoidAndCluster = 13,
    DirectBinarySearch = 14,
    MultiTone = 15,
    // Add others as needed, ensure JS side sends corresponding integer
}

// Helper function to run a specific dither algorithm on the full grayscale data
// and write the RGBA result to the provided temporary output buffer.
fn run_specific_dither(
    grayscale_ptr: *const u8,
    width: usize,
    height: usize,
    algo_type: DitheringAlgorithmType,
    // Pass all possible parameters; the called function will ignore unused ones
    threshold: u8,
    dot_size: usize,
    spacing: usize,
    angle: f32,
    noise_amount: f32,
    pattern_type: PatternType, // from pattern.rs
    pattern_size: usize,
    multi_tone_levels: usize,
    multi_tone_algo: MultiToneAlgorithm, // from multi_tone.rs
    temp_output_buffer_ptr: *mut u8, // RGBA buffer
) {
    // Note: This function assumes temp_output_buffer_ptr points to a valid buffer
    // of size width * height * 4 bytes.

    match algo_type {
        DitheringAlgorithmType::Ordered => {
             ordered::ordered_dither(grayscale_ptr, width, height, dot_size, temp_output_buffer_ptr);
        }
        DitheringAlgorithmType::FloydSteinberg => {
            floyd_steinberg::floyd_steinberg_dither(grayscale_ptr, width, height, threshold, temp_output_buffer_ptr);
        }
        DitheringAlgorithmType::Atkinson => {
             atkinson::atkinson_dither(grayscale_ptr, width, height, threshold, temp_output_buffer_ptr);
        }
        DitheringAlgorithmType::Halftone => {
             halftone::halftone_dither(grayscale_ptr, width, height, dot_size, spacing, angle, temp_output_buffer_ptr);
        }
        DitheringAlgorithmType::Random => {
            random::random_dither(grayscale_ptr, width, height, threshold, noise_amount, temp_output_buffer_ptr);
        }
         DitheringAlgorithmType::SierraLite => {
            sierra_lite::sierra_lite_dither(grayscale_ptr, width, height, threshold, temp_output_buffer_ptr);
        }
        DitheringAlgorithmType::Burkes => {
            burkes::burkes_dither(grayscale_ptr, width, height, threshold, temp_output_buffer_ptr);
        }
        DitheringAlgorithmType::Stucki => {
            stucki::stucki_dither(grayscale_ptr, width, height, threshold, temp_output_buffer_ptr);
        }
        DitheringAlgorithmType::JarvisJudiceNinke => {
            jarvis_judice_ninke::jarvis_judice_ninke_dither(grayscale_ptr, width, height, threshold, temp_output_buffer_ptr);
        }
         DitheringAlgorithmType::Pattern => {
            // Assuming pattern::PatternType enum values can be passed correctly.
            // If pattern_type is passed as integer, conversion might be needed.
            pattern::pattern_dither(grayscale_ptr, width, height, pattern_type, pattern_size, temp_output_buffer_ptr);
        }
        DitheringAlgorithmType::Riemersma => {
            riemersma::riemersma_dither(grayscale_ptr, width, height, threshold, temp_output_buffer_ptr);
        }
        DitheringAlgorithmType::BlueNoise => {
            blue_noise::blue_noise_dither(grayscale_ptr, width, height, threshold, temp_output_buffer_ptr);
        }
        DitheringAlgorithmType::VoidAndCluster => {
             void_and_cluster::void_and_cluster_dither(grayscale_ptr, width, height, threshold, temp_output_buffer_ptr);
        }
        DitheringAlgorithmType::DirectBinarySearch => {
            // This one might be very slow!
            direct_binary_search::direct_binary_search_dither(grayscale_ptr, width, height, threshold, temp_output_buffer_ptr);
        }
         DitheringAlgorithmType::MultiTone => {
            multi_tone::multi_tone_dither(grayscale_ptr, width, height, multi_tone_levels, multi_tone_algo, dot_size, temp_output_buffer_ptr);
        }
        // Add cases for other algorithms here...
        // _ => { /* Handle unknown or default case, maybe fill buffer with black */ }
    }
}

// Main selective dithering function exposed to Wasm
#[wasm_bindgen]
pub fn selective_dither(
    grayscale_ptr: *const u8,
    width: usize,
    height: usize,
    // Region data passed as separate arrays (pointers)
    mask_pointers: *const *const u8, // Pointer to array of mask pointers
    algorithms: *const u32,         // Pointer to array of DitheringAlgorithmType values
    thresholds: *const u8,          // Pointer to array of thresholds
    dot_sizes: *const usize,
    spacings: *const usize,         // Added for halftone
    angles: *const f32,             // Added for halftone
    noise_amounts: *const f32,      // Added for random
    pattern_types: *const u32,      // Added for pattern (assuming PatternType passed as u32)
    pattern_sizes: *const usize,    // Added for pattern
    mt_levels: *const usize,        // Added for multi-tone levels
    mt_algos: *const u32,         // Added for multi-tone algo (assuming MultiToneAlgorithm passed as u32)
    num_regions: usize,
    // Default algorithm parameters (for non-masked areas)
    default_algorithm_type: DitheringAlgorithmType,
    default_threshold: u8,
    default_dot_size: usize,
    default_spacing: usize,
    default_angle: f32,
    default_noise_amount: f32,
    default_pattern_type: PatternType,
    default_pattern_size: usize,
    default_mt_levels: usize,
    default_mt_algo: MultiToneAlgorithm,
    // Output buffer
    output_ptr: *mut u8, // Expects RGBA buffer
) {
    if width == 0 || height == 0 { return; }
    let size = width * height;
    if size == 0 { return; }

    // Create slices from input pointers
    let output_slice = unsafe { std::slice::from_raw_parts_mut(output_ptr, size * 4) };
    let mask_pointers_slice = unsafe { std::slice::from_raw_parts(mask_pointers, num_regions) };
    let algorithms_slice = unsafe { std::slice::from_raw_parts(algorithms, num_regions) };
    let thresholds_slice = unsafe { std::slice::from_raw_parts(thresholds, num_regions) };
    let dot_sizes_slice = unsafe { std::slice::from_raw_parts(dot_sizes, num_regions) };
    let spacings_slice = unsafe { std::slice::from_raw_parts(spacings, num_regions) };
    let angles_slice = unsafe { std::slice::from_raw_parts(angles, num_regions) };
    let noise_amounts_slice = unsafe { std::slice::from_raw_parts(noise_amounts, num_regions) };
    let pattern_types_slice = unsafe { std::slice::from_raw_parts(pattern_types, num_regions) };
    let pattern_sizes_slice = unsafe { std::slice::from_raw_parts(pattern_sizes, num_regions) };
    let mt_levels_slice = unsafe { std::slice::from_raw_parts(mt_levels, num_regions) };
    let mt_algos_slice = unsafe { std::slice::from_raw_parts(mt_algos, num_regions) };


    // Map to keep track of processed pixels (0 = unprocessed, 1 = processed)
    let mut processed_map: Vec<u8> = vec![0; size];

    // Temporary buffer to store the result of each region's full dither calculation
    // Allocate once and reuse.
    let mut region_output_buffer: Vec<u8> = vec![0; size * 4];

    // --- Process Masked Regions --- 
    for i in 0..num_regions {
        let mask_ptr = mask_pointers_slice[i];
        if mask_ptr.is_null() { continue; } // Skip if mask pointer is null
        let mask_slice = unsafe { std::slice::from_raw_parts(mask_ptr, size) };

        // Convert u32 algorithm representation back to enum
        let algo_type_u32 = algorithms_slice[i];
        let algo_type: DitheringAlgorithmType = unsafe { std::mem::transmute(algo_type_u32) };
        
        // Similarly for pattern type and multi-tone algo
        let pattern_type_u32 = pattern_types_slice[i];
        let pattern_type: PatternType = unsafe { std::mem::transmute(pattern_type_u32) };
        let mt_algo_u32 = mt_algos_slice[i];
        let mt_algo: MultiToneAlgorithm = unsafe { std::mem::transmute(mt_algo_u32) };
        

        println!("Processing region {} with algorithm {:?}", i, algo_type);

        // Run the chosen algorithm on the *full* image, store in temp buffer
        run_specific_dither(
            grayscale_ptr,
            width, height,
            algo_type,
            thresholds_slice[i],
            dot_sizes_slice[i],
            spacings_slice[i],
            angles_slice[i],
            noise_amounts_slice[i],
            pattern_type, // Pass the transmuted enum
            pattern_sizes_slice[i],
            mt_levels_slice[i],
            mt_algo, // Pass the transmuted enum
            region_output_buffer.as_mut_ptr(),
        );

        // Merge the result into the final output based on the mask
        for p_idx in 0..size {
            // Mask value > 0 means apply this region's result
            // We only apply if not already processed by a previous region (first mask wins)
            if mask_slice[p_idx] > 0 && processed_map[p_idx] == 0 {
                let base_output_idx = p_idx * 4;
                let base_region_idx = p_idx * 4;
                output_slice[base_output_idx] = region_output_buffer[base_region_idx];         // R
                output_slice[base_output_idx + 1] = region_output_buffer[base_region_idx + 1]; // G
                output_slice[base_output_idx + 2] = region_output_buffer[base_region_idx + 2]; // B
                output_slice[base_output_idx + 3] = 255;                                        // A
                processed_map[p_idx] = 1; // Mark as processed
            }
        }
    }

    // --- Process Default Region (Unprocessed Pixels) --- 
    println!("Processing default region with algorithm {:?}", default_algorithm_type);

    // Run the default algorithm on the *full* image, store in temp buffer
    run_specific_dither(
        grayscale_ptr,
        width, height,
        default_algorithm_type,
        default_threshold,
        default_dot_size,
        default_spacing,
        default_angle,
        default_noise_amount,
        default_pattern_type,
        default_pattern_size,
        default_mt_levels,
        default_mt_algo,
        region_output_buffer.as_mut_ptr(),
    );

    // Merge the default result for any remaining unprocessed pixels
    for p_idx in 0..size {
        if processed_map[p_idx] == 0 { // If not processed by any region mask
            let base_output_idx = p_idx * 4;
            let base_region_idx = p_idx * 4;
            output_slice[base_output_idx] = region_output_buffer[base_region_idx];         // R
            output_slice[base_output_idx + 1] = region_output_buffer[base_region_idx + 1]; // G
            output_slice[base_output_idx + 2] = region_output_buffer[base_region_idx + 2]; // B
            output_slice[base_output_idx + 3] = 255;                                        // A
        }
    }
     println!("Selective dithering complete.");
} 