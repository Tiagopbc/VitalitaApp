import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// No tema claro, texto de destaque em tom claro (text-cyan-400, text-amber-200…)
// some sobre fundo claro, e tinta escura de fundo (bg-emerald-900/40…) vira um
// borrão. theme-light-accents.css corrige cada classe usada; este teste garante
// que uma classe nova não escape (medido em 13/11/2026 nas telas internas).
const raiz = path.dirname(fileURLToPath(import.meta.url));
const CORES = 'cyan|sky|blue|indigo|emerald|green|teal|lime|amber|yellow|orange|red|rose|pink|purple|violet|fuchsia';
const TEXTO = new RegExp(`(?<![\\w:/-])text-(?:${CORES})-(?:100|200|300|400|500)(?:/\\d+)?(?![\\w/-])`, 'g');
const TINTA = new RegExp(`(?<![\\w:/-])bg-(?:${CORES})-(?:800|900|950)(?:/\\d+)?(?![\\w/-])`, 'g');

function arquivos(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const caminho = path.join(dir, e.name);
        if (e.isDirectory()) return e.name === 'test' ? [] : arquivos(caminho);
        return /\.(jsx?|tsx?)$/.test(e.name) && !/\.test\./.test(e.name) ? [caminho] : [];
    });
}

const usadas = (padrao) => [...new Set(arquivos(raiz).flatMap((f) => fs.readFileSync(f, 'utf8').match(padrao) ?? []))].sort();

const css = fs.readFileSync(path.join(raiz, 'theme-light-accents.css'), 'utf8');
const regras = new Map(
    [...css.matchAll(/\[class~="([^"]+)"\][^{]*\{\s*(?:color|background-color):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
);

function luminancia(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
        .map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
        .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
}
const contrasteNoBranco = (hex) => 1.05 / (luminancia(hex) + 0.05);

describe('destaques no tema claro (theme-light-accents.css)', () => {
    it('cobre toda classe de texto de destaque usada em src/', () => {
        expect(usadas(TEXTO).filter((c) => !regras.has(c))).toEqual([]);
    });

    it('cobre toda tinta escura de fundo usada em src/', () => {
        expect(usadas(TINTA).filter((c) => !regras.has(c))).toEqual([]);
    });

    it('dá ao texto de destaque sem opacidade contraste de 4,5 sobre branco', () => {
        const fracos = [...regras]
            .filter(([classe, cor]) => classe.startsWith('text-') && !classe.includes('/') && cor.startsWith('#'))
            .filter(([, cor]) => contrasteNoBranco(cor) < 4.5)
            .map(([classe, cor]) => `${classe} ${cor} ${contrasteNoBranco(cor).toFixed(2)}`);
        expect(fracos).toEqual([]);
    });

    it('não toca nas subárvores travadas no escuro (cards de compartilhamento)', () => {
        const seletores = [...css.matchAll(/^([^{}@/*][^{]*)\{/gm)].map((m) => m[1].trim());
        expect(seletores.length).toBeGreaterThan(0);
        expect(seletores.filter((s) => !s.includes(':not(.theme-dark-locked, .theme-dark-locked *)'))).toEqual([]);
    });
});
