"""use wasm_bindgen::prelude::*;
use std::f32::consts::PI;

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PatternType {
    Dots,
    Lines,
    Crosses,
    Diamonds,
    Waves,
    Bricks,
    Custom, // Represents a default pattern for now
}

// Main pattern dithering function
pub fn pattern_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    pattern_type: PatternType,
    pattern_size: usize,
    output_ptr: *mut u8,
) {
    let size = width * height;
    let input = unsafe { std::slice::from_raw_parts(input_ptr, size) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, size * 4) }; // RGBA output

    // Get the pattern matrix
    let pattern = get_pattern_matrix(pattern_type, pattern_size);
    let pattern_height = pattern.len();
    if pattern_height == 0 { return; } // Avoid panic if pattern is empty
    let pattern_width = pattern[0].len();
    if pattern_width == 0 { return; } // Avoid panic if pattern row is empty

    for y in 0..height {
        for x in 0..width {
            let idx = y * width + x;
            let pixel = input[idx] as f32;

            // Get the pattern threshold for this position
            let pattern_x = x % pattern_width;
            let pattern_y = y % pattern_height;
            let pattern_threshold = pattern[pattern_y][pattern_x] * 255.0;

            // Apply threshold
            let new_pixel_value = if pixel < pattern_threshold { 0 } else { 255 };

            // Write RGBA output pixel
            let base_idx_out = idx * 4;
            output[base_idx_out] = new_pixel_value;     // R
            output[base_idx_out + 1] = new_pixel_value; // G
            output[base_idx_out + 2] = new_pixel_value; // B
            output[base_idx_out + 3] = 255;             // A
        }
    }
}

// Get the pattern matrix based on type and size
fn get_pattern_matrix(pattern_type: PatternType, size: usize) -> Vec<Vec<f32>> {
    // Ensure size is at least 1 to avoid division by zero or empty patterns
    let size = size.max(1);
    match pattern_type {
        PatternType::Dots => create_dot_pattern(size),
        PatternType::Lines => create_line_pattern(size),
        PatternType::Crosses => create_cross_pattern(size),
        PatternType::Diamonds => create_diamond_pattern(size),
        PatternType::Waves => create_wave_pattern(size),
        PatternType::Bricks => create_brick_pattern(size),
        PatternType::Custom => create_custom_pattern(size), // Default custom pattern
    }
}

// --- Pattern Creation Functions ---

fn create_dot_pattern(size: usize) -> Vec<Vec<f32>> {
    let mut pattern = vec![vec![0.0; size]; size];
    let size_f = size as f32;
    for y in 0..size {
        for x in 0..size {
            let dx = (x as f32 + 0.5) / size_f - 0.5;
            let dy = (y as f32 + 0.5) / size_f - 0.5;
            let distance = (dx * dx + dy * dy).sqrt() * 2.0;
            pattern[y][x] = distance.min(1.0);
        }
    }
    pattern
}

fn create_line_pattern(size: usize) -> Vec<Vec<f32>> {
    let mut pattern = vec![vec![0.0; size]; size];
    let size_f = size as f32;
    for y in 0..size {
        for x in 0..size {
            pattern[y][x] = y as f32 / size_f;
        }
    }
    pattern
}

fn create_cross_pattern(size: usize) -> Vec<Vec<f32>> {
    let mut pattern = vec![vec![0.0; size]; size];
    let size_f = size as f32;
    for y in 0..size {
        for x in 0..size {
            let dist_h = ((y as f32 + 0.5) / size_f - 0.5).abs() * 2.0;
            let dist_v = ((x as f32 + 0.5) / size_f - 0.5).abs() * 2.0;
            pattern[y][x] = dist_h.min(dist_v);
        }
    }
    pattern
}

fn create_diamond_pattern(size: usize) -> Vec<Vec<f32>> {
    let mut pattern = vec![vec![0.0; size]; size];
    let size_f = size as f32;
    for y in 0..size {
        for x in 0..size {
            let dx = ((x as f32 + 0.5) / size_f - 0.5).abs();
            let dy = ((y as f32 + 0.5) / size_f - 0.5).abs();
            let distance = (dx + dy) * 2.0; // Manhattan distance normalized
            pattern[y][x] = distance.min(1.0);
        }
    }
    pattern
}

fn create_wave_pattern(size: usize) -> Vec<Vec<f32>> {
    let mut pattern = vec![vec![0.0; size]; size];
    let size_f = size as f32;
    for y in 0..size {
        for x in 0..size {
            let normalized = (x as f32 + y as f32) / size_f;
            let wave = (normalized * PI * 2.0).sin() * 0.5 + 0.5; // Normalize sin to 0-1
            pattern[y][x] = wave;
        }
    }
    pattern
}

fn create_brick_pattern(size: usize) -> Vec<Vec<f32>> {
    let mut pattern = vec![vec![0.0; size]; size];
    let size_f = size as f32;
    let brick_height = (size_f / 3.0).floor().max(2.0) as usize;
    let brick_height_f = brick_height as f32;
    let half_width = (size_f / 2.0).floor() as usize;
    let half_width_f = half_width as f32;
    let edge_scale = size_f / 10.0; // Adjust sensitivity to edges

    for y in 0..size {
        let row = (y as f32 / brick_height_f).floor() as usize;
        let offset = (row % 2) * half_width; // Offset every other row

        for x in 0..size {
            let adjusted_x = (x + offset) % size;
            let brick_x_start = (adjusted_x as f32 / half_width_f).floor() * half_width_f;

            // Distance to nearest vertical edge
            let dist_x1 = (adjusted_x as f32 - brick_x_start).abs();
            let dist_x2 = (adjusted_x as f32 - (brick_x_start + half_width_f - 1.0)).abs();
            let edge_dist_x = dist_x1.min(dist_x2);

            // Distance to nearest horizontal edge
            let brick_y_start = (y as f32 / brick_height_f).floor() * brick_height_f;
            let dist_y1 = (y as f32 - brick_y_start).abs();
            let dist_y2 = (y as f32 - (brick_y_start + brick_height_f - 1.0)).abs();
            let edge_dist_y = dist_y1.min(dist_y2);

            let edge_dist = edge_dist_x.min(edge_dist_y) / edge_scale;

            // Higher value (threshold) near edges
            pattern[y][x] = (1.0 - edge_dist).max(0.0).min(1.0);
        }
    }
    pattern
}

// Default "custom" pattern (checkerboard)
fn create_custom_pattern(size: usize) -> Vec<Vec<f32>> {
    let mut pattern = vec![vec![0.0; size]; size];
    for y in 0..size {
        for x in 0..size {
            pattern[y][x] = if (x + y) % 2 == 0 { 0.25 } else { 0.75 };
        }
    }
    pattern
}

"" 