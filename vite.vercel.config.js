import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

console.log('Loading vite.vercel.config.js with ROLLUP_NATIVE_EXTENSIONS=', process.env.ROLLUP_NATIVE_EXTENSIONS);

// Force the ROLLUP_NATIVE_EXTENSIONS to be false
process.env.ROLLUP_NATIVE_EXTENSIONS = 'false';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    // Explicitly exclude problematic dependencies
    exclude: [
      '@rollup/rollup-linux-x64-gnu',
      '@rollup/rollup-darwin-x64', 
      '@rollup/rollup-darwin-arm64',
      '@rollup/rollup-win32-x64-msvc',
      'sharp',
      '@vite-pwa/assets-generator'
    ]
  },
  build: {
    target: 'es2015',
    sourcemap: false, // Disable sourcemaps to reduce build complexity
    // Configure rollup
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress specific warnings
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' || 
            warning.message.includes('rollup-plugin-dynamic-import-variables') ||
            warning.message.includes('@rollup/rollup')) {
          return;
        }
        warn(warning);
      },
      external: [
        /^@rollup\/rollup-.*$/,
        'sharp',
        '@vite-pwa/assets-generator'
      ]
    }
  },
  // Disable esbuild native plugins
  esbuild: {
    supported: {
      // Disable native top-level await
      'top-level-await': false
    },
  },
  // Suppress file system warnings
  server: {
    fs: {
      strict: false
    }
  }
});