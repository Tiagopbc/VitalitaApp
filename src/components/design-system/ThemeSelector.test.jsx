import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeSelector } from './ThemeSelector';

describe('ThemeSelector', () => {
    it('mostra as três opções e marca a escolhida', () => {
        render(<ThemeSelector value="system" onChange={vi.fn()} />);

        expect(screen.getByRole('group', { name: 'Tema do aplicativo' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Escuro' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: 'Claro' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: 'Automático, segue o sistema' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('avisa a opção tocada', () => {
        const onChange = vi.fn();
        render(<ThemeSelector value="dark" onChange={onChange} />);

        fireEvent.click(screen.getByRole('button', { name: 'Claro' }));
        expect(onChange).toHaveBeenCalledWith('light');
        fireEvent.click(screen.getByRole('button', { name: 'Automático, segue o sistema' }));
        expect(onChange).toHaveBeenCalledWith('system');
    });
});
