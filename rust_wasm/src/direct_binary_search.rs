use rand::Rng;
use std::f32::consts::E;

// --- Data Structures ---

struct ErrorMetrics {
    total_error: f64, // Use f64 for accumulated error precision
    // filtered_target: Vec<f32>, // Target filtered once - can be computed directly in error calc?
    // For simplicity matching TS, let's calculate error against unfiltered target but use HVS in error change calc.
    // A more advanced version would filter the target once.
    filtered_output: Vec<f32>,
}

// --- HVS Filter --- 

fn create_hvs_filter(size: usize) -> (Vec<f32>, usize) {
    if size == 0 || size % 2 == 0 { 
        // Default to a minimal 3x3 if size is invalid
        let radius = 1;
        let size = 3;
        let sigma = radius as f32 / 2.0; // Adjust sigma based on radius
        let mut filter = vec![0.0; size * size];
        let mut sum = 0.0;

        for y in 0..size {
            for x in 0..size {
                let dx = x as isize - radius as isize;
                let dy = y as isize - radius as isize;
                let dist_sq = (dx * dx + dy * dy) as f32;
                let weight = E.powf(-dist_sq / (2.0 * sigma * sigma));
                filter[y * size + x] = weight;
                sum += weight;
            }
        }
         // Normalize
        if sum > 0.0 {
            for val in filter.iter_mut() {
                *val /= sum;
            }
        }
        return (filter, radius);
    }

    let radius = size / 2;
    let sigma = radius as f32 / 2.5; // As per TS code
    let mut filter = vec![0.0; size * size];
    let mut sum = 0.0;

    for y in 0..size {
        for x in 0..size {
            let dx = x as isize - radius as isize;
            let dy = y as isize - radius as isize;
            let dist_sq = (dx * dx + dy * dy) as f32;
            let weight = E.powf(-dist_sq / (2.0 * sigma * sigma));
            filter[y * size + x] = weight;
            sum += weight;
        }
    }

    // Normalize
    if sum > 0.0 {
        for val in filter.iter_mut() {
            *val /= sum;
        }
    }

    (filter, radius)
}

// --- Precomputation (Memory Intensive!) ---

// Represents the effect of the HVS filter centered at a specific pixel.
// NOTE: This function allocates a potentially huge amount of memory:
// num_pixels * num_pixels * sizeof(f32). 
// E.g., 512x512 image -> ~275 GB!
// This is likely infeasible for typical WASM use cases without significant optimization
// or a different DBS approach that avoids storing all basis functions explicitly.
fn precompute_filtered_basis_functions(
    width: usize, 
    height: usize, 
    filter_size: usize, 
    filter: &[f32],
    radius: usize
) -> Vec<Vec<f32>> { // Outer Vec: pixel index, Inner Vec: effect on all pixels
    let num_pixels = width * height;
    // Initialize with sparse representation potentially?
    // For now, stick to the dense version as implied by TS, but comment heavily.
    let mut all_filtered_basis = vec![vec![0.0f32; num_pixels]; num_pixels]; 

    for y in 0..height {
        for x in 0..width {
            let center_idx = y * width + x;
            let mut current_basis = vec![0.0f32; num_pixels]; // Effect of toggling pixel (x, y)

            for fy_offset in 0..filter_size {
                for fx_offset in 0..filter_size {
                    let filter_idx = fy_offset * filter_size + fx_offset;
                    let filter_weight = filter[filter_idx];
                    if filter_weight == 0.0 { continue; }

                    // Calculate the image coordinates (nx, ny) affected by this filter element
                    let nx = x as isize + fx_offset as isize - radius as isize;
                    let ny = y as isize + fy_offset as isize - radius as isize;

                    // Check bounds
                    if nx >= 0 && nx < width as isize && ny >= 0 && ny < height as isize {
                        let affected_idx = (ny as usize) * width + (nx as usize);
                        // The value stored is the filter weight at that relative position
                        current_basis[affected_idx] = filter_weight;
                    }
                }
            }
            all_filtered_basis[center_idx] = current_basis;
        }
    }

    all_filtered_basis
}


