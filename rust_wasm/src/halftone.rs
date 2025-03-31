// Halftone dithering algorithm
pub fn halftone_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    dot_size: usize,
    spacing: usize,
    angle: f32,
    output_ptr: *mut u8,
) {
    // Convert the input and output pointers to slices
    let input = unsafe { std::slice::from_raw_parts(input_ptr, width * height) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, width * height) };
    
    // Clear output buffer
    for i in 0..output.len() {
        output[i] = 0;
    }
    
    // Calculate the rotation matrix for the specified angle
    let angle_rad = angle * std::f32::consts::PI / 180.0;
    let cos_angle = angle_rad.cos();
    let sin_angle = angle_rad.sin();
    
    // Cell size (dot size + spacing)
    let cell_size = dot_size + spacing;
    
    // Process the image in cell-sized blocks
    for y in 0..height {
        for x in 0..width {
            let idx = y * width + x;
            let pixel_value = input[idx];
            
            // Calculate the cell position for this pixel
            let cell_x = (x / cell_size) * cell_size + cell_size / 2;
            let cell_y = (y / cell_size) * cell_size + cell_size / 2;
            
            // Calculate rotated coordinates
            let dx = (x as f32 - cell_x as f32);
            let dy = (y as f32 - cell_y as f32);
            let rotated_x = dx * cos_angle - dy * sin_angle;
            let rotated_y = dx * sin_angle + dy * cos_angle;
            
            // Calculate the max dot radius based on the input value (0-255)
            let max_radius = (dot_size as f32 / 2.0) * (pixel_value as f32 / 255.0);
            
            // Check if this pixel falls within the dot
            let dist = (rotated_x * rotated_x + rotated_y * rotated_y).sqrt();
            
            if dist <= max_radius {
                output[idx] = 255;
            }
        }
    }
} 