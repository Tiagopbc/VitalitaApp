import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StatusBarCap } from './StatusBarCap';

const renderCap = () => {
    const { container } = render(<StatusBarCap />);
    return container.querySelector('[data-status-bar-cap]');
};

describe('StatusBarCap', () => {
    it('cobre a largura toda a partir do topo, sem receber toque', () => {
        const cap = renderCap();

        expect(cap.className).toContain('fixed');
        expect(cap.className).toContain('inset-x-0');
        expect(cap.className).toContain('top-0');
        expect(cap.className).toContain('pointer-events-none');
    });

    // A altura é a própria área segura: com `env()` valendo 0 (desktop, aba do
    // Safari) a tampa some sozinha, em vez de virar uma faixa preta à toa.
    it('tem a altura da área segura', () => {
        expect(renderCap().className).toContain('h-[env(safe-area-inset-top)]');
    });

    // Esta é a trava que dá sentido ao componente. De 50 para cima a tampa passa
    // por cima da ExecutionTopBar (z-50) e do TopBanner (z-10000), apagando a
    // barra verde full-bleed; em 40 ou menos ela deixa de cobrir os headers
    // grudentos e o esfumaçado do iOS volta a aparecer.
    it('fica entre os headers grudentos e as barras que pintam o topo', () => {
        const z = Number(renderCap().className.match(/z-\[(\d+)\]/)?.[1]);

        expect(z).toBeGreaterThan(40);
        expect(z).toBeLessThan(50);
    });

    it('é invisível para leitores de tela', () => {
        expect(renderCap()).toHaveAttribute('aria-hidden', 'true');
    });
});
