export function rgbToGrayscale(imageData: ImageData): Uint8ClampedArray {
    const data = imageData.data;
    const gray = new Uint8ClampedArray(imageData.width * imageData.height);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Convert to grayscale using luminance formula
      gray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }
    
    return gray;
  }