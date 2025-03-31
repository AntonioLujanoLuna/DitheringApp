// WebGL acceleration for dithering algorithms
// This provides GPU-accelerated processing for large images

// Vertex shader - simple pass-through
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
  }
`;

// Fragment shader for pattern dithering
const patternDitheringFragmentShader = `
  precision highp float;
  
  varying vec2 v_texCoord;
  
  uniform sampler2D u_image;
  uniform sampler2D u_pattern;
  uniform vec2 u_patternSize;
  uniform vec2 u_imageSize;
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114)); // Convert to grayscale
    
    // Calculate pattern coordinates
    vec2 patternCoord = fract(v_texCoord * u_imageSize / u_patternSize);
    float threshold = texture2D(u_pattern, patternCoord).r;
    
    // Apply threshold
    float result = step(threshold, gray);
    
    gl_FragColor = vec4(result, result, result, 1.0);
  }
`;

// Fragment shader for ordered dithering
const orderedDitheringFragmentShader = `
  precision highp float;
  
  varying vec2 v_texCoord;
  
  uniform sampler2D u_image;
  uniform sampler2D u_bayerMatrix;
  uniform vec2 u_bayerSize;
  uniform vec2 u_imageSize;
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114)); // Convert to grayscale
    
    // Calculate Bayer matrix coordinates
    vec2 bayerCoord = fract(v_texCoord * u_imageSize / u_bayerSize);
    float threshold = texture2D(u_bayerMatrix, bayerCoord).r;
    
    // Apply threshold
    float result = step(threshold, gray);
    
    gl_FragColor = vec4(result, result, result, 1.0);
  }
`;

// Fragment shader for halftone dithering
const halftoneDitheringFragmentShader = `
  precision highp float;
  
  varying vec2 v_texCoord;
  
  uniform sampler2D u_image;
  uniform float u_dotSize;
  uniform float u_spacing;
  uniform float u_angle;
  uniform vec2 u_imageSize;
  
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114)); // Convert to grayscale
    
    // Calculate rotated coordinates
    float angleRad = radians(u_angle);
    vec2 aspectRatio = vec2(u_imageSize.x / u_imageSize.y, 1.0);
    vec2 rotatedCoord = vec2(
      cos(angleRad) * v_texCoord.x * aspectRatio.x + sin(angleRad) * v_texCoord.y * aspectRatio.y,
      -sin(angleRad) * v_texCoord.x * aspectRatio.x + cos(angleRad) * v_texCoord.y * aspectRatio.y
    );
    
    // Calculate dot pattern
    vec2 grid = fract(rotatedCoord * u_imageSize / u_spacing);
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(grid, center);
    
    // Adjust dot size based on brightness
    float maxRadius = 0.5 * u_dotSize;
    float threshold = step(dist, maxRadius * gray);
    
    gl_FragColor = vec4(threshold, threshold, threshold, 1.0);
  }
