import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConfirmFinishModal } from './ConfirmFinishModal';

/**
 * O botão de confirmar usa a variante `success`, que já traz fundo e cor de
 * texto. Quando o `className` do modal também trazia `bg-*` e `text-*`, os dois
 * brigavam na folha de estilo: venceu o gradiente no fundo e o verde claro no
 * texto, resultando em verde sobre verde a 1,10:1 — bem abaixo do mínimo de
 * 4,5:1 do WCAG AA.
 */
describe('ConfirmFinishModal', () => {
    function renderizar() {
        render(<ConfirmFinishModal onClose={vi.fn()} onConfirm={vi.fn()} />);
        return screen.getByRole('button', { name: /confirmar/i });
    }

    it('mostra título, descrição e as duas ações', () => {
        render(<ConfirmFinishModal onClose={vi.fn()} onConfirm={vi.fn()} />);
        expect(screen.getByText('Finalizar Treino?')).toBeInTheDocument();
        expect(screen.getByText(/registrou todas as séries/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
    });

    it('não sobrepõe o fundo da variante success', () => {
        const classes = renderizar().className;
        expect(classes).not.toMatch(/\bbg-green-/);
    });

    it('não sobrepõe a cor de texto da variante success', () => {
        const classes = renderizar().className;
        expect(classes).not.toMatch(/\btext-green-/);
    });

    it('usa texto escuro sobre o gradiente verde, não branco', () => {
        const classes = renderizar().className;
        expect(classes).toMatch(/\btext-slate-900\b/);
        expect(classes).not.toMatch(/text-\[#fff\]/);
    });
});
