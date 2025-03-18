// vite.vercel.config.js - Special config for Vercel deployment without PWA
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// NO PWA imports for Vercel

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // No PWA plugin for Vercel builds
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
}); 