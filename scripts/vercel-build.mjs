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
console.log(`- DISABLE_PWA=${process.env.DISABLE_PWA}`); // Fixed this line
console.log(`- NODE_ENV=${process.env.NODE_ENV}`);

// Ensure the correct Rollup configuration
try {
  // Use the Vercel-specific Vite config with a direct call to esbuild
  console.log('Running Vite build in production mode...');
  
  // Create a temporary vite.vercel.config.js file that doesn't use rollup
  const tempConfigPath = path.resolve(process.cwd(), 'vite.temp.js');
  const configContent = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    // Force the JS-only build with no native extensions
    target: 'es2015',
    minify: 'esbuild',
    rollupOptions: {
      external: [
        '@rollup/rollup-linux-x64-gnu',
        '@rollup/rollup-darwin-x64',
        '@rollup/rollup-darwin-arm64',
        '@rollup/rollup-win32-x64-msvc'
      ]
    }
  }
});
`;
  fs.writeFileSync(tempConfigPath, configContent);
  console.log('Created temporary Vite config');
  
  // Execute the build with the temporary config
  try {
    execSync('npx vite build --config vite.temp.js', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        ROLLUP_NATIVE_EXTENSIONS: 'false',
        DISABLE_PWA: 'true',
        NODE_ENV: 'production'
      }
    });
    
    console.log('Build completed successfully!');
  } catch (buildError) {
    console.error('Build failed:', buildError);
    process.exit(1);
  } finally {
    // Clean up the temporary config
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  }
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}