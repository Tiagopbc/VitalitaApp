import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