`;

// Main WebGL processing function
export function processImageWithWebGL(
  sourceImage: HTMLImageElement | ImageData,
  shaderType: 'pattern' | 'ordered' | 'halftone',
  options: {
    patternTexture?: ImageData;
    patternSize?: number;
    dotSize?: number;
    spacing?: number;
    angle?: number;
  } = {}
): ImageData {
  // Get dimensions from source
  const width = sourceImage instanceof ImageData ? sourceImage.width : sourceImage.width;
  const height = sourceImage instanceof ImageData ? sourceImage.height : sourceImage.height;
  
  // Create canvas and get WebGL context
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    throw new Error('WebGL not supported');
  }
  
  // Create shader program
  const program = createShaderProgram(
    gl, 
    vertexShaderSource, 
    shaderType === 'pattern' ? patternDitheringFragmentShader : 
    shaderType === 'ordered' ? orderedDitheringFragmentShader : 
    halftoneDitheringFragmentShader
  );
  
  gl.useProgram(program);
  
  // Setup position buffer (vertices for a quad)
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    1, 1
  ]), gl.STATIC_DRAW);
  
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  
  // Setup texture coordinates buffer
  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    1, 1
  ]), gl.STATIC_DRAW);
  
  const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
  
  // Create and setup the source image texture
  const imageTexture = createTexture(gl, sourceImage);
  
  // Set the uniforms
  const imageLocation = gl.getUniformLocation(program, 'u_image');
  gl.uniform1i(imageLocation, 0);
  
  // Set image size
  const imageSizeLocation = gl.getUniformLocation(program, 'u_imageSize');
  gl.uniform2f(imageSizeLocation, width, height);
  
  // Setup pattern texture if needed
  if (shaderType === 'pattern' || shaderType === 'ordered') {
    const patternTexture = options.patternTexture || createPatternTexture(gl, options.patternSize || 4);
    const patternLocation = gl.getUniformLocation(program, shaderType === 'pattern' ? 'u_pattern' : 'u_bayerMatrix');
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, patternTexture);
    gl.uniform1i(patternLocation, 1);
    
    const patternSizeLocation = gl.getUniformLocation(program, shaderType === 'pattern' ? 'u_patternSize' : 'u_bayerSize');
    gl.uniform2f(patternSizeLocation, options.patternSize || 4, options.patternSize || 4);
  }
  
  // Set halftone options if needed
  if (shaderType === 'halftone') {
    const dotSizeLocation = gl.getUniformLocation(program, 'u_dotSize');
    gl.uniform1f(dotSizeLocation, options.dotSize || 4.0);
    
    const spacingLocation = gl.getUniformLocation(program, 'u_spacing');
    gl.uniform1f(spacingLocation, options.spacing || 8.0);
    
    const angleLocation = gl.getUniformLocation(program, 'u_angle');
    gl.uniform1f(angleLocation, options.angle || 45.0);
  }
  
  // Render
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  
  // Read pixels back
  const resultPixels = new Uint8ClampedArray(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, resultPixels);
  
  // Flip the Y-axis since WebGL uses bottom-left as origin
  const flippedPixels = flipPixelsY(resultPixels, width, height);
  
  return new ImageData(flippedPixels, width, height);
}

// Helper function to create a shader program
function createShaderProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);
  
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    throw new Error('Vertex shader compilation failed: ' + gl.getShaderInfoLog(vertexShader));
  }
  
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fragmentShader, fragmentSource);
  gl.compileShader(fragmentShader);
  
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    throw new Error('Fragment shader compilation failed: ' + gl.getShaderInfoLog(fragmentShader));
  }
  
  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Program linking failed: ' + gl.getProgramInfoLog(program));
  }
  
  return program;
}

// Helper function to create a texture from an image or ImageData
function createTexture(gl: WebGLRenderingContext, source: HTMLImageElement | ImageData): WebGLTexture {
  const texture = gl.createTexture()!;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  if (source instanceof ImageData) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  }
  
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
  return texture;
}

// Create a pattern texture from a pattern matrix
function createPatternTexture(gl: WebGLRenderingContext, size: number): WebGLTexture {
  const data = new Uint8Array(size * size * 4);
  
  // Generate a simple Bayer matrix or pattern
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const value = (x ^ y) % size / size * 255;
      data[idx] = value;     // R
      data[idx + 1] = value; // G
      data[idx + 2] = value; // B
      data[idx + 3] = 255;   // A
    }
  }
  
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  
  return texture;
}

// Flip pixels along Y-axis (WebGL has origin at bottom-left)
function flipPixelsY(pixels: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const flipped = new Uint8ClampedArray(pixels.length);
  
  for (let y = 0; y < height; y++) {
    const srcRow = (height - y - 1) * width * 4;
    const dstRow = y * width * 4;
    
    for (let x = 0; x < width * 4; x++) {
      flipped[dstRow + x] = pixels[srcRow + x];
    }
  }
  
  return flipped;
}

// Convert a pattern matrix to ImageData for use with WebGL
export function patternMatrixToImageData(pattern: number[][]): ImageData {
  const size = pattern.length;
  const data = new Uint8ClampedArray(size * size * 4);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const value = Math.min(255, Math.max(0, Math.floor(pattern[y][x] * 255)));
      
      data[idx] = value;     // R
      data[idx + 1] = value; // G
      data[idx + 2] = value; // B
      data[idx + 3] = 255;   // A
    }
  }
  
  return new ImageData(data, size, size);
}

// Utility function to check if WebGL is supported
export function isWebGLSupported(): boolean {
  const canvas = document.createElement('canvas');
  try {
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
} 