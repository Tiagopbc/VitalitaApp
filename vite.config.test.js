// @vitest-environment node
import { describe, expect, it } from 'vitest';
import config from './vite.config.js';

// O vite 8 gera o bundle com o Rolldown, que ignora o `onlyExplicitManualChunks`
// do Rollup e arrasta as dependências de cada grupo para dentro dele. Estas
// regras vieram de medir o boot (13/11/2026): a prioridade segue a direção das
// dependências, senão o React vai parar no chunk de ícones ou a base do
// Firebase no chunk do Firestore — e o chunk inteiro entra no boot.
const resolvido = typeof config === 'function' ? config({ mode: 'production', command: 'build' }) : config;
const grupos = resolvido.build?.rolldownOptions?.output?.codeSplitting?.groups ?? [];

const modulo = (caminho) => `/projeto/node_modules/${caminho}`;

function grupoDe(id) {
    const candidatos = grupos.filter((g) => g.test.test(id));
    candidatos.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    return candidatos[0]?.name;
}

function prioridade(nome) {
    return grupos.find((g) => g.name === nome)?.priority ?? 0;
}

describe('divisão de chunks (vite.config.js)', () => {
    it('usa os grupos do Rolldown, não o manualChunks do Rollup', () => {
        expect(grupos.length).toBeGreaterThan(0);
        expect(resolvido.build?.rollupOptions?.output?.manualChunks).toBeUndefined();
        expect(resolvido.build?.rollupOptions?.output?.onlyExplicitManualChunks).toBeUndefined();
    });

    it('deixa o App Check fora de qualquer grupo, para carregar sob demanda', () => {
        expect(grupoDe(modulo('@firebase/app-check/dist/esm/index.esm.js'))).toBeUndefined();
        expect(grupoDe(modulo('firebase/app-check/dist/esm/index.esm.js'))).toBeUndefined();
    });

    it('põe a base comum do Firebase no vendor-firebase-app', () => {
        for (const caminho of [
            'firebase/app/dist/esm/index.esm.js',
            '@firebase/app/dist/esm/index.esm.js',
            '@firebase/util/dist/index.esm.js',
            '@firebase/component/dist/esm/index.esm.js',
            '@firebase/logger/dist/esm/index.esm.js',
            'idb/build/index.js'
        ]) {
            expect(grupoDe(modulo(caminho)), caminho).toBe('vendor-firebase-app');
        }
    });

    it('separa Auth, Firestore, React, router e ícones nos grupos de sempre', () => {
        expect(grupoDe(modulo('@firebase/auth/dist/esm/index.js'))).toBe('vendor-firebase-auth');
        expect(grupoDe(modulo('@firebase/firestore/dist/index.esm.js'))).toBe('vendor-firebase-firestore');
        expect(grupoDe(modulo('react/jsx-runtime.js'))).toBe('vendor-react');
        expect(grupoDe(modulo('react-dom/client.js'))).toBe('vendor-react');
        expect(grupoDe(modulo('react-router/dist/index.mjs'))).toBe('vendor-router');
        expect(grupoDe(modulo('lucide-react/dist/esm/icons/user.js'))).toBe('vendor-lucide');
    });

    it('dá prioridade a quem é dependência sobre quem depende dele', () => {
        expect(prioridade('vendor-react')).toBeGreaterThan(prioridade('vendor-lucide'));
        expect(prioridade('vendor-react')).toBeGreaterThan(prioridade('vendor-router'));
        expect(prioridade('vendor-firebase-app')).toBeGreaterThan(prioridade('vendor-firebase-auth'));
        expect(prioridade('vendor-firebase-app')).toBeGreaterThan(prioridade('vendor-firebase-firestore'));
    });
});
