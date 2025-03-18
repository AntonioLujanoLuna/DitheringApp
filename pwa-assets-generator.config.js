// pwa-assets-generator.config.js
// This file is only used in development environments
// Vercel deployments skip PWA asset generation

// Check if running in Vercel
const isVercel = process.env.VERCEL === '1';

// Only export configuration if not in Vercel environment
if (!isVercel) {
  module.exports = {
    preset: 'minimal',
    images: ['src/assets/react.svg'] // Using the existing React SVG as a source
  };
} else {
  console.log('Skipping PWA asset generation in Vercel environment');
  module.exports = {}; // Export empty config for Vercel
}