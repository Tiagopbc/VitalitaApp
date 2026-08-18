import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

/**
 * Assinatura das configurações de janela: as três coisas que o iOS lê ao
 * MONTAR a janela do app instalado — estilo da status bar, ícone e nome do
 * atalho. Elas NÃO chegam pelo service worker; nem "Atualizar Agora" nem
 * matar o app as aplicam, só reinstalar pela tela de início. O comentário
 * longo no index.html conta a história completa.
 *
 * É extraída do próprio index.html de propósito. A alternativa — uma constante
 * que alguém precisa lembrar de bumpar ao mexer numa das tags — reproduziria
 * exatamente a falha silenciosa que esta assinatura existe para eliminar.
 */
function readWindowConfigSignature(rootUrl) {
  let html = ''
  try {
    html = readFileSync(new URL('index.html', rootUrl), 'utf8')
  } catch {
    // Sem o arquivo não há o que assinar; a checagem em runtime se desliga.
    return ''
  }

  // Casa a tag inteira pelo atributo que a identifica e só então extrai o
  // valor, para a ordem dos atributos não importar.
  const attrOf = (tagPattern, attr) => {
    const tag = html.match(tagPattern)?.[0] ?? ''
    return (tag.match(new RegExp(`${attr}\\s*=\\s*"([^"]*)"`, 'i'))?.[1] ?? '').trim()
  }

  const parts = [
    attrOf(/<meta[^>]*apple-mobile-web-app-status-bar-style[^>]*>/i, 'content'),
    attrOf(/<link[^>]*rel="apple-touch-icon"[^>]*>/i, 'href'),
    attrOf(/<meta[^>]*apple-mobile-web-app-title[^>]*>/i, 'content'),
    // Sem `apple-mobile-web-app-title`, o nome do atalho vem do <title>.
    (html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '').trim()
  ]

  // FNV-1a: estável entre execuções e curto o bastante para caber no log.
  let hash = 0x811c9dc5
  const text = parts.join('|')
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootDir = fileURLToPath(new URL('.', import.meta.url))
  const env = loadEnv(mode, rootDir, '')
  const systemEnv = globalThis.process?.env || {}
  const pwaWorkboxMode = env.VITE_PWA_MODE || (mode === 'development' ? 'development' : 'production')
  const appEnvironment = env.VITE_APP_ENV || systemEnv.VERCEL_ENV || mode
  const appVersion = env.VITE_APP_VERSION || systemEnv.VERCEL_GIT_COMMIT_SHA || 'local'
  const windowConfigSignature = readWindowConfigSignature(import.meta.url)

  return ({
  define: {
    'import.meta.env.VITE_APP_ENV': JSON.stringify(appEnvironment),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.VITE_WINDOW_CONFIG_SIGNATURE': JSON.stringify(windowConfigSignature)
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        mode: pwaWorkboxMode,
        importScripts: ['push-sw.js']
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
  // As portas são fixas de propósito: a restrição de referrer da API key do
  // Firebase só libera 5175 (dev) e 4173 (preview), e o console do Google não
  // aceita curinga de porta. `strictPort` faz o Vite falhar de imediato quando
  // a porta está ocupada, em vez de subir na vizinha — que carrega a página
  // normalmente mas quebra o login com `auth/requests-from-referer-...-blocked`.
  server: {
    host: true, // Listen on all addresses
    port: 5175,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
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

          return undefined
        },
      },
    },
  },
})
})
