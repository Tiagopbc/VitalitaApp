import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BottomNavEnhanced } from './BottomNavEnhanced';

// Um indicador só, que desliza para a aba ativa (antes, layoutId do
// framer-motion). Na Home, que é o botão central, ele some.
describe('BottomNavEnhanced', () => {
    const indicador = () => screen.getByTestId('active-tab-indicator');

    it('o indicador acompanha a aba ativa', () => {
        const { rerender } = render(<BottomNavEnhanced activeTab="workouts" onTabChange={vi.fn()} />);
        expect(indicador()).toHaveAttribute('data-tab', 'workouts');
        expect(indicador()).toHaveAttribute('data-visible', 'true');

        rerender(<BottomNavEnhanced activeTab="history" onTabChange={vi.fn()} />);
        expect(indicador()).toHaveAttribute('data-tab', 'history');
        expect(indicador()).toHaveAttribute('data-visible', 'true');
    });

    it('some na Home, que tem destaque próprio', () => {
        render(<BottomNavEnhanced activeTab="home" onTabChange={vi.fn()} />);
        expect(indicador()).toHaveAttribute('data-visible', 'false');
    });

    it('tocar numa aba avisa a troca', () => {
        const onTabChange = vi.fn();
        render(<BottomNavEnhanced activeTab="home" onTabChange={onTabChange} />);
        fireEvent.click(screen.getByText('Perfil'));
        expect(onTabChange).toHaveBeenCalledWith('profile');
    });
});

// Com as fontes já carregadas, `document.fonts.ready` é uma promessa resolvida:
// reposicionar nela a cada troca de aba apagaria a transição antes da pintura
// e o indicador pularia em vez de deslizar (achado da revisão no #178).
describe('BottomNavEnhanced — fontes', () => {
    const original = Object.getOwnPropertyDescriptor(document, 'fonts');
    const definirFontes = (fonts) => Object.defineProperty(document, 'fonts', { configurable: true, value: fonts });
    afterEach(() => {
        if (original) Object.defineProperty(document, 'fonts', original);
        else delete document.fonts;
    });

    it('com as fontes carregadas, trocar de aba mantém a transição de deslize', async () => {
        definirFontes({ status: 'loaded', ready: Promise.resolve() });
        const { rerender } = render(<BottomNavEnhanced activeTab="workouts" onTabChange={vi.fn()} />);
        rerender(<BottomNavEnhanced activeTab="history" onTabChange={vi.fn()} />);
        await Promise.resolve();
        await Promise.resolve();
        expect(screen.getByTestId('active-tab-indicator').style.transition).toMatch(/transform/);
    });

    it('com as fontes ainda carregando, reposiciona sem transição quando elas chegam', async () => {
        let chegou;
        definirFontes({ status: 'loading', ready: new Promise((resolve) => { chegou = resolve; }) });
        render(<BottomNavEnhanced activeTab="workouts" onTabChange={vi.fn()} />);
        chegou();
        await Promise.resolve();
        await Promise.resolve();
        expect(screen.getByTestId('active-tab-indicator').style.transition).toBe('none');
    });
});

