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
            // Sem `include`, o Vitest 4 só mede os arquivos que algum teste
            // carrega: um módulo novo sem teste ficaria fora do numerador e do
            // denominador, e o piso não pegaria a regressão.
            include: ['src/**/*.{js,jsx}', 'api/**/*.js'],
            exclude: ['**/*.{test,spec}.{js,jsx}', 'src/test/**'],
            // Piso medido em 22/10/2026 sobre todo o código de src/ e api/: um
            // ponto abaixo da pior de várias rodadas. A cobertura do
            // HistoryPage.test varia entre execuções (158 ou 181 de 304 linhas
            // do HistoryPage), o que mexe ~0,5 ponto no total; piso colado na
            // medição faria o CI reprovar ao acaso.
            // Serve para a cobertura não regredir: suba junto quando um PR a
            // melhorar.
            thresholds: {
                lines: 53,
                statements: 51,
                functions: 49,
                branches: 47
            }
        },
    },
    resolve: {
        alias: {
            '@': path.resolve('./src'),
        },
    },
});
