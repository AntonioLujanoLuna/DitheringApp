// scripts/vercel-build.mjs
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Force disable Rollup native extensions and enable PWA
process.env.ROLLUP_NATIVE_EXTENSIONS = 'false';
process.env.DISABLE_PWA = 'true';
process.env.NODE_ENV = 'production';

console.log('Starting Vercel build with the following environment:');
console.log(`- ROLLUP_NATIVE_EXTENSIONS=${process.env.ROLLUP_NATIVE_EXTENSIONS}`);
console.log(`- DISABLE_PWA=${process.env.DISABLE_PWA}`);
console.log(`- NODE_ENV=${process.env.NODE_ENV}`);

// Ensure the correct Rollup configuration
try {
  // Use the Vercel-specific Vite config
  console.log('Running Vite build with Vercel-specific configuration...');
  
  // Create a temporary build script with the explicit env variables
  const buildCommand = 'ROLLUP_NATIVE_EXTENSIONS=false DISABLE_PWA=true NODE_ENV=production vite build --config vite.vercel.config.js';
  
  // Execute the build
  execSync(buildCommand, { 
    stdio: 'inherit',
    env: {
      ...process.env,
      ROLLUP_NATIVE_EXTENSIONS: 'false',
      DISABLE_PWA: 'true',
      NODE_ENV: 'production'
    }
  });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}