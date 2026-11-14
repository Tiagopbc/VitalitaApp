import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

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
/**
 * Digest do arquivo servido por um href de `public/`. Vazio quando o href é
 * externo, ausente ou o arquivo não existe — sem arquivo não há o que somar,
 * e uma assinatura estável é melhor do que uma que oscila.
 */
function readPublicAssetDigest(rootUrl, href) {
  if (!href || /^(https?:)?\/\//i.test(href)) return ''
  const relative = href.replace(/^\/+/, '').split(/[?#]/)[0]
  if (!relative) return ''
  try {
    return createHash('sha1')
      .update(readFileSync(new URL(`public/${relative}`, rootUrl)))
      .digest('hex')
  } catch {
    return ''
  }
}

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

  const iconHref = attrOf(/<link[^>]*rel="apple-touch-icon"[^>]*>/i, 'href')

  // `apple-mobile-web-app-title` manda no nome do atalho quando existe, e só
  // na ausência dele o <title> vale. Assinar os dois faria uma mudança de
  // <title> puramente de SEO — que não altera atalho nenhum — mandar todo
  // usuário de iPhone reinstalar à toa.
  const shortcutName = attrOf(/<meta[^>]*apple-mobile-web-app-title[^>]*>/i, 'content')
    || (html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '').trim()

  const parts = [
    attrOf(/<meta[^>]*apple-mobile-web-app-status-bar-style[^>]*>/i, 'content'),
    iconHref,
    // O caminho do ícone quase nunca muda quando o ícone muda: trocar o PNG
    // mantendo o nome é o fluxo normal, e é exatamente o caso que exige
    // reinstalar — o iOS guarda a imagem capturada na instalação. Só o href
    // deixaria essa troca passar batido.
    readPublicAssetDigest(rootUrl, iconHref),
    shortcutName
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
        importScripts: ['push-sw.js'],
        // O login com Google abre /__/auth/handler e /__/auth/iframe no próprio
        // domínio (a Vercel repassa ao Firebase, ver vercel.json e #149). Sem esta
        // exclusão o service worker responderia essas navegações com o
        // index.html antes de chegarem à Vercel, e o login quebraria para quem
        // já tem o PWA instalado.
        navigateFallbackDenylist: [/^\/__\/auth\//]
      },
      devOptions: {
        enabled: mode === 'development'
      },
      includeAssets: ['apple-touch-icon.png', 'bg-share-dumbbells.jpg'],
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
    // Grupos do Rolldown (vite 8). Cada grupo leva junto as dependências dos
    // módulos que captura (`includeDependenciesRecursively`, padrão do Rolldown
    // e o que evita chunk circular), então a PRIORIDADE segue a direção das
    // dependências: quem é dependência vem antes de quem depende dele. Medido
    // em 13/11/2026: só com o React na frente, o grupo do Firestore arrastava a
    // base do Firebase e o chunk inteiro (165 KB gzip) entrava no boot.
    //
    // O `vendor-firebase-app` casa `app/` com a barra de propósito: sem ela,
    // `@firebase/app-check` caía no grupo e carregava no boot, quando o
    // appCheckService o importa sob demanda. `vite.config.test.js` trava isso.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 60 },
            {
              name: 'vendor-firebase-app',
              test: /node_modules[\\/](firebase[\\/]app[\\/]|@firebase[\\/](app|util|component|logger)[\\/]|idb[\\/])/,
              priority: 55
            },
            { name: 'vendor-router', test: /node_modules[\\/](react-router|react-router-dom)[\\/]/, priority: 50 },
            { name: 'vendor-firebase-auth', test: /node_modules[\\/](firebase[\\/]auth|@firebase[\\/]auth)[\\/]/, priority: 40 },
            { name: 'vendor-firebase-firestore', test: /node_modules[\\/](firebase[\\/]firestore|@firebase[\\/]firestore)[\\/]/, priority: 40 },
            { name: 'vendor-lucide', test: /node_modules[\\/]lucide-react[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
})
})
