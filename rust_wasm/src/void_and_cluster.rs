use rand::Rng;
use std::f32::consts::E;

// Initialize a random binary pattern (0 or 1) with approximately percent_ones density
fn initialize_random_pattern(width: usize, height: usize, percent_ones: f32) -> Vec<Vec<u8>> {
    let mut pattern = vec![vec![0u8; width]; height];
    let num_ones = (width as f32 * height as f32 * percent_ones).floor() as usize;
    let mut rng = rand::thread_rng();
    let mut ones_placed = 0;

    while ones_placed < num_ones {
        let x = rng.gen_range(0..width);
        let y = rng.gen_range(0..height);
        if pattern[y][x] == 0 {
            pattern[y][x] = 1;
            ones_placed += 1;
        }
    }
    pattern
}

// Calculate the cluster value for a pixel using Gaussian blur (toroidal)
fn calculate_cluster_value(
    pattern: &[Vec<u8>],
    x: usize, y: usize,
    width: usize, height: usize,
    radius: isize,
    gaussian_weights: &[Vec<f32>]
) -> f32 {
    let mut sum = 0.0;
    let radius_f = radius as f32;

    for dy in -radius..=radius {
        for dx in -radius..=radius {
            if dx == 0 && dy == 0 { continue; }

            let nx = (x as isize + dx + width as isize) as usize % width; // Wrap around X
            let ny = (y as isize + dy + height as isize) as usize % height; // Wrap around Y

            // Use precalculated weight
            let weight = gaussian_weights[(dy + radius) as usize][(dx + radius) as usize];
            sum += pattern[ny][nx] as f32 * weight;
        }
    }
    sum
}

// Precalculate Gaussian weights for the cluster calculation
fn precalculate_gaussian_weights(radius: isize) -> Vec<Vec<f32>> {
    let diameter = (radius * 2 + 1) as usize;
    let mut weights = vec![vec![0.0; diameter]; diameter];
    let radius_f = radius as f32;
    let variance = radius_f * radius_f; // Simple variance estimate

    for dy in -radius..=radius {
        for dx in -radius..=radius {
            if dx == 0 && dy == 0 { continue; }
            let dist_sq = (dx * dx + dy * dy) as f32;
            let weight = E.powf(-dist_sq / (2.0 * variance));
            weights[(dy + radius) as usize][(dx + radius) as usize] = weight;
        }
    }
    weights
}


// Find the pixel with the minimum cluster value (largest void)
fn find_largest_void(
    pattern: &[Vec<u8>],
    width: usize, height: usize,
    radius: isize,
    gaussian_weights: &[Vec<f32>]
) -> (usize, usize) {
    let mut min_cluster_value = f32::MAX;
    let mut void_pos = (0, 0);

    for y in 0..height {
        for x in 0..width {
            if pattern[y][x] == 0 {
                let cluster_value = calculate_cluster_value(pattern, x, y, width, height, radius, gaussian_weights);
                if cluster_value < min_cluster_value {
                    min_cluster_value = cluster_value;
                    void_pos = (x, y);
                }
            }
        }
    }
    void_pos
}

// Find the pixel with the maximum cluster value (tightest cluster)
fn find_tightest_cluster(
    pattern: &[Vec<u8>],
    width: usize, height: usize,
    radius: isize,
    gaussian_weights: &[Vec<f32>]
) -> (usize, usize) {
    let mut max_cluster_value = -f32::MAX;
    let mut cluster_pos = (0, 0);

    for y in 0..height {
        for x in 0..width {
            if pattern[y][x] == 1 {
                 let cluster_value = calculate_cluster_value(pattern, x, y, width, height, radius, gaussian_weights);
                if cluster_value > max_cluster_value {
                    max_cluster_value = cluster_value;
                    cluster_pos = (x, y);
                }
            }
        }
    }
    cluster_pos
}

