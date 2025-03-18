import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    exclude: ['@rollup/rollup-linux-x64-gnu', '@rollup/rollup-darwin-x64', '@rollup/rollup-darwin-arm64']
  },
  build: {
    rollupOptions: {
      external: [/@rollup\/rollup-.*-gnu/, /@rollup\/rollup-.*-darwin/],
      makeAbsoluteExternalsRelative: false
    }
  }
});