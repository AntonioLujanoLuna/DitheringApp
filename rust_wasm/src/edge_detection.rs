// Sobel edge detection algorithm
pub fn sobel_edge_detection(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    // Convert the input and output pointers to slices
    let input = unsafe { std::slice::from_raw_parts(input_ptr, width * height) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, width * height) };
    
    // Sobel operators
    const SOBEL_X: [[i32; 3]; 3] = [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1],
    ];
    
    const SOBEL_Y: [[i32; 3]; 3] = [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1],
    ];
    
    // Initialize output to black
    for i in 0..output.len() {
        output[i] = 0;
    }
    
    // Apply Sobel operator
    for y in 1..height-1 {
        for x in 1..width-1 {
            let mut gx = 0;
            let mut gy = 0;
            
            // Apply convolution
            for ky in 0..3 {
                for kx in 0..3 {
                    let pixel_y = y + ky - 1;
                    let pixel_x = x + kx - 1;
                    let idx = pixel_y * width + pixel_x;
                    let pixel_value = input[idx] as i32;
                    
                    gx += pixel_value * SOBEL_X[ky][kx];
                    gy += pixel_value * SOBEL_Y[ky][kx];
                }
            }
            
            // Compute gradient magnitude
            let mag = ((gx * gx + gy * gy) as f32).sqrt();
            
            // Apply threshold
            let idx = y * width + x;
            output[idx] = if mag > threshold as f32 { 255 } else { 0 };
        }
    }
} 