/**
 * theme.js
 * Tema claro/escuro do Vitalità.
 * O tema é aplicado via atributo data-theme no <html>; o CSS em index.css
 * remapeia as variáveis de paleta. Escuro é o padrão (sem atributo).
 *
 * A meta theme-color (cor da barra do navegador) acompanha o tema. A barra de
 * status do PWA no iOS não: ela vem de apple-mobile-web-app-status-bar-style,
 * que o iOS só lê ao instalar (ver index.html).
 */
import { safeGetItem, safeSetItem } from './storage';

const THEME_STORAGE_KEY = 'vitalita_theme_v1';

export const THEMES = {
    dark: 'dark',
    light: 'light'
};

export function getStoredTheme() {
    const stored = safeGetItem(THEME_STORAGE_KEY);
    return stored === THEMES.light ? THEMES.light : THEMES.dark;
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

export function setTheme(theme) {
    const normalized = theme === THEMES.light ? THEMES.light : THEMES.dark;
    safeSetItem(THEME_STORAGE_KEY, normalized);
    applyTheme(normalized);
    return normalized;
}

/**
 * Aplica o tema salvo antes do primeiro render (evita flash do tema errado).
 */
export function initTheme() {
    applyTheme(getStoredTheme());
}
