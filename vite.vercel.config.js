import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

console.log('Loading vite.vercel.config.js with ROLLUP_NATIVE_EXTENSIONS=', process.env.ROLLUP_NATIVE_EXTENSIONS);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    exclude: [
      '@rollup/rollup-linux-x64-gnu',
      '@rollup/rollup-darwin-x64', 
      '@rollup/rollup-darwin-arm64',
      '@rollup/rollup-win32-x64-msvc'
    ]
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      external: [
        /^@rollup\/rollup-.*-gnu$/,
        /^@rollup\/rollup-.*-darwin$/,
        /^@rollup\/rollup-.*-msvc$/
      ],
      makeAbsoluteExternalsRelative: false
    }
  },
  server: {
    fs: {
      strict: false
    }
  }
});