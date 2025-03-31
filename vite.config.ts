// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // This is important for GitHub Pages
  build: {
    outDir: 'docs', // GitHub Pages can serve from /docs folder
  }
});