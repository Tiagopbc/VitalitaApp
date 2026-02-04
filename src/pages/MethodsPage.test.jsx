import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MethodsPage from './MethodsPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: {} })
}));

vi.mock('../components/design-system/Button', () => ({
    Button: ({ children, onClick }) => (
        <button onClick={onClick}>{children}</button>
    )
}));

describe('MethodsPage', () => {
    it('renders methods list', () => {
        render(<MethodsPage />);
        expect(screen.getByText('Métodos de Treino')).toBeInTheDocument();
        expect(screen.getByText('Drop-set')).toBeInTheDocument();
        expect(screen.getByText('Cardio 140 bpm')).toBeInTheDocument();
    });

    it('navigates back when clicking voltar', () => {
        render(<MethodsPage />);
        fireEvent.click(screen.getByText('VOLTAR'));
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
});
