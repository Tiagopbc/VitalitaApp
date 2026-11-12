import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NumericKeypad } from './NumericKeypad';

// O teclado guarda o que foi digitado e, a cada abertura, recomeça do valor
// inicial daquela abertura (não do que sobrou da anterior).
function abrir(props) {
    return render(<NumericKeypad onClose={vi.fn()} onConfirm={vi.fn()} title="Peso" {...props} />);
}

describe('NumericKeypad', () => {
    it('abre mostrando o valor inicial como texto', () => {
        abrir({ isOpen: true, initialValue: 40 });
        expect(screen.getByText('40')).toBeInTheDocument();
    });

    it('confirma o que foi digitado', () => {
        const onConfirm = vi.fn();
        abrir({ isOpen: true, initialValue: '', onConfirm });
        fireEvent.click(screen.getByRole('button', { name: '5' }));
        fireEvent.click(screen.getByRole('button', { name: '0' }));
        fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
        expect(onConfirm).toHaveBeenCalledWith('50');
    });

    it('ao reabrir, descarta o que foi digitado e usa o novo valor inicial', () => {
        const { rerender } = abrir({ isOpen: true, initialValue: '20' });
        fireEvent.click(screen.getByRole('button', { name: '5' }));
        expect(screen.getByText('205')).toBeInTheDocument();

        rerender(<NumericKeypad isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} title="Peso" initialValue="20" />);
        rerender(<NumericKeypad isOpen onClose={vi.fn()} onConfirm={vi.fn()} title="Peso" initialValue="30" />);

        expect(screen.queryByText('205')).not.toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument();
    });
});
