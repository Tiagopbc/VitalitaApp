import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = fileURLToPath(new URL('.', import.meta.url))
  const env = loadEnv(mode, rootDir, '')
  const pwaWorkboxMode = env.VITE_PWA_MODE || (mode === 'development' ? 'development' : 'production')

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
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'bg-share-dumbbells.jpg'],
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
    modulePreload: {
      resolveDependencies: (_filename, deps) => deps.filter(dep => !dep.includes('vendor-framer'))
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase-app': ['firebase/app'],
          'vendor-firebase-auth': ['firebase/auth'],
          'vendor-firebase-firestore': ['firebase/firestore'],
          'vendor-charts': ['recharts'],
          'vendor-lucide': ['lucide-react'],
          'vendor-sonner': ['sonner'],
        },
      },
    },
  },
})
})
