import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

    describe('Automático (segue o sistema)', () => {
        // jsdom não tem matchMedia: simula o "prefers-color-scheme" com
        // ouvintes de verdade, para dá para disparar a troca do sistema.
        let sistemaClaro;
        let ouvintes;

        function trocarSistema(claro) {
            sistemaClaro = claro;
            ouvintes.forEach((fn) => fn({ matches: claro }));
        }

        beforeEach(() => {
            sistemaClaro = false;
            ouvintes = new Set();
            vi.stubGlobal('matchMedia', (query) => ({
                get matches() { return query.includes('light') && sistemaClaro; },
                media: query,
                addEventListener: (_tipo, fn) => ouvintes.add(fn),
                removeEventListener: (_tipo, fn) => ouvintes.delete(fn)
            }));
        });

        afterEach(() => {
            setTheme(THEMES.dark);
            vi.unstubAllGlobals();
        });

        it('salva a preferência "system" e devolve ela para a tela', () => {
            expect(setTheme(THEMES.system)).toBe(THEMES.system);
            expect(localStorage.getItem(CHAVE)).toBe('system');
            expect(getStoredTheme()).toBe(THEMES.system);
        });

        it('com o sistema no claro, aplica o tema claro, inclusive na barra', () => {
            sistemaClaro = true;
            setTheme(THEMES.system);
            expect(document.documentElement.dataset.theme).toBe('light');
            expect(metaThemeColor()).toHaveAttribute('content', '#f1f5f9');
        });

        it('com o sistema no escuro, fica no escuro', () => {
            setTheme(THEMES.system);
            expect(document.documentElement.dataset.theme).toBeUndefined();
        });

        it('acompanha a troca do sistema em tempo real', () => {
            setTheme(THEMES.system);
            trocarSistema(true);
            expect(document.documentElement.dataset.theme).toBe('light');
            trocarSistema(false);
            expect(document.documentElement.dataset.theme).toBeUndefined();
        });

        it('ao sair do Automático, para de acompanhar o sistema', () => {
            setTheme(THEMES.system);
            setTheme(THEMES.dark);
            trocarSistema(true);
            expect(document.documentElement.dataset.theme).toBeUndefined();
            expect(ouvintes.size).toBe(0);
        });

        it('ao abrir o app com Automático salvo, aplica e passa a acompanhar', () => {
            localStorage.setItem(CHAVE, 'system');
            sistemaClaro = true;
            initTheme();
            expect(document.documentElement.dataset.theme).toBe('light');
            trocarSistema(false);
            expect(document.documentElement.dataset.theme).toBeUndefined();
        });

        it('sem matchMedia (navegador antigo), Automático vale como escuro e não quebra', () => {
            vi.stubGlobal('matchMedia', undefined);
            expect(() => setTheme(THEMES.system)).not.toThrow();
            expect(document.documentElement.dataset.theme).toBeUndefined();
        });
    });
});
