// Ordered dithering using Bayer matrices
pub fn ordered_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    dot_size: usize,
    output_ptr: *mut u8,
) {
    // 4x4 Bayer matrix
    const BAYER_MATRIX: [[u8; 4]; 4] = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5],
    ];
    
    // Convert the input and output pointers to slices
    let input = unsafe { std::slice::from_raw_parts(input_ptr, width * height) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, width * height) };
    
    // Scale the Bayer matrix values to threshold range
    let mut bayer_scaled = [[0i16; 4]; 4];
    for y in 0..4 {
        for x in 0..4 {
            bayer_scaled[y][x] = ((BAYER_MATRIX[y][x] as f32 / 16.0) * 256.0 - 128.0) as i16;
        }
    }
    
    // Apply dithering
    for y in 0..height {
        for x in 0..width {
            let idx = y * width + x;
            let pixel_value = input[idx];
            
            // Get the Bayer threshold adjustment for this position
            let bayer_x = (x / dot_size) % 4;
            let bayer_y = (y / dot_size) % 4;
            let bayer_value = bayer_scaled[bayer_y][bayer_x];
            
            // Apply threshold with Bayer adjustment
            let result = if (pixel_value as i16 + bayer_value) > 128 { 255 } else { 0 };
            
            // Set the output pixel
            output[idx] = result;
        }
    }
} 