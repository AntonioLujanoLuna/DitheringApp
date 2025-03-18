// build.js
import { execSync } from 'child_process';

// Detect environment
const isVercel = process.env.VERCEL === '1';

// Set default environment variables
process.env.NODE_ENV = 'production';

if (isVercel) {
  console.log('Detected Vercel environment - using Vercel-specific build');
  process.env.DISABLE_PWA = 'true';
  process.env.ROLLUP_NATIVE_EXTENSIONS = 'false';
  
  // Execute the Vercel-specific build
  try {
    execSync('node scripts/vercel-build.mjs', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        DISABLE_PWA: 'true',
        ROLLUP_NATIVE_EXTENSIONS: 'false'
      }
    });
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
} else {
  console.log('Running standard build');
  
  // Execute the standard build
  try {
    execSync('vite build', { 
      stdio: 'inherit',
      env: process.env
    });
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

console.log('Build completed successfully!');