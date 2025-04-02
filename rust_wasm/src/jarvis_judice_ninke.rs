pub fn jarvis_judice_ninke_dither(
    input_ptr: *const u8,
    width: usize,
    height: usize,
    threshold: u8,
    output_ptr: *mut u8,
) {
    let size = width * height;
    let input = unsafe { std::slice::from_raw_parts(input_ptr, size) };
    let output = unsafe { std::slice::from_raw_parts_mut(output_ptr, size * 4) }; // RGBA output

    // Create a mutable buffer for error diffusion
    let mut buffer: Vec<f32> = input.iter().map(|&p| p as f32).collect();

    for y in 0..height {
        for x in 0..width {
            let idx = y * width + x;
            let old_pixel = buffer[idx];

            // Apply threshold
            let new_pixel_value = if old_pixel < threshold as f32 { 0.0 } else { 255.0 };
            let error = old_pixel - new_pixel_value;

            // Write RGBA output pixel
            let base_idx_out = idx * 4;
            output[base_idx_out] = new_pixel_value as u8;
            output[base_idx_out + 1] = new_pixel_value as u8;
            output[base_idx_out + 2] = new_pixel_value as u8;
            output[base_idx_out + 3] = 255; // Alpha

            // Distribute error (Jarvis-Judice-Ninke)
            let err_div_48 = error / 48.0;

            // Current row
            if x + 1 < width {
                buffer[idx + 1] += err_div_48 * 7.0;
            }
            if x + 2 < width {
                buffer[idx + 2] += err_div_48 * 5.0;
            }
            // Next row
            if y + 1 < height {
                let next_row_idx = idx + width;
                if x >= 2 {
                    buffer[next_row_idx - 2] += err_div_48 * 3.0;
                }
                if x >= 1 {
                    buffer[next_row_idx - 1] += err_div_48 * 5.0;
                }
                buffer[next_row_idx] += err_div_48 * 7.0;
                if x + 1 < width {
                    buffer[next_row_idx + 1] += err_div_48 * 5.0;
                }
                if x + 2 < width {
                    buffer[next_row_idx + 2] += err_div_48 * 3.0;
                }
            }
            // Row after next
            if y + 2 < height {
                let row_after_next_idx = idx + 2 * width;
                if x >= 2 {
                    buffer[row_after_next_idx - 2] += err_div_48 * 1.0;
                }
                if x >= 1 {
                    buffer[row_after_next_idx - 1] += err_div_48 * 3.0;
                }
                buffer[row_after_next_idx] += err_div_48 * 5.0;
                if x + 1 < width {
                    buffer[row_after_next_idx + 1] += err_div_48 * 3.0;
                }
                if x + 2 < width {
                    buffer[row_after_next_idx + 2] += err_div_48 * 1.0;
                }
            }
        }
    }
} 