// --- Error Calculation & Updates ---

// Calculates the initial error metrics based on the initial pattern.
// This involves effectively filtering the initial binary pattern.
fn calculate_initial_error_metrics(
    target_image: &[f32],
    binary_pattern: &[u8],
    width: usize,
    height: usize,
    all_filtered_basis: &[Vec<f32>], // Borrow precomputed basis functions
) -> ErrorMetrics {
    let num_pixels = width * height;
    let mut filtered_output = vec![0.0f32; num_pixels];
    let mut total_error: f64 = 0.0;

    // Build the initial filtered output based on the binary pattern
    for i in 0..num_pixels {
        if binary_pattern[i] == 1 {
            let basis = &all_filtered_basis[i];
            for j in 0..num_pixels {
                 // This loop is the core of applying the precomputed filter effects
                filtered_output[j] += basis[j] * 255.0; 
            }
        }
    }

    // Calculate initial squared error against the *original* target 
    // (Simpler than filtering target, error change calc handles HVS weighting)
    for i in 0..num_pixels {
        let error = target_image[i] - filtered_output[i];
        total_error += (error * error) as f64;
    }

    ErrorMetrics {
        total_error,
        filtered_output,
    }
}

// Efficiently calculate the change in total squared error if pixel (x, y) is toggled.
fn calculate_toggle_error_change(
    target_image: &[f32],
    binary_pattern: &[u8],
    x: usize, y: usize,
    width: usize, 
    _height: usize, // Height unused but kept for consistency
    all_filtered_basis: &[Vec<f32>],
    current_metrics: &ErrorMetrics,
) -> f64 {
    let idx = y * width + x;
    let basis = &all_filtered_basis[idx]; // Get the precomputed effect of toggling this pixel
    let num_pixels = target_image.len();

    let current_value = binary_pattern[idx];
    let value_diff = if current_value == 0 { 255.0 } else { -255.0 }; // Change in pixel value (0->255 or 1->0)

    let mut error_change: f64 = 0.0;

    // Formula derived from difference of squares: NewError^2 - OldError^2
    // NewError = Target - (FilteredOutput + Basis * ValueDiff)
    // OldError = Target - FilteredOutput
    // Change = sum( (OldError - Basis*ValueDiff)^2 - OldError^2 )
    // Change = sum( OldError^2 - 2*OldError*Basis*ValueDiff + (Basis*ValueDiff)^2 - OldError^2 )
    // Change = sum( -2 * OldError * Basis * ValueDiff + (Basis * ValueDiff)^2 )

    for i in 0..num_pixels {
        if basis[i] == 0.0 { continue; } // Optimization: Skip pixels unaffected by the toggle

        let old_error_pixel = target_image[i] - current_metrics.filtered_output[i];
        let basis_effect = basis[i] * value_diff;
        
        let term1 = -2.0 * old_error_pixel * basis_effect;
        let term2 = basis_effect * basis_effect;

        error_change += (term1 + term2) as f64;
    }

    error_change
}

// Update the error metrics after a successful toggle
fn update_error_metrics_after_toggle(
    metrics: &mut ErrorMetrics,
    error_change: f64,
    toggled_idx: usize,
    value_diff: f32, // +255.0 if 0->1, -255.0 if 1->0
    all_filtered_basis: &[Vec<f32>],
) {
    metrics.total_error += error_change;
    
    // Update the filtered output image - crucial for next error change calculation
    let basis = &all_filtered_basis[toggled_idx];
    for i in 0..metrics.filtered_output.len() {
        if basis[i] != 0.0 {
             metrics.filtered_output[i] += basis[i] * value_diff;
        }
    }
}

// --- Main DBS Function ---

