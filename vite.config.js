import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000 // 5MB limit
      },
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Clinical Hub Recovery',
        short_name: 'MedicationSystem',
        id: '/?nuclear_v=9',
        description: 'Advanced Healthcare Monitoring and Medication System - v4.1.3',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icons/med-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/med-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/med-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('[Vite Proxy] Error:', err);
          });
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('[Vite Proxy] Sending Request to Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('[Vite Proxy] Received Response from Target:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})
