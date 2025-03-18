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
})