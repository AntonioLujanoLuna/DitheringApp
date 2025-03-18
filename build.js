import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Check if we're running in Vercel
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  console.log('Running in Vercel environment');
  
  // Set environment variables for Sharp
  process.env.SHARP_IGNORE_GLOBAL_LIBVIPS = '1';
  
  try {
    // Skip PWA asset generation on Vercel
    console.log('Skipping PWA asset generation on Vercel');
    
    // Run the standard build without PWA asset generation
    console.log('Running Vite build...');
    execSync('vite build', { stdio: 'inherit' });
    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
} else {
  // For local builds, run the full process including PWA asset generation
  console.log('Running full build with PWA asset generation...');
  execSync('vite build', { stdio: 'inherit' });
} 