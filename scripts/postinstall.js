import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

console.log('Running postinstall script...');

// Check if we're in a Vercel environment
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  console.log('Detected Vercel environment - disabling PWA features');
  process.env.DISABLE_PWA = 'true';
  
  try {
    // Remove PWA related packages from node_modules to ensure they're not used during build
    console.log('Removing Sharp and PWA assets generator from node_modules...');
    
    const dirsToRemove = [
      'sharp',
      '@vite-pwa/assets-generator',
      'sharp-ico'
    ];
    
    dirsToRemove.forEach(dir => {
      const fullPath = path.resolve(process.cwd(), 'node_modules', dir);
      try {
        if (fs.existsSync(fullPath)) {
          console.log(`Removing ${dir}...`);
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`Successfully removed ${dir}`);
        } else {
          console.log(`Directory ${dir} does not exist, skipping`);
        }
      } catch (err) {
        console.warn(`Warning: Failed to remove ${dir}: ${err.message}`);
      }
    });
    
    // Check for and modify the vite.config.ts to ensure it doesn't include PWA
    try {
      const viteConfigPath = path.resolve(process.cwd(), 'vite.config.ts');
      if (fs.existsSync(viteConfigPath)) {
        let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
        
        // If vite-plugin-pwa is imported, comment it out
        viteConfig = viteConfig.replace(/import\s+{\s*VitePWA\s*}\s+from\s+['"]vite-plugin-pwa['"]/, '// PWA import removed for Vercel build');
        
        fs.writeFileSync(viteConfigPath, viteConfig);
        console.log('Modified vite.config.ts to disable PWA plugin imports');
      }
    } catch (err) {
      console.warn(`Warning: Failed to modify vite.config.ts: ${err.message}`);
    }
    
    console.log('Successfully prepared environment for Vercel build.');
  } catch (error) {
    console.error('Error in postinstall script:', error);
    // Don't exit with error code as this would fail the build
  }
} else {
  console.log('Not in Vercel environment - proceeding with normal setup.');
}

// Exit successfully
process.exit(0); 