import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.js',
        include: [
            'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            'api/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'
        ],
        coverage: {
            // json-summary grava coverage/coverage-summary.json, para consultar
            // a cobertura por arquivo sem reler a tabela do terminal.
            reporter: ['text', 'json-summary'],
            // Piso medido em 22/10/2026: um ponto abaixo da pior de várias
            // rodadas. A cobertura do HistoryPage.test varia entre execuções
            // (158 ou 181 de 304 linhas do HistoryPage), o que mexe ~0,6 ponto
            // no total; piso colado na medição faria o CI reprovar ao acaso.
            // Serve para a cobertura não regredir: suba junto quando um PR a
            // melhorar.
            thresholds: {
                lines: 69,
                statements: 66,
                functions: 64,
                branches: 61
            }
        },
    },
    resolve: {
        alias: {
            '@': path.resolve('./src'),
        },
    },
});
