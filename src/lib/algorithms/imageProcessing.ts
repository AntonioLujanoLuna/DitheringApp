// Image processing utilities for pre-processing before dithering

// Adjust brightness and contrast
export function adjustBrightnessContrast(
  imageData: ImageData,
  brightness: number, // -100 to 100
  contrast: number    // -100 to 100
): ImageData {
  // Create a new ImageData object to avoid modifying the original
  const output = new ImageData(imageData.width, imageData.height);
  const data = output.data;
  
  // Convert contrast to a multiplier (0 to 2)
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  // Convert brightness to an addition (-255 to 255)
  const brightnessFactor = brightness * 2.55;
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    // Apply brightness and contrast to each RGB channel
    for (let channel = 0; channel < 3; channel++) {
      const value = imageData.data[i + channel];
      
      // Apply contrast
      let newValue = contrastFactor * (value - 128) + 128;
      
      // Apply brightness
      newValue += brightnessFactor;
      
      // Clamp to 0-255
      data[i + channel] = Math.max(0, Math.min(255, newValue));
    }
    
    // Keep alpha channel unchanged
    data[i + 3] = imageData.data[i + 3];
  }
  
  return output;
}

// Apply gamma correction
export function applyGamma(
  imageData: ImageData,
  gamma: number  // 0.1 to 5.0
): ImageData {
  // Create a new ImageData object
  const output = new ImageData(imageData.width, imageData.height);
  const data = output.data;
  
  // Precompute gamma lookup table for efficiency
  const gammaLookup = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    gammaLookup[i] = Math.min(255, Math.max(0, Math.round(Math.pow(i / 255, 1 / gamma) * 255)));
  }
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    // Apply gamma to each RGB channel
    for (let channel = 0; channel < 3; channel++) {
      const value = imageData.data[i + channel];
      data[i + channel] = gammaLookup[value];
    }
    
    // Keep alpha channel unchanged
    data[i + 3] = imageData.data[i + 3];
  }
  
  return output;
}

// Adjust levels (input and output levels)
export function adjustLevels(
  imageData: ImageData,
  blackPoint: number = 0,      // 0 to 255
  midPoint: number = 128,      // 0 to 255
  whitePoint: number = 255,    // 0 to 255
  outputBlack: number = 0,     // 0 to 255
  outputWhite: number = 255    // 0 to 255
): ImageData {
  // Create a new ImageData object
  const output = new ImageData(imageData.width, imageData.height);
  const data = output.data;
  
  // Ensure points are in ascending order
  if (blackPoint >= whitePoint) {
    blackPoint = Math.min(254, blackPoint);
    whitePoint = Math.max(blackPoint + 1, whitePoint);
  }
  
  // Precompute levels lookup table for efficiency
  const levelsLookup = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    let newValue;
    
    if (i <= blackPoint) {
      newValue = outputBlack;
    } else if (i >= whitePoint) {
      newValue = outputWhite;
    } else {
      // Apply the levels adjustment
      const normalizedValue = (i - blackPoint) / (whitePoint - blackPoint);
      
      // Apply midpoint adjustment
      const midAdjust = Math.pow(normalizedValue, Math.log(0.5) / Math.log((midPoint - blackPoint) / (whitePoint - blackPoint)));
      
      // Scale to output range
      newValue = outputBlack + midAdjust * (outputWhite - outputBlack);
    }
    
    levelsLookup[i] = Math.min(255, Math.max(0, Math.round(newValue)));
  }
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    // Apply levels to each RGB channel
    for (let channel = 0; channel < 3; channel++) {
      const value = imageData.data[i + channel];
      data[i + channel] = levelsLookup[value];
    }
    
    // Keep alpha channel unchanged
    data[i + 3] = imageData.data[i + 3];
  }
  
  return output;
}

// Adjust hue, saturation, and lightness
export function adjustHSL(
  imageData: ImageData,
  hue: number = 0,           // -180 to 180
  saturation: number = 0,    // -100 to 100
  lightness: number = 0      // -100 to 100
): ImageData {
  // Create a new ImageData object
  const output = new ImageData(imageData.width, imageData.height);
  const data = output.data;
  
  // Convert adjustment ranges
  const hueShift = hue;
  const satFactor = 1 + saturation / 100;
  const lightFactor = lightness / 100;
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    // Get RGB values
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    
    // Convert RGB to HSL
    const [h, s, l] = rgbToHsl(r, g, b);
    
    // Apply adjustments
    let newH = (h + hueShift / 360) % 1;
    if (newH < 0) newH += 1;
    
    let newS = s * satFactor;
    newS = Math.max(0, Math.min(1, newS));
    
    let newL = l;
    if (lightFactor > 0) {
      newL += (1 - newL) * lightFactor;
    } else {
      newL += newL * lightFactor;
    }
    newL = Math.max(0, Math.min(1, newL));
    
    // Convert back to RGB
    const [newR, newG, newB] = hslToRgb(newH, newS, newL);
    
    // Set new values
    data[i] = newR;
    data[i + 1] = newG;
    data[i + 2] = newB;
    data[i + 3] = imageData.data[i + 3]; // Keep alpha channel unchanged
  }
  
  return output;
}

// Apply sharpening
export function sharpen(
  imageData: ImageData,
  amount: number = 1.0  // 0 to 5
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  
  // Create a new ImageData object
  const output = new ImageData(width, height);
  const data = output.data;
  
  // Copy the original data first
  for (let i = 0; i < imageData.data.length; i++) {
    data[i] = imageData.data[i];
  }
  
  // Sharpen using a 3x3 kernel
  const kernel = [
    -amount, -amount, -amount,
    -amount, 1 + 8 * amount, -amount,
    -amount, -amount, -amount
  ];
  
  // Apply the kernel to each pixel (excluding edges for simplicity)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const baseIdx = (y * width + x) * 4;
      
      // Process each color channel
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        
        // Apply kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            
            sum += imageData.data[idx] * kernel[kernelIdx];
          }
        }
        
        // Set sharpened value
        data[baseIdx + c] = Math.max(0, Math.min(255, sum));
      }
    }
  }
  
  return output;
}

// Apply blur
export function blur(
  imageData: ImageData,
  radius: number = 1  // 1 to 10
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  
  // Create a new ImageData object
  const output = new ImageData(width, height);
  const data = output.data;
  
  // Limit radius to a reasonable value
  radius = Math.min(10, Math.max(1, Math.floor(radius)));
  
  // Apply blur
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const baseIdx = (y * width + x) * 4;
      
      let rSum = 0, gSum = 0, bSum = 0;
      let count = 0;
      
      // Sample pixels within radius
      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const ny = y + ky;
          const nx = x + kx;
          
          // Skip out-of-bounds pixels
          if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
          
          const idx = (ny * width + nx) * 4;
          
          rSum += imageData.data[idx];
          gSum += imageData.data[idx + 1];
          bSum += imageData.data[idx + 2];
          count++;
        }
      }
      
      // Set averaged values
      data[baseIdx] = Math.round(rSum / count);
      data[baseIdx + 1] = Math.round(gSum / count);
      data[baseIdx + 2] = Math.round(bSum / count);
      data[baseIdx + 3] = imageData.data[baseIdx + 3]; // Keep alpha channel unchanged
    }
  }
  
  return output;
}

// RGB to HSL conversion utility
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }
  
  return [h, s, l];
}

// HSL to RGB conversion utility
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hueToRgb(p, q, h + 1/3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1/3);
  }
  
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
} 