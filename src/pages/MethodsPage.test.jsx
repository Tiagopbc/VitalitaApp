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
    Button: (props) => {
        const { children, onClick, disabled, loading, ...rest } = props;
        delete rest.leftIcon;
        delete rest.rightIcon;
        delete rest.variant;
        delete rest.size;
        delete rest.fullWidth;
        return (
            <button onClick={onClick} disabled={disabled || loading} {...rest}>
                {children}
            </button>
        );
    }
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
