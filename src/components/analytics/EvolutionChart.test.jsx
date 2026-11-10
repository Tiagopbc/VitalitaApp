import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EvolutionChart } from './EvolutionChart';

// Sem ResizeObserver no jsdom, o gráfico usa a largura de reserva; os testes
// olham estrutura e conteúdo, não pixels.
const ponto = (dateStr, weight) => ({ dateStr, weight, fullDate: new Date(2026, 9, 1) });

const serie = [
    ponto('01/09', 40),
    ponto('08/09', 42.5),
    ponto('15/09', 42.5),
    ponto('22/09', 45),
    ponto('29/09', 47.5),
    ponto('06/10', 47.5),
    ponto('13/10', 50)
];

describe('EvolutionChart', () => {
    it('sem dados mostra o estado vazio e nenhum svg', () => {
        render(<EvolutionChart data={[]} />);
        expect(screen.getByText('Sem evolução neste período')).toBeInTheDocument();
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('com N pontos desenha área, linha, grade e os dois eixos', () => {
        const { container } = render(<EvolutionChart data={serie} />);

        const svg = screen.getByRole('img');
        expect(svg.getAttribute('aria-label')).toMatch(/7 registros/);
        expect(svg.getAttribute('aria-label')).toMatch(/40 kg a 50 kg/);

        expect(container.querySelector('[data-chart="area"]')).toBeInTheDocument();
        expect(container.querySelector('[data-chart="line"]')).toBeInTheDocument();
        expect(container.querySelectorAll('[data-chart="grid"] line')).toHaveLength(5);

        // Eixo Y: cinco ticks de mín−5 a máx+5, como no gráfico anterior.
        const ticksY = [...container.querySelectorAll('[data-chart="axis-y"] text')].map((t) => t.textContent);
        expect(ticksY).toEqual(['55', '50', '45', '40', '35']);

        // Eixo X: até cinco datas, sempre com a primeira e a última.
        const ticksX = [...container.querySelectorAll('[data-chart="axis-x"] text')].map((t) => t.textContent);
        expect(ticksX.length).toBeLessThanOrEqual(5);
        expect(ticksX[0]).toBe('01/09');
        expect(ticksX.at(-1)).toBe('13/10');
    });

    it('com um ponto só mostra o ponto com rótulo e não desenha área', () => {
        const { container } = render(<EvolutionChart data={[ponto('01/09', 40)]} />);
        expect(container.querySelector('[data-chart="area"]')).not.toBeInTheDocument();
        expect(container.querySelector('[data-chart="line"]')).not.toBeInTheDocument();
        expect(container.querySelector('[data-chart="single"]')).toBeInTheDocument();
        expect(screen.getByText('40 kg')).toBeInTheDocument();
    });

    it('mostra o tooltip do ponto mais próximo ao mover o ponteiro e esconde ao sair', () => {
        const { container } = render(<EvolutionChart data={serie} />);
        const svg = screen.getByRole('img');

        expect(screen.queryByTestId('chart-tooltip')).not.toBeInTheDocument();

        // Largura de reserva: a borda direita cai no último ponto.
        fireEvent.pointerMove(svg, { clientX: 10000, clientY: 10 });
        const tooltip = screen.getByTestId('chart-tooltip');
        expect(tooltip).toHaveTextContent('13/10');
        expect(tooltip).toHaveTextContent('50 kg');
        expect(container.querySelector('[data-chart="cursor"]')).toBeInTheDocument();

        fireEvent.pointerMove(svg, { clientX: 0, clientY: 10 });
        expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('01/09');

        fireEvent.pointerLeave(svg);
        expect(screen.queryByTestId('chart-tooltip')).not.toBeInTheDocument();
        expect(container.querySelector('[data-chart="cursor"]')).not.toBeInTheDocument();
    });

    it('formata carga fracionada com vírgula', () => {
        render(<EvolutionChart data={[ponto('01/09', 47.5)]} />);
        expect(screen.getByText('47,5 kg')).toBeInTheDocument();
    });
});
