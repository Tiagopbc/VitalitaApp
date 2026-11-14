/**
 * theme.js
 * Tema claro/escuro do Vitalità.
 * O tema é aplicado via atributo data-theme no <html>; o CSS em index.css
 * remapeia as variáveis de paleta. Escuro é o padrão (sem atributo).
 *
 * O que se salva é a PREFERÊNCIA: escuro, claro ou "system" (Automático, segue
 * o prefers-color-scheme do aparelho e acompanha a troca em tempo real). Quem
 * nunca escolheu continua no escuro.
 *
 * A meta theme-color (cor da barra do navegador) acompanha o tema. A barra de
 * status do PWA no iOS não: ela vem de apple-mobile-web-app-status-bar-style,
 * que o iOS só lê ao instalar (ver index.html).
 */
import { safeGetItem, safeSetItem } from './storage';

const THEME_STORAGE_KEY = 'vitalita_theme_v1';

export const THEMES = {
    dark: 'dark',
    light: 'light',
    system: 'system'
};

const SYSTEM_LIGHT_QUERY = '(prefers-color-scheme: light)';

function normalizeTheme(theme) {
    return theme === THEMES.light || theme === THEMES.system ? theme : THEMES.dark;
}

/** Preferência salva: 'dark' (padrão), 'light' ou 'system'. */
export function getStoredTheme() {
    return normalizeTheme(safeGetItem(THEME_STORAGE_KEY));
}

function systemMediaQuery() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
    return window.matchMedia(SYSTEM_LIGHT_QUERY);
}

/** Tema que de fato vai para a tela. Sem matchMedia, Automático vale como escuro. */
function resolveTheme(preference) {
    if (preference === THEMES.system) {
        return systemMediaQuery()?.matches ? THEMES.light : THEMES.dark;
    }
    return preference;
}

// Cor da barra do navegador em cada tema: o fundo das telas (--vit-surface no
// claro, o slate-900 do index.html no escuro).
const THEME_COLORS = {
    dark: '#0f172a',
    light: '#f1f5f9'
};

function applyTheme(theme) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === THEMES.light) {
        root.dataset.theme = THEMES.light;
    } else {
        delete root.dataset.theme;
    }
    document.querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.dark);
}

// No Automático, um único ouvinte reaplica o tema quando o aparelho troca de
// claro para escuro (ou o contrário). Sair do Automático o remove.
let stopFollowingSystem = null;

function followSystem(active) {
    stopFollowingSystem?.();
    stopFollowingSystem = null;
    if (!active) return;
    const query = systemMediaQuery();
    if (!query?.addEventListener) return;
    const onChange = () => applyTheme(resolveTheme(THEMES.system));
    query.addEventListener('change', onChange);
    stopFollowingSystem = () => query.removeEventListener('change', onChange);
}

/** Salva a preferência, aplica o tema resolvido e devolve a preferência. */
export function setTheme(theme) {
    const preference = normalizeTheme(theme);
    safeSetItem(THEME_STORAGE_KEY, preference);
    applyTheme(resolveTheme(preference));
    followSystem(preference === THEMES.system);
    return preference;
}

/**
 * Aplica o tema salvo antes do primeiro render (evita flash do tema errado).
 */
export function initTheme() {
    const preference = getStoredTheme();
    applyTheme(resolveTheme(preference));
    followSystem(preference === THEMES.system);
}
