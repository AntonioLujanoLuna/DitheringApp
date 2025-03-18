import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Check if we're running in Vercel
const isVercel = process.env.VERCEL === '1';

// Safety check to ensure PWA is disabled in Vercel
if (isVercel) {
  console.log('Running in Vercel environment');
  process.env.DISABLE_PWA = 'true';
  
  try {
    // Double check that vite.config.ts has PWA disabled 
    console.log('Double-checking Vite config for PWA disabling...');
    const isPWADisabled = process.env.DISABLE_PWA === 'true';
    
    if (!isPWADisabled) {
      console.warn('WARNING: PWA should be disabled in Vercel environment');
      process.env.DISABLE_PWA = 'true';
    }
    
    // Run the standard build without PWA asset generation
    console.log('Running Vite build with PWA disabled...');
    execSync('DISABLE_PWA=true vite build', { stdio: 'inherit', env: { ...process.env, DISABLE_PWA: 'true' } });
    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
} else {
  // For local builds, run the full process including PWA asset generation
  console.log('Running full build for local development...');
  try {
    execSync('vite build', { stdio: 'inherit' });
    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed in development:', error);
    process.exit(1);
  }
} 