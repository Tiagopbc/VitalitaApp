import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from '../../pages/LoginPage';

vi.mock('../../services/authService', () => ({ authService: {} }));

// O login tinha fundo de página e de cartão em gradientes escuros escritos no
// `style`, que não mudam de tema: no claro, o texto (que inverte) ficava
// escuro sobre fundo escuro. Os fundos passam a ser classes com versão clara,
// e o botão do Google fica branco nos dois temas.
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('login nos dois temas', () => {
    it('página e cartão usam as classes de fundo, sem gradiente fixo no style', () => {
        const { container } = render(<LoginPage />);
        const pagina = container.firstChild;
        expect(pagina).toHaveClass('vit-auth-bg');
        expect(pagina.getAttribute('style') || '').not.toMatch(/gradient/);

        const cartao = container.querySelector('.vit-auth-card');
        expect(cartao).not.toBeNull();
        expect(cartao.getAttribute('style') || '').not.toMatch(/gradient/);
    });

    it('o botão do Google tem fundo branco literal, que o tema claro não inverte', () => {
        render(<LoginPage />);
        const google = screen.getByText('Continue with Google').closest('button');
        expect(google.className).toMatch(/(^|\s)bg-\[#fff\](\s|$)/);
        expect(google.className).not.toMatch(/(^|\s)bg-white(\s|$)/);
    });

    it('as classes de fundo do login têm versão escura e clara no CSS', () => {
        const css = fs.readFileSync(path.join(raiz, 'index.css'), 'utf8');
        expect(css).toMatch(/\.vit-auth-bg\s*\{/);
        expect(css).toMatch(/\.vit-auth-card\s*\{/);
        expect(css).toMatch(/:root\[data-theme="light"\] \.vit-auth-bg\s*\{/);
        expect(css).toMatch(/:root\[data-theme="light"\] \.vit-auth-card\s*\{/);
    });
});
