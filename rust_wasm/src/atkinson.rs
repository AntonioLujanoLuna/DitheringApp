// Atkinson dithering algorithm
pub fn atkinson_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    // Convert the input and output pointers to slices
    let input = unsafe { std::slice::from_raw_parts(input_ptr, width * height) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, width * height) };
    
    // Create a buffer for error diffusion
    let mut buffer = vec![0.0f32; width * height];
    
    // Initialize buffer with input values
    for i in 0..input.len() {
        buffer[i] = input[i] as f32;
    }
    
    // Apply dithering
    for y in 0..height {
        for x in 0..width {
            let idx = y * width + x;
            let old_pixel = buffer[idx];
            
            // Apply threshold
            let new_pixel = if old_pixel < threshold as f32 { 0.0 } else { 255.0 };
            
            // Calculate error and distribute 1/8 of error to each neighbor
            let error = (old_pixel - new_pixel) / 8.0;
            
            // Distribute error to neighboring pixels using Atkinson pattern
            if x + 1 < width {
                buffer[idx + 1] += error;
            }
            
            if x + 2 < width {
                buffer[idx + 2] += error;
            }
            
            if y + 1 < height {
                if x > 0 {
                    buffer[idx + width - 1] += error;
                }
                
                buffer[idx + width] += error;
                
                if x + 1 < width {
                    buffer[idx + width + 1] += error;
                }
            }
            
            if y + 2 < height {
                buffer[idx + width * 2] += error;
            }
            
            // Set the output pixel
            output[idx] = new_pixel as u8;
        }
    }
} 