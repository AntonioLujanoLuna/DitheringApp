use wasm_bindgen::prelude::*;
use rand::Rng;

// --- Enums --- 

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MultiToneAlgorithm {
    Ordered,
    ErrorDiffusion,
    BlueNoise,
}

// --- Helper Functions --- 

// Generate the target gray levels (e.g., [0, 85, 170, 255] for levels=3)
fn generate_tone_values(levels: usize) -> Vec<u8> {
    if levels == 0 { return vec![0, 255]; } // Handle edge case
    let mut values = Vec::with_capacity(levels + 1);
    for i in 0..=levels {
        // Ensure division is correct even for levels=1 (gives [0, 255])
        let val = ((i as f32 / levels as f32) * 255.0).round() as u8;
        values.push(val);
    }
    values
}

// Generate thresholds between tone values (e.g., [64, 128, 192] for levels=3)
fn generate_thresholds(levels: usize) -> Vec<f32> {
    if levels == 0 { return vec![128.0]; } // Midpoint for binary case
    let mut thresholds = Vec::with_capacity(levels);
    let num_intervals = levels + 1;
    for i in 1..=levels {
        // Place threshold in the middle of the intervals defined by tone values
        let threshold = ((i as f32 / num_intervals as f32) * 255.0).round();
        thresholds.push(threshold);
    }
    thresholds
}

// Generate a Bayer dither matrix recursively and normalize to 0-1
fn generate_bayer_matrix_recursive(n: usize) -> Vec<Vec<f32>> {
    // Base case: 2x2 matrix
    if n <= 2 {
        return vec![
            vec![0.0 / 3.0, 2.0 / 3.0], // Use max_value = n*n - 1 = 3
            vec![3.0 / 3.0, 1.0 / 3.0],
        ];
    }

    // Ensure size is power of 2
    let power = (n as f32).log2().ceil() as u32;
    let size = 1 << power;
    let mut matrix = vec![vec![0.0; size]; size];
    let sub_matrix = generate_bayer_matrix_recursive(size / 2);
    let sub_size = size / 2;

    for y in 0..sub_size {
        for x in 0..sub_size {
            let sub_val = sub_matrix[y][x];
            // Un-normalize the sub-value based on its own max value
            let sub_max_val = (sub_size * sub_size) as f32 - 1.0;
            let unnormalized_sub = sub_val * sub_max_val;

            // Fill the four quadrants
            matrix[y][x] = unnormalized_sub * 4.0;
            matrix[y][x + sub_size] = unnormalized_sub * 4.0 + 2.0;
            matrix[y + sub_size][x] = unnormalized_sub * 4.0 + 3.0;
            matrix[y + sub_size][x + sub_size] = unnormalized_sub * 4.0 + 1.0;
        }
    }

    // Normalize the final matrix
    let max_value = (size * size) as f32 - 1.0;
    if max_value > 0.0 {
         for y in 0..size {
             for x in 0..size {
                matrix[y][x] /= max_value;
            }
        }
    }

    matrix
}

// Generate a simple blue noise pattern using random init + relaxation (as per TS)
// This is different and simpler than the one in blue_noise.rs
fn generate_blue_noise_matrix_simple(pattern_size: usize) -> Vec<Vec<f32>> {
    if pattern_size == 0 { return vec![]; }
    let mut rng = rand::thread_rng();
    let mut noise = vec![vec![0.0f32; pattern_size]; pattern_size];

    // Initialize with random values
    for y in 0..pattern_size {
        for x in 0..pattern_size {
            noise[y][x] = rng.gen();
        }
    }

    // Apply simple relaxation
    let radius = 2;
    for _iter in 0..5 { // Few relaxation iterations
        let mut next_noise = noise.clone();
        for y in 0..pattern_size {
            for x in 0..pattern_size {
                let mut sum = 0.0;
                let mut count = 0;

                for dy in -radius..=radius {
                    for dx in -radius..=radius {
                        if dx == 0 && dy == 0 { continue; }
                        let ny = (y as isize + dy + pattern_size as isize) as usize % pattern_size;
                        let nx = (x as isize + dx + pattern_size as isize) as usize % pattern_size;
                        sum += noise[ny][nx];
                        count += 1;
                    }
                }

                if count > 0 {
                    let avg = sum / count as f32;
                    // Adjust pixel towards opposite of local average, clamp/wrap to [0, 1)
                    let adjustment = (noise[y][x] + (0.5 - avg) * 0.2).rem_euclid(1.0);
                    next_noise[y][x] = adjustment;
                }
            }
        }
        noise = next_noise;
    }

    noise
}

// --- Main Multi-Tone Dithering Function ---

