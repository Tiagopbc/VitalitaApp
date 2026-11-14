import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Um `*/` dentro do texto de um comentário (ex.: "classes slate-*/opacidade")
// fecha o comentário antes da hora: o resto da frase vira lixo no seletor da
// regra seguinte, e o minificador descarta essa regra inteira sem erro de build.
// Foi assim que a regra de `bg-slate-400/20` sumiu do tema claro até 13/11/2026.
const raiz = path.dirname(fileURLToPath(import.meta.url));

function arquivosCss(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const caminho = path.join(dir, e.name);
        if (e.isDirectory()) return arquivosCss(caminho);
        return e.name.endsWith('.css') ? [caminho] : [];
    });
}

describe('comentários dos CSS de src/', () => {
    for (const arquivo of arquivosCss(raiz)) {
        it(`${path.relative(raiz, arquivo)} não tem comentário fechado antes da hora`, () => {
            // Troca cada comentário pelas próprias quebras de linha, para o
            // número da linha apontada continuar sendo o do arquivo.
            const semComentarios = fs.readFileSync(arquivo, 'utf8')
                .replace(/\/\*[\s\S]*?\*\//g, (comentario) => comentario.replace(/[^\n]/g, ''));
            const sobras = semComentarios
                .split('\n')
                .map((linha, i) => ({ linha: i + 1, texto: linha.trim() }))
                .filter(({ texto }) => texto.includes('*/'));
            expect(sobras).toEqual([]);
        });
    }
});
