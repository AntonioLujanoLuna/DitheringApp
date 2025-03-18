// vite.vercel.config.js - Special config for Vercel deployment without PWA
const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
// NO PWA imports for Vercel

// https://vitejs.dev/config/
module.exports = defineConfig({
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