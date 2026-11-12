import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// No tema claro, `--color-white` vira tinta escura (index.css) — certo para
// texto sobre superfície neutra, errado sobre fundo colorido: o texto de um
// botão azul ou de uma barra verde ficava azul-marinho. Sobre cor, use
// `text-on-color` (sempre branco, nos dois temas).
//
// Este teste pega o caso em que o texto e o fundo estão na mesma string de
// classes. Ícone dentro de um fundo colorido do elemento pai (avatar, botão
// redondo de play) não aparece numa busca por string: lá, use text-on-color
// também.
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MATIZ = '(cyan|blue|emerald|green|red|amber|orange|purple|violet|indigo|teal|rose|pink|sky|lime|yellow)';
// Fundo saturado: cor sólida 400–800, ou gradiente que começa nela, sem
// opacidade baixa (/10 a /49 deixa o fundo translúcido, e aí inverter é certo).
const FUNDO_SATURADO = new RegExp(`(?:^|[\\s'"\`])(?:bg|from)-${MATIZ}-[4-8]00(?!/[1-4]\\d\\b)`);

function arquivosJsx(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) return arquivosJsx(p);
        return /\.jsx$/.test(e.name) && !/\.test\.jsx$/.test(e.name) ? [p] : [];
    });
}

function stringsDeClasse(fonte) {
    // Template literals inteiros (com as expressões dentro) e strings simples.
    return [...fonte.matchAll(/`[^`]*`|"[^"\n]*"|'[^'\n]*'/g)].map((m) => ({
        texto: m[0],
        linha: fonte.slice(0, m.index).split('\n').length
    }));
}

describe('texto branco sobre fundo colorido', () => {
    it('nenhuma string de classe junta text-white com fundo saturado', () => {
        const violacoes = [];
        for (const arquivo of arquivosJsx(raiz)) {
            const fonte = fs.readFileSync(arquivo, 'utf8');
            for (const { texto, linha } of stringsDeClasse(fonte)) {
                if (/(?:^|[\s`"'])text-white(?![\w-])/.test(texto) && FUNDO_SATURADO.test(texto)) {
                    violacoes.push(`${path.relative(raiz, arquivo)}:${linha}`);
                }
            }
        }
        expect(violacoes).toEqual([]);
    });

    it('o tema claro não redefine o text-on-color', () => {
        const css = fs.readFileSync(path.join(raiz, 'index.css'), 'utf8');
        expect(css).toMatch(/--color-on-color:\s*#fff(fff)?;/);
        const blocoClaro = css.slice(css.indexOf(':root[data-theme="light"] {'));
        expect(blocoClaro.slice(0, blocoClaro.indexOf('}'))).not.toMatch(/--color-on-color/);
    });
});
