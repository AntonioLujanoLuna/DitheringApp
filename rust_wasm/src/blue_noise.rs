use rand::Rng;

// Generate a tiled blue noise pattern using a simplified Mitchell's best candidate algorithm
fn generate_blue_noise_pattern(width: usize, height: usize) -> Vec<Vec<f32>> {
    let pattern_size = 64; // Power of 2 is common
    let pattern_size_f = pattern_size as f32;
    let mut rng = rand::thread_rng();

    // --- 1. Generate Blue Noise Points using Mitchell's Best Candidate --- 
    let num_points = (pattern_size * pattern_size) / 10; // ~10% density
    let candidates_per_point = 20; // More candidates = better quality but slower
    let mut points: Vec<(usize, usize)> = Vec::with_capacity(num_points);
    let mut point_map = vec![vec![false; pattern_size]; pattern_size]; // Faster lookup

    // Place the first point
    if num_points > 0 {
        let first_x = rng.gen_range(0..pattern_size);
        let first_y = rng.gen_range(0..pattern_size);
        points.push((first_x, first_y));
        point_map[first_y][first_x] = true;
    }

    // Place remaining points
    for _ in 1..num_points {
        let mut best_candidate: Option<(usize, usize)> = None;
        let mut best_dist_sq = 0.0f32;

        for _ in 0..candidates_per_point {
            let cand_x = rng.gen_range(0..pattern_size);
            let cand_y = rng.gen_range(0..pattern_size);

            if point_map[cand_y][cand_x] { continue; } // Already occupied

            let mut min_dist_sq = f32::MAX;

            // Find distance to nearest existing point (toroidal)
            for &(px, py) in &points {
                let dx = (cand_x as f32 - px as f32).abs();
                let dy = (cand_y as f32 - py as f32).abs();
                
                // Toroidal distance calculation
                let toroidal_dx = dx.min(pattern_size_f - dx);
                let toroidal_dy = dy.min(pattern_size_f - dy);
                
                let dist_sq = toroidal_dx * toroidal_dx + toroidal_dy * toroidal_dy;
                min_dist_sq = min_dist_sq.min(dist_sq);
            }

            // If this candidate is farther from existing points than the current best
            if min_dist_sq > best_dist_sq {
                best_dist_sq = min_dist_sq;
                best_candidate = Some((cand_x, cand_y));
            }
        }

        if let Some((bx, by)) = best_candidate {
            points.push((bx, by));
            point_map[by][bx] = true;
        }
    }

    // --- 2. Create Distance Field --- 
    let mut distance_field = vec![vec![f32::MAX; pattern_size]; pattern_size];
    let mut max_distance = 0.0f32;

    for y in 0..pattern_size {
        for x in 0..pattern_size {
            let mut min_dist_sq = f32::MAX;
            for &(px, py) in &points {
                 let dx = (x as f32 - px as f32).abs();
                 let dy = (y as f32 - py as f32).abs();
                 let toroidal_dx = dx.min(pattern_size_f - dx);
                 let toroidal_dy = dy.min(pattern_size_f - dy);
                 let dist_sq = toroidal_dx * toroidal_dx + toroidal_dy * toroidal_dy;
                 min_dist_sq = min_dist_sq.min(dist_sq);
            }
            let distance = min_dist_sq.sqrt();
            distance_field[y][x] = distance;
            max_distance = max_distance.max(distance);
        }
    }

    // --- 3. Normalize Distance Field --- 
    let mut normalized_field = vec![vec![0.0f32; pattern_size]; pattern_size];
    if max_distance > 0.0 {
        for y in 0..pattern_size {
            for x in 0..pattern_size {
                normalized_field[y][x] = distance_field[y][x] / max_distance;
            }
        }
    }

    // --- 4. Tile the Normalized Pattern --- 
    let mut tiled_pattern = vec![vec![0.0f32; width]; height];
    for y in 0..height {
        for x in 0..width {
            tiled_pattern[y][x] = normalized_field[y % pattern_size][x % pattern_size];
        }
    }

    tiled_pattern
}

pub fn blue_noise_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    let size = width * height;
    let input = unsafe { std::slice::from_raw_parts(input_ptr, size) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, size * 4) }; // RGBA output
    let threshold_f = threshold as f32;

    // Generate the blue noise pattern (tiled to image dimensions)
    let noise_pattern = generate_blue_noise_pattern(width, height);

    for y in 0..height {
        for x in 0..width {
            let idx = y * width + x;
            let pixel = input[idx] as f32;

            // Get noise value (0.0 to 1.0)
            let noise_value = noise_pattern[y][x]; 

            // Apply blue noise: Add noise scaled to -128..127 range (approx)
            // Adjust the formula from TS slightly as noise_value is 0-1 here
            let noised_pixel = pixel + (noise_value * 255.0 - 128.0) * 0.5; // Strength factor 0.5

            // Clamp and apply threshold
            let clamped_pixel = noised_pixel.max(0.0).min(255.0);
            let new_pixel_value = if clamped_pixel < threshold_f { 0 } else { 255 };

            // Write RGBA output pixel
            let base_idx_out = idx * 4;
            output[base_idx_out] = new_pixel_value;
            output[base_idx_out + 1] = new_pixel_value;
            output[base_idx_out + 2] = new_pixel_value;
            output[base_idx_out + 3] = 255; // Alpha
        }
    }
}
