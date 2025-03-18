import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Import PWA plugin directly
import { VitePWA } from 'vite-plugin-pwa'

// Check if PWA is disabled via environment variable
const isPWADisabled = process.env.DISABLE_PWA === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Conditionally include PWA plugin
    ...(!isPWADisabled ? [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Halftone Dithering App',
          short_name: 'Halftone',
          description: 'Create stunning vintage and comic book style artwork with dithering effects',
          theme_color: '#0ea5e9',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      })
    ] : []),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})