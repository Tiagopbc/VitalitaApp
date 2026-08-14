import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExecutionTopBar } from './ExecutionTopBar';

describe('ExecutionTopBar', () => {
    const baseProps = {
        onBack: vi.fn(),
        onDiscard: vi.fn(),
        onOpenGymTools: vi.fn(),
        showGymTools: false,
        showTimer: false,
        onToggleTimer: vi.fn(),
        focusMode: false,
        onToggleFocus: vi.fn()
    };

    it('shows the Cancelar treino button outside focus mode', () => {
        render(<ExecutionTopBar {...baseProps} />);
        fireEvent.click(screen.getByRole('button', { name: 'Cancelar treino' }));
        expect(baseProps.onDiscard).toHaveBeenCalledTimes(1);
    });

    it('hides the Cancelar treino button in focus mode', () => {
        render(<ExecutionTopBar {...baseProps} focusMode />);
        expect(screen.queryByRole('button', { name: 'Cancelar treino' })).not.toBeInTheDocument();
    });

    // No WebKit do iPhone, um elemento com `backdrop-filter` vira camada de
    // composição e os filhos são rasterizados fora da resolução nativa — o
    // texto dos botões saía borrado. Nenhum nó desta árvore pode ter a classe.
    it('não usa backdrop-filter em lugar nenhum da barra', () => {
        const { container } = render(<ExecutionTopBar {...baseProps} />);

        const comBlur = [...container.querySelectorAll('*')]
            .filter(node => /backdrop-blur/.test(node.className || ''));

        expect(comBlur).toHaveLength(0);
    });

    // O painel é opaco porque translúcido só faz sentido com o blur que saiu:
    // sem ele, o conteúdo rolando por baixo apareceria cru através da barra.
    it('mantém o painel opaco', () => {
        const { container } = render(<ExecutionTopBar {...baseProps} />);

        expect(container.firstChild.className).toMatch(/bg-slate-950(?!\/)/);
    });
});
