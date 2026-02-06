import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Actualiza el SW automáticamente cuando hay cambios
      includeAssets: ['icon-192.png', 'icon-512.png'], // Archivos estáticos en /public
      manifest: {
        name: 'FasTPV',
        short_name: 'FasTPV',
        description: 'Sistema de Control de Ciber y Punto de Venta',
        theme_color: '#0f172a',
        background_color: '#f2f2f7',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Cachear todos los archivos generados por Vite
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Aumentar límite de tamaño de caché (útil si alguna librería es grande)
        maximumFileSizeToCacheInBytes: 4000000,
        // Cachear fuentes o recursos externos si fuera necesario (opcional)
        runtimeCaching: [{
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }]
      }
    })
  ],
})
