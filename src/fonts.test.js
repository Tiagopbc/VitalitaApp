import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// O app é pt-BR: só o subset latin (acentos e ç inclusos). Os arquivos são
// fontes variáveis, então cada família é um @font-face com a faixa de pesos
// que algum componente usa. Este teste segura o fonts.css e a pasta de fontes
// nesse tamanho — e impede que um peso fora da faixa volte pelo JSX.
const raiz = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(raiz, 'fonts.css'), 'utf8');
const pastaFontes = path.join(raiz, 'assets', 'fonts');

const semComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '');
const blocos = semComentarios.split('@font-face').slice(1).map((bloco) => ({
    familia: bloco.match(/font-family:\s*'([^']+)'/)?.[1],
    pesos: bloco.match(/font-weight:\s*([\d ]+);/)?.[1].trim(),
    arquivo: bloco.match(/url\('\.\/assets\/fonts\/([^']+)'\)/)?.[1],
    unicodeRange: bloco.match(/unicode-range:\s*([^;]+);/)?.[1]?.trim()
}));

const FAIXAS_PERMITIDAS = {
    Inter: '400 700',
    Outfit: '600 700',
    'JetBrains Mono': '400'
};

describe('fonts.css', () => {
    it('declara só o subset latin', () => {
        expect(blocos.length).toBeGreaterThan(0);
        for (const b of blocos) {
            expect(b.unicodeRange, b.familia).toMatch(/^U\+0000-00FF/);
        }
    });

    it('declara uma face variável por família, só com a faixa de pesos que o app usa', () => {
        const esperados = Object.entries(FAIXAS_PERMITIDAS).map(([familia, faixa]) => `${familia} ${faixa}`).sort();
        const declarados = blocos.map((b) => `${b.familia} ${b.pesos}`).sort();
        expect(declarados).toEqual(esperados);
    });

    it('cada arquivo referenciado existe e nenhum arquivo sobra na pasta', () => {
        const referenciados = blocos.map((b) => b.arquivo).sort();
        for (const arquivo of referenciados) {
            expect(fs.existsSync(path.join(pastaFontes, arquivo)), arquivo).toBe(true);
        }
        const naPasta = fs.readdirSync(pastaFontes).filter((f) => f.endsWith('.woff2')).sort();
        expect(naPasta).toEqual(referenciados);
    });
});

describe('pesos de fonte no JSX', () => {
    it('não usa peso sem arquivo correspondente', () => {
        const ocorrencias = [];
        const visitar = (dir) => {
            for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
                const caminho = path.join(dir, entrada.name);
                if (entrada.isDirectory()) visitar(caminho);
                else if (/\.jsx?$/.test(entrada.name) && !/\.test\.jsx?$/.test(entrada.name)) {
                    const conteudo = fs.readFileSync(caminho, 'utf8');
                    const achados = conteudo.match(/\bfont-(thin|extralight|light|extrabold|black)\b/g);
                    if (achados) ocorrencias.push(`${path.relative(raiz, caminho)}: ${achados.join(', ')}`);
                }
            }
        };
        visitar(raiz);
        expect(ocorrencias).toEqual([]);
    });
});
