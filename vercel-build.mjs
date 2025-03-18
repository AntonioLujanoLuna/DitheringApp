// ES Module version of build script for Vercel
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

console.log('Starting Vercel build script...');

// Create a minimal Vite config that explicitly disables PWA
const viteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Simple Vite config for Vercel - no PWA
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
`;

// Write the simplified config file
const configPath = resolve(process.cwd(), 'vite.minimal.config.js');
writeFileSync(configPath, viteConfig, 'utf8');
console.log('Created minimal Vite config for Vercel build');

// Set environment variables
process.env.DISABLE_PWA = 'true';
process.env.NODE_ENV = 'production';

try {
  // Run the build with the simplified config
  console.log('Running Vite build...');
  execSync('npx vite build --config vite.minimal.config.js', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      DISABLE_PWA: 'true',
      NODE_ENV: 'production'
    }
  });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}