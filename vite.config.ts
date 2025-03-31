// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/DitheringApp/', // GitHub Pages repository name
  build: {
    outDir: 'docs', // GitHub Pages can serve from /docs folder
    assetsDir: 'assets', // Keep assets in a separate folder
    minify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined, // Keep everything in a single chunk for simplicity
      },
    },
  }
});