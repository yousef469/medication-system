import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Clinical Hub',
        short_name: 'MedicationSystem',
        description: 'Advanced Healthcare Monitoring and Medication System',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icons/med-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/med-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/med-icon-512.png',
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
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
