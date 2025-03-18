import { execSync } from 'child_process';
import fs from 'fs';

console.log('Running enhanced Vercel build script');

// Ensure PWA is disabled
process.env.DISABLE_PWA = 'true';

try {
  // Create a simplified Vite config specifically for Vercel
  const minimalConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Minimal config for Vercel deployment - no PWA or optional dependencies
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    exclude: ['@rollup/rollup-linux-x64-gnu']
  },
  build: {
    rollupOptions: {
      // Ensure Rollup doesn't try to use native extensions
      makeAbsoluteExternalsRelative: false,
      external: [/@rollup\\/rollup-.*-gnu/]
    }
  }
});
`;

  // Update the existing vite.vercel.config.js file
  fs.writeFileSync('vite.vercel.config.js', minimalConfig);
  console.log('Updated Vite config for Vercel');
  
  // Run the build
  console.log('Running Vite build with modified config...');
  execSync('npx vite build --config vite.vercel.config.js', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      DISABLE_PWA: 'true',
      NODE_ENV: 'production',
      ROLLUP_SKIP_NATIVE: 'true' // Skip native dependencies
    }
  });
  
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build error details:', error);
  process.exit(1);
}