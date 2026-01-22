import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Clinical Hub',
        short_name: 'MedicationSystem',
        id: '/?nuclear_v=6',
        description: 'Advanced Healthcare Monitoring and Medication System - v4.0.1',
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
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('[Vite Proxy] Error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('[Vite Proxy] Sending Request to Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('[Vite Proxy] Received Response from Target:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})
