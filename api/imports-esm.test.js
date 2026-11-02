// @vitest-environment node
/**
 * Carrega cada função de `api/` num Node de verdade, fora do Vite.
 *
 * Os outros testes desta pasta não enxergam erro de resolução de módulo: o
 * Vitest resolve imports pelo Vite, que aceita `./_lib/firebaseToken` sem
 * extensão. No runtime da Vercel o projeto é ESM e esse mesmo import derruba a
 * função antes da primeira linha, com ERR_MODULE_NOT_FOUND. Foi assim que o #119
 * tirou do ar o push de descanso e a importação por PDF com o CI todo verde.
 */
import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const API_DIR = path.dirname(fileURLToPath(import.meta.url));

// Lido do diretório, e não de uma lista à mão, para endpoint novo já nascer coberto.
const funcoes = readdirSync(API_DIR).filter(
    (arquivo) => arquivo.endsWith('.js') && !arquivo.endsWith('.test.js')
);

const execFileAsync = promisify(execFile);

async function tipoDoExportDefault(arquivo) {
    const url = pathToFileURL(path.join(API_DIR, arquivo)).href;
    const { stdout } = await execFileAsync(process.execPath, [
        '--input-type=module',
        '-e',
        `console.log(typeof (await import(${JSON.stringify(url)})).default)`
    ]);
    return stdout.trim();
}

describe('funções de api/ no Node, sem o Vite', () => {
    it.each(funcoes)('%s carrega e exporta o handler', async (arquivo) => {
        expect(await tipoDoExportDefault(arquivo)).toBe('function');
    }, 30_000);
});
