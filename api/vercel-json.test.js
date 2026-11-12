import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// O login com Google usa o authDomain no próprio domínio do app (#149): a
// Vercel repassa /__/auth/* ao handler do Firebase. Este teste lê o
// vercel.json como dado e segura as duas condições para isso funcionar.
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(path.join(raiz, 'vercel.json'), 'utf8'));

// As fontes do vercel.json usam a sintaxe do path-to-regexp; as daqui são
// grupos simples, que valem como RegExp ancorada.
const casa = (source, caminho) => new RegExp(`^${source}$`).test(caminho);

function primeiroRewrite(caminho) {
    return config.rewrites.find((r) => casa(r.source, caminho));
}

function valoresDoCabecalho(caminho, chave) {
    return config.headers
        .filter((regra) => casa(regra.source, caminho))
        .flatMap((regra) => regra.headers)
        .filter((h) => h.key === chave)
        .map((h) => h.value);
}

describe('vercel.json: login com Google no próprio domínio (#149)', () => {
    it('repassa /__/auth/* ao handler do Firebase antes do catch-all do app', () => {
        for (const caminho of ['/__/auth/handler', '/__/auth/iframe', '/__/auth/handler.js']) {
            const rewrite = primeiroRewrite(caminho);
            expect(rewrite?.destination, caminho).toBe('https://app-treino-17bbf.firebaseapp.com/__/auth/$1');
        }
    });

    it('o resto do app continua caindo no index.html', () => {
        expect(primeiroRewrite('/history').destination).toBe('/index.html');
        expect(primeiroRewrite('/').destination).toBe('/index.html');
    });

    // O SDK carrega /__/auth/iframe num iframe oculto do próprio app; com
    // DENY nem a mesma origem consegue emoldurá-lo e o login quebra.
    it('libera iframe só da mesma origem em /__/auth/* e mantém DENY no resto', () => {
        expect(valoresDoCabecalho('/__/auth/iframe', 'X-Frame-Options')).toEqual(['SAMEORIGIN']);
        expect(valoresDoCabecalho('/__/auth/handler', 'X-Frame-Options')).toEqual(['SAMEORIGIN']);
        expect(valoresDoCabecalho('/', 'X-Frame-Options')).toEqual(['DENY']);
        expect(valoresDoCabecalho('/history', 'X-Frame-Options')).toEqual(['DENY']);
    });

    it('os demais cabeçalhos de segurança valem também para /__/auth/*', () => {
        for (const chave of ['X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'Strict-Transport-Security']) {
            expect(valoresDoCabecalho('/__/auth/handler', chave), chave).toHaveLength(1);
            expect(valoresDoCabecalho('/history', chave), chave).toHaveLength(1);
        }
    });
});

// O service worker do PWA responde toda navegação com o index.html
// (navigateFallback). Sem excluir /__/auth/, a janela do login e o iframe do
// Firebase recebem o app no lugar do handler, antes de a requisição chegar
// ao rewrite acima — e o login com Google quebra para quem já tem o PWA.
describe('vite.config.js: service worker não intercepta /__/auth/ (#149)', () => {
    const vite = fs.readFileSync(path.join(raiz, 'vite.config.js'), 'utf8');
    const lista = vite.match(/navigateFallbackDenylist:\s*\[([^\]]*)\]/);

    it('declara uma lista de exclusão no fallback de navegação', () => {
        expect(lista, 'navigateFallbackDenylist ausente no bloco workbox').not.toBeNull();
    });

    it('a lista exclui as rotas do Firebase Auth e deixa as do app no fallback', () => {
        const padroes = [...lista[1].matchAll(/\/((?:\\\/|[^/])+)\/([a-z]*)/g)].map(([, corpo, flags]) => new RegExp(corpo, flags));
        const excluida = (caminho) => padroes.some((re) => re.test(caminho));
        expect(excluida('/__/auth/handler')).toBe(true);
        expect(excluida('/__/auth/iframe')).toBe(true);
        expect(excluida('/')).toBe(false);
        expect(excluida('/history')).toBe(false);
        expect(excluida('/workout/abc')).toBe(false);
    });
});