pub fn direct_binary_search_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    if width == 0 || height == 0 { return; }
    let size = width * height;
    let input = unsafe { std::slice::from_raw_parts(input_ptr, size) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, size * 4) }; // RGBA output

    // 1. Initial Binary Pattern (Thresholding)
    let mut binary_pattern: Vec<u8> = input.iter().map(|&p| if p < threshold { 0 } else { 1 }).collect();
    let target_image: Vec<f32> = input.iter().map(|&p| p as f32).collect();

    // 2. HVS Filter
    let filter_size = 7; // Match TS
    let (hvs_filter, radius) = create_hvs_filter(filter_size);

    // 3. Precompute Filtered Basis Functions (Potentially HUGE memory allocation)
    // Add checks or alternative strategies for large images in real applications.
    println!("DBS: Starting basis function precomputation (may use significant memory)... Width: {}, Height: {}", width, height);
    let all_filtered_basis = precompute_filtered_basis_functions(width, height, filter_size, &hvs_filter, radius);
    println!("DBS: Basis function precomputation complete.");

    // 4. Initial Error Calculation
    println!("DBS: Calculating initial error metrics...");
    let mut current_metrics = calculate_initial_error_metrics(&target_image, &binary_pattern, width, height, &all_filtered_basis);
    println!("DBS: Initial Total Error: {}", current_metrics.total_error);

    // 5. DBS Iterative Optimization
    let max_iterations = 10; // Fewer iterations than TS for potentially faster WASM execution
    let min_improvement_threshold = 0.001; // Stop if improvement is negligible
    let swap_candidates_per_iter = (width * height).min(5000); // Limit candidates
    let mut rng = rand::thread_rng();

    println!("DBS: Starting optimization iterations...");
    for iter in 0..max_iterations {
        let mut changes_in_iteration = 0;
        let error_before_iter = current_metrics.total_error;

        for _ in 0..swap_candidates_per_iter {
            // Pick random pixel to potentially toggle
            let x = rng.gen_range(0..width);
            let y = rng.gen_range(0..height);
            let idx = y * width + x;

            // Calculate the potential error change
            let error_change = calculate_toggle_error_change(
                &target_image, &binary_pattern, 
                x, y, width, height, 
                &all_filtered_basis, &current_metrics
            );

            // If toggling reduces error, accept the change
            if error_change < 0.0 {
                let current_value = binary_pattern[idx];
                let value_diff = if current_value == 0 { 255.0 } else { -255.0 };
                
                // Update binary pattern
                binary_pattern[idx] = 1 - current_value; // Toggle 0 <-> 1
                
                // Update error metrics
                update_error_metrics_after_toggle(&mut current_metrics, error_change, idx, value_diff, &all_filtered_basis);
                changes_in_iteration += 1;
            }
        }

        let error_after_iter = current_metrics.total_error;
        println!("DBS: Iteration {}, Changes: {}, Error: {}", iter + 1, changes_in_iteration, error_after_iter);

        // Check for convergence
        if changes_in_iteration == 0 {
            println!("DBS: Converged (no changes).");
            break;
        }
        let improvement = error_before_iter - error_after_iter;
        if improvement < 0.0 { // Should not happen ideally
             println!("DBS: Warning - error increased?");
        }
        if error_before_iter > 0.0 && (improvement / error_before_iter) < min_improvement_threshold {
            println!("DBS: Converged (minimal improvement).");
            break;
        }
        if iter == max_iterations - 1 {
             println!("DBS: Reached max iterations.");
        }
    }

    // 6. Final Output Generation
    for i in 0..size {
        let value = if binary_pattern[i] == 1 { 255 } else { 0 };
        let base_idx_out = i * 4;
        output[base_idx_out] = value;
        output[base_idx_out + 1] = value;
        output[base_idx_out + 2] = value;
        output[base_idx_out + 3] = 255; // Alpha
    }
     println!("DBS: Dithering complete.");
} 