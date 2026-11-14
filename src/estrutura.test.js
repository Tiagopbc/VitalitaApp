import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// A raiz de src/ é só o boot do app: entrada, App, árvore autenticada,
// inicialização do Firebase e do Sentry, CSS global e os testes desses
// arquivos. Componente e contexto moram em components/ e context/ (D15, #102).
const raiz = path.dirname(fileURLToPath(import.meta.url));

const PERMITIDOS = new Set([
    'App.jsx',
    'App.test.jsx',
    'AppAuthed.jsx',
    'main.jsx',
    'firebaseApp.js',
    'firebaseAuth.js',
    'firebaseDb.js',
    'sentry.js',
    'sentry.test.js',
    'index.css',
    'fonts.css',
    'fonts.test.js',
    'theme-light-compat.css',
    'cssComentarios.test.js',
    'estrutura.test.js'
]);

describe('raiz de src/', () => {
    it('só tem os arquivos de boot do app', () => {
        const arquivos = fs.readdirSync(raiz, { withFileTypes: true })
            .filter((e) => e.isFile() && !e.name.startsWith('.'))
            .map((e) => e.name)
            .filter((nome) => !PERMITIDOS.has(nome))
            .sort();
        expect(arquivos).toEqual([]);
    });
});
