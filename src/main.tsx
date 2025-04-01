import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerServiceWorker } from './lib/registerServiceWorker'
import { initBasePath } from './lib/utils/basePath'
import { loadWasmModule, isWasmSupported } from './lib/wasm/ditheringWasm'

// For debugging - display a message in console to confirm script is running
console.log('Dithering App initializing...');
console.log('Running on GitHub Pages: ', window.location.hostname.includes('github.io'));

// Initialize the base path
initBasePath();

// Preload WebAssembly module if supported
if (isWasmSupported()) {
  console.info('WebAssembly is supported. Preloading module...');
  // Start loading, but don't block rendering
  loadWasmModule().catch(error => {
    // Catch potential errors during the async loading initiation or final failure after retries
    console.warn('WebAssembly module preloading failed:', error);
  });
} else {
  console.info('WebAssembly not supported or previously failed. Skipping preload.');
}

// Register service worker for PWA support
registerServiceWorker();

// Use createRoot API
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Root element not found</div>';
} else {
  const root = ReactDOM.createRoot(rootElement);

  try {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    console.log('App mounted successfully');
  } catch (error) {
    console.error('Failed to render the app:', error);
    // Display error on page for easier debugging
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: sans-serif;">
        <h1>Application Error</h1>
        <p>There was an error loading the application:</p>
        <pre>${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    `;
  }
}