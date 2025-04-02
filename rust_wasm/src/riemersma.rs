// Hilbert curve generation and Riemersma dithering

// Generate Hilbert curve coordinates for a given order
fn generate_hilbert_curve(order: u32) -> Vec<(usize, usize)> {
    let size = 1usize << order; // 2^order
    let num_points = size * size;
    let mut points = vec![(0, 0); num_points];
    hilbert_curve_recursive(&mut points, 0, 0, 0, 1, 0, 0, 1, order);
    points
}

// Recursive helper for Hilbert curve generation
// Ported from the algorithm described on Wikipedia/various sources
// (x, y) is the starting coordinate of the square
// (xi, yi) and (xj, yj) are vectors defining the orientation of the curve within the square
fn hilbert_curve_recursive(
    points: &mut [(usize, usize)],
    mut index: usize,
    x: usize, y: usize,
    xi: isize, yi: isize,
    xj: isize, yj: isize,
    order: u32,
) -> usize {
    if order == 0 {
        // Base case: place the point
        points[index] = (x, y);
        return index + 1;
    }

    let new_order = order - 1;
    let half_step = 1usize << new_order; // 2^(order-1)

    // Calculate coordinates for the four sub-quadrants
    let x_yi = (x as isize + yi * half_step as isize) as usize;
    let y_yj = (y as isize + yj * half_step as isize) as usize;
    let x_xi = (x as isize + xi * half_step as isize) as usize;
    let y_yi = (y as isize + yi * half_step as isize) as usize;
    let x_xi_yi = (x as isize + xi * half_step as isize + yi * half_step as isize) as usize;
    let y_yi_yj = (y as isize + yi * half_step as isize + yj * half_step as isize) as usize;
    let x_xi_yi_xj = (x as isize + xi * half_step as isize + yi * half_step as isize - xj * half_step as isize) as usize;
    let y_yi_yj_xi = (y as isize + yi * half_step as isize + yj * half_step as isize - xi * half_step as isize) as usize;

    // Recurse into the four sub-quadrants in Hilbert order
    index = hilbert_curve_recursive(points, index, x, y, xj, yj, xi, yi, new_order);
    index = hilbert_curve_recursive(points, index, x_yi, y_yj, xi, yi, xj, yj, new_order);
    index = hilbert_curve_recursive(points, index, x_xi_yi, y_yi_yj, xi, yi, xj, yj, new_order);
    index = hilbert_curve_recursive(points, index, x_xi_yi_xj, y_yi_yj_xi, -xj, -yj, -xi, -yi, new_order);

    index
}

pub fn riemersma_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    let size = width * height;
    let input = unsafe { std::slice::from_raw_parts(input_ptr, size) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, size * 4) }; // RGBA output

    // Create a float buffer of the input
    let buffer: Vec<f32> = input.iter().map(|&p| p as f32).collect();

    // Determine Hilbert curve order needed to cover the image
    let max_dim = width.max(height);
    let order = (max_dim as f32).log2().ceil() as u32;

    // Generate Hilbert curve path
    let hilbert_path = generate_hilbert_curve(order);

    // Error buffer (simple 3-tap)
    let mut error_buffer = [0.0f32; 3];
    let threshold_f = threshold as f32;

    // Apply dithering along the Hilbert curve
    for &(x, y) in &hilbert_path {
        // Check if the point is within the image bounds
        if x < width && y < height {
            let idx = y * width + x;

            // Get pixel value and add accumulated error
            let pixel_value = buffer[idx] + error_buffer[0];

            // Apply threshold
            let new_pixel_value = if pixel_value < threshold_f { 0.0 } else { 255.0 };
            let error = pixel_value - new_pixel_value;

            // Update error buffer (shift and distribute)
            error_buffer[0] = error_buffer[1] + error * 0.4;
            error_buffer[1] = error_buffer[2] + error * 0.3;
            error_buffer[2] = error * 0.3;

            // Write RGBA output pixel
            let base_idx_out = idx * 4;
            let new_pixel_u8 = new_pixel_value as u8;
            output[base_idx_out] = new_pixel_u8;
            output[base_idx_out + 1] = new_pixel_u8;
            output[base_idx_out + 2] = new_pixel_u8;
            output[base_idx_out + 3] = 255; // Alpha
        }
    }
} 