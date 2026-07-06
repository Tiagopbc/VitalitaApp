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
      registerType: 'prompt',
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
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          const packageId = id.split('node_modules/').pop()

          if (packageId.startsWith('react/') || packageId.startsWith('react-dom/') || packageId.startsWith('scheduler/')) {
            return 'vendor-react'
          }
          if (packageId.startsWith('react-router/') || packageId.startsWith('react-router-dom/')) return 'vendor-router'
          if (packageId.startsWith('firebase/app') || packageId.startsWith('@firebase/app')) return 'vendor-firebase-app'
          if (packageId.startsWith('firebase/auth') || packageId.startsWith('@firebase/auth')) return 'vendor-firebase-auth'
          if (packageId.startsWith('firebase/firestore') || packageId.startsWith('@firebase/firestore')) return 'vendor-firebase-firestore'
          if (packageId.startsWith('recharts/')) return 'vendor-recharts'
          if (packageId.startsWith('victory-vendor/') || packageId.startsWith('d3-')) return 'vendor-chart-vendor'
          if (packageId.startsWith('lucide-react/')) return 'vendor-lucide'
          if (packageId.startsWith('sonner/')) return 'vendor-sonner'

          return undefined
        },
      },
    },
  },
})
})
