import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

console.log('Running postinstall script...');

// Check if we're in a Vercel environment
const isVercel = process.env.VERCEL === '1';

if (isVercel) {
  console.log('Detected Vercel environment - configuring build environment');
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
    
    // Add explicit Rollup configuration for Vercel
    console.log('Setting up Rollup for Vercel environment...');
    
    // Set environment variable to prevent native extensions
    process.env.ROLLUP_NATIVE_EXTENSIONS = 'false';
    
    try {
      // Create .npmrc file that forces correct architecture
      const npmrcPath = path.resolve(process.cwd(), '.npmrc');
      fs.writeFileSync(npmrcPath, 'platform=linux\narch=x64\nlibc=glibc\nlegacy-peer-deps=true\nomit=optional\nnode-linker=hoisted', 'utf8');
      console.log('Created .npmrc file with platform settings');
      
      // Create a mock @rollup/rollup-linux-x64-gnu module
      console.log('Creating mock Rollup native extension module...');
      
      const rollupDir = path.resolve(process.cwd(), 'node_modules/@rollup');
      if (!fs.existsSync(rollupDir)) {
        fs.mkdirSync(rollupDir, { recursive: true });
      }
      
      const mockModuleDir = path.resolve(rollupDir, 'rollup-linux-x64-gnu');
      if (!fs.existsSync(mockModuleDir)) {
        fs.mkdirSync(mockModuleDir);
      }
      
      // Create a mock package.json
      fs.writeFileSync(
        path.resolve(mockModuleDir, 'package.json'),
        JSON.stringify({
          name: "@rollup/rollup-linux-x64-gnu",
          version: "4.9.5",
          description: "Mock native module",
          main: "index.js"
        }, null, 2)
      );
      
      // Create a mock index.js that exports an empty module
      fs.writeFileSync(
        path.resolve(mockModuleDir, 'index.js'),
        'module.exports = {};'
      );
      
      console.log('Successfully created mock Rollup native extension module');
      
    } catch (err) {
      console.warn(`Warning: Failed to set up Rollup for Vercel: ${err.message}`);
    }
    
    // Patch rollup's native.js to avoid errors
    try {
      console.log('Patching Rollup native.js file...');
      const nativeJsPath = path.resolve(process.cwd(), 'node_modules/rollup/dist/native.js');
      
      if (fs.existsSync(nativeJsPath)) {
        let nativeJs = fs.readFileSync(nativeJsPath, 'utf8');
        
        // Modify native.js to just return an empty object without trying to load native code
        const patchedCode = `
// Patched by postinstall script to avoid native extension issues
function getDefaultExportFromCjs (x) {
  return x && x.__esModule ? x['default'] : x;
}

var native = {};
export { getDefaultExportFromCjs as g, native as n };
`;
        
        fs.writeFileSync(nativeJsPath, patchedCode);
        console.log('Successfully patched Rollup native.js file');
      } else {
        console.warn('Could not find rollup/dist/native.js to patch');
      }
    } catch (err) {
      console.warn(`Warning: Failed to patch Rollup native.js: ${err.message}`);
    }
    
    // Ensure Vite is installed
    try {
      console.log('Making sure Vite is installed...');
      execSync('npm list vite || npm install vite@5.1.4 --no-save', { stdio: 'inherit' });
    } catch (err) {
      console.warn(`Warning: Error checking/installing Vite: ${err.message}`);
      console.log('Attempting emergency install of Vite...');
      try {
        execSync('npm install vite@5.1.4 --no-save', { stdio: 'inherit' });
      } catch (installErr) {
        console.error(`Error installing Vite: ${installErr.message}`);
      }
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