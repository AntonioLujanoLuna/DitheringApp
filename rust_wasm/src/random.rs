use rand::Rng;

pub fn random_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    noise_amount: f32,
    output_ptr: *mut u8,
) {
    let size = width * height;
    let input = unsafe { std::slice::from_raw_parts(input_ptr, size) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, size * 4) }; // RGBA output
    let mut rng = rand::thread_rng();

    for i in 0..size {
        let pixel = input[i] as f32;

        // Generate random noise between -noise_amount/2 and +noise_amount/2
        let noise = (rng.gen::<f32>() - 0.5) * noise_amount;

        // Add noise to the pixel value
        let noisy_pixel = pixel + noise;

        // Apply threshold
        let new_pixel_value = if noisy_pixel < threshold as f32 { 0 } else { 255 };

        // Write RGBA output
        let base_idx = i * 4;
        output[base_idx] = new_pixel_value;     // R
        output[base_idx + 1] = new_pixel_value; // G
        output[base_idx + 2] = new_pixel_value; // B
        output[base_idx + 3] = 255;             // A (fully opaque)
    }
} 