#[wasm_bindgen]
pub fn multi_tone_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    levels: usize, // Number of intermediate levels (e.g., 3 means 4 total tones: 0, 1, 2, 3)
    algorithm: MultiToneAlgorithm,
    dot_size: usize, // Only used for Ordered algorithm
    output_ptr: *mut u8,
) {
    if width == 0 || height == 0 || levels > 255 { return; }
    let size = width * height;
    let input = unsafe { std::slice::from_raw_parts(input_ptr, size) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, size * 4) }; // RGBA output

    let tone_values = generate_tone_values(levels);
    let thresholds = generate_thresholds(levels);
    let num_tone_values = tone_values.len(); // levels + 1

    match algorithm {
        MultiToneAlgorithm::Ordered => {
            let matrix = generate_bayer_matrix_recursive(dot_size);
            let matrix_size = matrix.len();
            if matrix_size == 0 { return; } // Avoid panic
            let matrix_width = matrix[0].len();
            if matrix_width == 0 { return; }
            let threshold_range = 255.0 / num_tone_values as f32; // Range affected by matrix

            for y in 0..height {
                for x in 0..width {
                    let idx = y * width + x;
                    let pixel = input[idx] as f32;
                    
                    let matrix_val = matrix[y % matrix_size][x % matrix_width];
                    // Adjust pixel value based on matrix (higher matrix value makes it harder to cross threshold)
                    let adjusted_pixel = pixel - (matrix_val * threshold_range) + (threshold_range / 2.0); // Center adjustment

                    // Find the appropriate tone level by checking thresholds
                    let mut tone_idx = 0;
                    for (i, &thresh) in thresholds.iter().enumerate() {
                        if adjusted_pixel >= thresh {
                            tone_idx = i + 1;
                        } else {
                            break; // Thresholds are sorted
                        }
                    }

                    let new_pixel = tone_values[tone_idx];
                    let base_idx_out = idx * 4;
                    output[base_idx_out] = new_pixel;
                    output[base_idx_out + 1] = new_pixel;
                    output[base_idx_out + 2] = new_pixel;
                    output[base_idx_out + 3] = 255;
                }
            }
        }

        MultiToneAlgorithm::ErrorDiffusion => {
            let mut buffer: Vec<f32> = input.iter().map(|&p| p as f32).collect();

            for y in 0..height {
                for x in 0..width {
                    let idx = y * width + x;
                    let pixel_val = buffer[idx];

                    // Find the closest tone value
                    let mut closest_tone = tone_values[0];
                    let mut min_dist = (pixel_val - closest_tone as f32).abs();

                    for &tone in tone_values.iter().skip(1) {
                        let dist = (pixel_val - tone as f32).abs();
                        if dist < min_dist {
                            min_dist = dist;
                            closest_tone = tone;
                        }
                    }

                    let error = pixel_val - closest_tone as f32;

                    // Write output pixel
                    let base_idx_out = idx * 4;
                    output[base_idx_out] = closest_tone;
                    output[base_idx_out + 1] = closest_tone;
                    output[base_idx_out + 2] = closest_tone;
                    output[base_idx_out + 3] = 255;

                    // Distribute error (Floyd-Steinberg)
                    if x + 1 < width {
                        buffer[idx + 1] += error * (7.0 / 16.0);
                    }
                    if y + 1 < height {
                        if x > 0 {
                            buffer[idx + width - 1] += error * (3.0 / 16.0);
                        }
                        buffer[idx + width] += error * (5.0 / 16.0);
                        if x + 1 < width {
                            buffer[idx + width + 1] += error * (1.0 / 16.0);
                        }
                    }
                }
            }
        }

         MultiToneAlgorithm::BlueNoise => {
            let pattern_size = 64; // Match TS example
            let noise_matrix = generate_blue_noise_matrix_simple(pattern_size);
            if noise_matrix.is_empty() || noise_matrix[0].is_empty() { return; }
            let threshold_range = 255.0 / num_tone_values as f32;

             for y in 0..height {
                for x in 0..width {
                    let idx = y * width + x;
                    let pixel = input[idx] as f32;
                    
                    let noise_val = noise_matrix[y % pattern_size][x % pattern_size]; // Noise is 0-1
                    // Adjust pixel value based on noise
                    let adjusted_pixel = pixel - (noise_val * threshold_range) + (threshold_range / 2.0);

                    // Find the appropriate tone level by checking thresholds
                    let mut tone_idx = 0;
                    for (i, &thresh) in thresholds.iter().enumerate() {
                        if adjusted_pixel >= thresh {
                            tone_idx = i + 1;
                        } else {
                            break;
                        }
                    }

                    let new_pixel = tone_values[tone_idx];
                    let base_idx_out = idx * 4;
                    output[base_idx_out] = new_pixel;
                    output[base_idx_out + 1] = new_pixel;
                    output[base_idx_out + 2] = new_pixel;
                    output[base_idx_out + 3] = 255;
                }
            }
        }
    }
} 