// Generate the Void-and-Cluster dither matrix
fn generate_void_and_cluster_matrix(matrix_size: usize) -> Vec<Vec<f32>> {
    if matrix_size == 0 { return vec![]; }

    let mut working_pattern = initialize_random_pattern(matrix_size, matrix_size, 0.5);
    let mut rank_matrix = vec![vec![0usize; matrix_size]; matrix_size];
    let total_pixels = matrix_size * matrix_size;
    let mut binary_count = working_pattern.iter().flatten().filter(|&&p| p == 1).count();
    let mut rank = 0;
    let radius = 2; // Gaussian radius
    let gaussian_weights = precalculate_gaussian_weights(radius);


    // Phase 1: Void Identification (Place 1s in largest voids)
    while binary_count < total_pixels {
        let (vx, vy) = find_largest_void(&working_pattern, matrix_size, matrix_size, radius, &gaussian_weights);
        if working_pattern[vy][vx] == 0 { // Ensure we haven't somehow already filled it
             rank_matrix[vy][vx] = rank;
             working_pattern[vy][vx] = 1;
             binary_count += 1;
             rank += 1;
        } else {
            // This case should ideally not happen if logic is correct, 
            // but break to prevent infinite loop if it does.
             eprintln!("Warning: Tried to fill an already filled void.");
            break;
        }
    }

    // Reset rank for cluster phase (ranking continues from total_pixels down to 1)
    rank = total_pixels - 1; // Start ranking clusters from the end

    // Phase 2: Cluster Identification (Remove 1s from tightest clusters)
    while binary_count > 0 {
         let (cx, cy) = find_tightest_cluster(&working_pattern, matrix_size, matrix_size, radius, &gaussian_weights);
         if working_pattern[cy][cx] == 1 { // Ensure it's a cluster
            rank_matrix[cy][cx] = rank; // Assign rank
            working_pattern[cy][cx] = 0; // Remove the cluster point
            binary_count -= 1;
            if rank > 0 { // Prevent underflow
                 rank -= 1;
            }
         } else {
             eprintln!("Warning: Tried to remove a non-existent cluster.");
             break;
         }
    }

    // Normalize the rank matrix to 0.0 - 1.0
    let total_ranks_f = (total_pixels as f32).max(1.0) - 1.0; // Avoid division by zero
    let normalized_matrix: Vec<Vec<f32>> = rank_matrix
        .iter()
        .map(|row| {
            row.iter()
               .map(|&r| r as f32 / total_ranks_f)
               .collect()
        })
        .collect();

    normalized_matrix
}


pub fn void_and_cluster_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    _threshold: u8, // Threshold not used directly, matrix provides thresholds
    output_ptr: *mut u8,
) {
    let size = width * height;
    let input = unsafe { std::slice::from_raw_parts(input_ptr, size) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, size * 4) }; // RGBA output

    // Generate or load the dither matrix (using a fixed size for now)
    let matrix_size = 32;
    let dither_matrix = generate_void_and_cluster_matrix(matrix_size);

    if dither_matrix.is_empty() || dither_matrix[0].is_empty() {
         eprintln!("Error: Void and Cluster matrix generation failed.");
         // Optional: Fill output with black or a default pattern
        for i in 0..size {
            let base_idx_out = i * 4;
            output[base_idx_out] = 0;
            output[base_idx_out + 1] = 0;
            output[base_idx_out + 2] = 0;
            output[base_idx_out + 3] = 255;
        }
        return;
    }

    let matrix_height = dither_matrix.len();
    let matrix_width = dither_matrix[0].len();

    for y in 0..height {
        for x in 0..width {
            let idx = y * width + x;
            let pixel = input[idx] as f32;

            // Get threshold from the tiled dither matrix
            let matrix_y = y % matrix_height;
            let matrix_x = x % matrix_width;
            let matrix_threshold = dither_matrix[matrix_y][matrix_x] * 255.0;

            // Apply threshold
            let new_pixel_value = if pixel < matrix_threshold { 0 } else { 255 };

            // Write RGBA output pixel
            let base_idx_out = idx * 4;
            output[base_idx_out] = new_pixel_value;
            output[base_idx_out + 1] = new_pixel_value;
            output[base_idx_out + 2] = new_pixel_value;
            output[base_idx_out + 3] = 255; // Alpha
        }
    }
} 