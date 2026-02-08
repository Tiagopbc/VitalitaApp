import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const pwaWorkboxMode = process.env.VITE_PWA_MODE || (mode === 'development' ? 'development' : 'production');

  return ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        mode: pwaWorkboxMode
      },
      devOptions: {
        enabled: mode === 'development'
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Vitalita Training App',
        short_name: 'Vitalita',
        description: 'Seu app de treino inteligente',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true, // Listen on all addresses
    port: 5175,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase-app': ['firebase/app'],
          'vendor-firebase-auth': ['firebase/auth'],
          'vendor-firebase-firestore': ['firebase/firestore'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-sonner': ['sonner'],
        },
      },
    },
  },
})
})
