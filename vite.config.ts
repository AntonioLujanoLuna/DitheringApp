// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/DitheringApp/', // Updated to match the repository name exactly
  build: {
    outDir: 'docs', // GitHub Pages can serve from /docs folder
  }
});