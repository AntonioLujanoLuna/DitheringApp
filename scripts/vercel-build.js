import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Running special Vercel build script');

// Ensure PWA is disabled
process.env.DISABLE_PWA = 'true';

try {
  // Remove any remaining sharp dependencies
  const modulesToRemove = [
    'sharp',
    '@vite-pwa/assets-generator',
    'sharp-ico'
  ];

  console.log('Removing any remaining Sharp-related dependencies...');
  
  modulesToRemove.forEach(module => {
    try {
      const moduleDir = path.resolve(process.cwd(), 'node_modules', module);
      if (fs.existsSync(moduleDir)) {
        console.log(`Removing ${module}...`);
        fs.rmSync(moduleDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.log(`Couldn't remove ${module}: ${e.message}`);
    }
  });

  // Copy the Vercel-specific Vite config to the one that will be used
  const vercelViteConfig = path.resolve(process.cwd(), 'vite.vercel.config.js');
  const viteConfig = path.resolve(process.cwd(), 'vite.config.ts');
  
  // Check if we have our special config
  if (fs.existsSync(vercelViteConfig)) {
    console.log('Using Vercel-specific Vite config...');
    execSync(`npx vite build --config vite.vercel.config.js`, { 
      stdio: 'inherit',
      env: { 
        ...process.env,
        DISABLE_PWA: 'true',
        NODE_ENV: 'production'
      }
    });
  } else {
    // Still try to build with PWA disabled
    console.log('Running Vite build with PWA explicitly disabled...');
    execSync('npx vite build', { 
      stdio: 'inherit',
      env: { 
        ...process.env,
        DISABLE_PWA: 'true',
        NODE_ENV: 'production'
      }
    });
  }

  console.log('Vercel build completed successfully');
} catch (error) {
  console.error('Vercel build failed:', error);
  process.exit(1);
} 