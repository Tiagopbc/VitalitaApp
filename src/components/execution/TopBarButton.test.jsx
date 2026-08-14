import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Calculator } from 'lucide-react';
import { TopBarButton } from './TopBarButton';

const renderBotao = (props = {}) =>
    render(<TopBarButton icon={<Calculator />} label="CALC" onClick={vi.fn()} {...props} />);

describe('TopBarButton', () => {
    // Estes botões ficam dentro do painel da ExecutionTopBar, que já aplica
    // `backdrop-blur-xl`. O blur aninhado não mudava nada no visual e desenhava
    // um halo nas bordas arredondadas no iPhone — ver o comentário no componente.
    it('não aplica desfoque de fundo em nenhuma variante', () => {
        for (const variant of ['default', 'primary', 'danger']) {
            const { unmount } = renderBotao({ variant });
            expect(screen.getByRole('button').className).not.toMatch(/backdrop-blur/);
            unmount();
        }
    });

    // O ativo se marca por contorno. Sombra volta a espalhar luz em volta da
    // pílula, que é exatamente o que esta mudança removeu.
    it.each([['ligado', true], ['desligado', false]])('não usa sombra quando %s', (_, active) => {
        renderBotao({ active });

        expect(screen.getByRole('button').className).not.toMatch(/shadow-/);
    });

    // A distinção ligado/desligado já quase se perdeu uma vez, quando o inativo
    // foi clareado para perto do ativo.
    it('distingue ligado de desligado', () => {
        const { unmount } = renderBotao({ active: true });
        const ligado = screen.getByRole('button').className;
        unmount();

        renderBotao({ active: false });
        const desligado = screen.getByRole('button').className;

        expect(ligado).not.toBe(desligado);
        expect(ligado).toMatch(/cyan/);
        expect(desligado).not.toMatch(/cyan/);
    });

    it('mostra o rótulo, e o esconde no modo icon-only', () => {
        const { unmount } = renderBotao();
        expect(screen.getByText('CALC')).toBeInTheDocument();
        unmount();

        renderBotao({ iconOnly: true });
        expect(screen.queryByText('CALC')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'CALC' })).toBeInTheDocument();
    });
});
