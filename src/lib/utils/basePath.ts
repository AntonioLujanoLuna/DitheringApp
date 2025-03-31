/**
 * Initialize the base path for the application
 * This is especially important for GitHub Pages where the app is served from a subdirectory
 */
export function initBasePath(): void {
  const basePath = import.meta.env.BASE_URL || '/';
  
  // Store the base URL in a global variable that can be accessed by other modules
  (window as any).__VITE_BASE_URL__ = basePath;
  
  console.log(`Application base path initialized to: ${basePath}`);
} 