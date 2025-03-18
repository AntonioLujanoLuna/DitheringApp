import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// For debugging - display a message in console to confirm script is running
console.log('Dithering App initializing...');

// Use createRoot API
const root = ReactDOM.createRoot(document.getElementById('root')!);

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
  document.getElementById('root')!.innerHTML = `
    <div style="padding: 20px; color: red; font-family: sans-serif;">
      <h1>Application Error</h1>
      <p>There was an error loading the application:</p>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
    </div>
  `;
}