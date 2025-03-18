// scripts/vercel-build.mjs
import { execSync } from 'child_process';

// Force disable Rollup native extensions
process.env.ROLLUP_NATIVE_EXTENSIONS = 'false';

console.log('Starting Vercel build with ROLLUP_NATIVE_EXTENSIONS=false');

try {
  // Use execSync with the environment variables explicitly set
  execSync('vite build --config vite.vercel.config.js', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      DISABLE_PWA: 'true',
      NODE_ENV: 'production',
      ROLLUP_NATIVE_EXTENSIONS: 'false'
    }
  });
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}