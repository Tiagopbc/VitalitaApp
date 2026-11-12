import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { THEMES, getStoredTheme, initTheme, setTheme } from './theme';

const CHAVE = 'vitalita_theme_v1';

// A cor da barra do navegador (meta theme-color) acompanha o tema: antes ela
// ficava fixa no azul-escuro e destoava do app no tema claro.
function metaThemeColor() {
    return document.querySelector('meta[name="theme-color"]');
}

describe('theme', () => {
    beforeEach(() => {
        localStorage.clear();
        delete document.documentElement.dataset.theme;
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        meta.setAttribute('content', '#0f172a');
        document.head.appendChild(meta);
    });

    afterEach(() => {
        metaThemeColor()?.remove();
        localStorage.clear();
        delete document.documentElement.dataset.theme;
    });

    it('sem nada salvo, o tema é o escuro', () => {
        expect(getStoredTheme()).toBe(THEMES.dark);
    });

    it('valor desconhecido salvo também vale como escuro', () => {
        localStorage.setItem(CHAVE, 'roxo');
        expect(getStoredTheme()).toBe(THEMES.dark);
    });

    it('tema claro: marca o html, salva a escolha e clareia a barra do navegador', () => {
        expect(setTheme(THEMES.light)).toBe(THEMES.light);
        expect(document.documentElement.dataset.theme).toBe('light');
        expect(localStorage.getItem(CHAVE)).toBe('light');
        expect(metaThemeColor()).toHaveAttribute('content', '#f1f5f9');
    });

    it('voltar ao escuro tira a marca do html e escurece a barra', () => {
        setTheme(THEMES.light);
        expect(setTheme(THEMES.dark)).toBe(THEMES.dark);
        expect(document.documentElement.dataset.theme).toBeUndefined();
        expect(localStorage.getItem(CHAVE)).toBe('dark');
        expect(metaThemeColor()).toHaveAttribute('content', '#0f172a');
    });

    it('ao abrir o app, aplica o tema salvo, inclusive na barra', () => {
        localStorage.setItem(CHAVE, 'light');
        initTheme();
        expect(document.documentElement.dataset.theme).toBe('light');
        expect(metaThemeColor()).toHaveAttribute('content', '#f1f5f9');
    });

    it('sem a meta theme-color na página, trocar de tema não quebra', () => {
        metaThemeColor().remove();
        expect(() => setTheme(THEMES.light)).not.toThrow();
        expect(document.documentElement.dataset.theme).toBe('light');
    });
});
