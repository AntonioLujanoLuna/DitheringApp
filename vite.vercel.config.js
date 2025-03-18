import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Simplified config for Vercel - no PWA
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    exclude: ['@rollup/rollup-linux-x64-gnu']
  },
  build: {
    rollupOptions: {
      makeAbsoluteExternalsRelative: false,
      external: [/@rollup\/rollup-.*-gnu/]
    }
  }
})