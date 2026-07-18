/**
 * theme.js
 * Tema claro/escuro do Vitalità.
 * O tema é aplicado via atributo data-theme no <html>; o CSS em index.css
 * remapeia as variáveis de paleta. Escuro é o padrão (sem atributo).
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

export function applyTheme(theme) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === THEMES.light) {
        root.dataset.theme = THEMES.light;
    } else {
        delete root.dataset.theme;
    }
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
