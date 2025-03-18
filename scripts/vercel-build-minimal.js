#!/usr/bin/env node
// Minimal build script for Vercel that doesn't depend on external configuration

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('Starting minimal Vercel build script');

// Create a minimal vite config
const minimalViteConfig = `
const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

// Minimal Vite config for Vercel without PWA
module.exports = defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': '/src' } },
});
`;

// Write the minimal config
fs.writeFileSync(path.resolve(process.cwd(), 'vite.minimal.config.js'), minimalViteConfig);

// Install required packages
console.log('Installing minimal dependencies for build...');
execSync('npm install vite@5.1.4 @vitejs/plugin-react --no-save', { stdio: 'inherit' });

// Run the build with our minimal config
console.log('Running build with minimal config...');
execSync('npx vite build --config vite.minimal.config.js', { 
  stdio: 'inherit',
  env: { ...process.env, DISABLE_PWA: 'true', NODE_ENV: 'production' }
});

console.log('Minimal Vercel build completed successfully'); 