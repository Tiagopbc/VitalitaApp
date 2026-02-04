import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrainerDashboard } from './TrainerDashboard';
import { userService } from '../services/userService';
import { getDocs, getDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    doc: vi.fn()
}));

vi.mock('../firebaseConfig', () => ({
    db: {}
}));

vi.mock('../services/userService', () => ({
    userService: {
        unlinkTrainer: vi.fn()
    }
}));

vi.mock('./HistoryPage', () => ({
    default: () => <div>History Embedded</div>
}));

vi.mock('./WorkoutsPage', () => ({
    default: ({ onNavigateToCreate }) => (
        <div>
            <button onClick={() => onNavigateToCreate(null)}>Prescrever Treino</button>
        </div>
    )
}));

vi.mock('../components/design-system/Button', () => ({
    Button: ({ children, onClick, leftIcon, variant, size, ...props }) => (
        <button onClick={onClick} {...props}>
            {children}
        </button>
    )
}));

vi.mock('../components/design-system/PremiumCard', () => ({
    PremiumCard: ({ children, onClick, ...props }) => (
        <div onClick={onClick} {...props}>
            {children}
        </div>
    )
}));

describe('TrainerDashboard', () => {
    const mockUser = { uid: 'trainer-1' };

    beforeEach(() => {
        vi.clearAllMocks();
        getDocs.mockResolvedValue({
            docs: [{ data: () => ({ studentId: 'student-1', linkedAt: { toDate: () => new Date('2024-01-01') } }) }]
        });
        getDoc.mockResolvedValue({
            exists: () => true,
            id: 'student-1',
            data: () => ({ displayName: 'Aluno 1', email: 'a1@example.com' })
        });
        userService.unlinkTrainer.mockResolvedValue();
        navigator.clipboard = { writeText: vi.fn().mockResolvedValue() };
    });

    it('loads and renders students list', async () => {
        render(
            <TrainerDashboard
                user={mockUser}
                onBack={vi.fn()}
                onNavigateToCreateWorkout={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Aluno 1')).toBeInTheDocument();
        });
        expect(screen.getByText('Total Alunos')).toBeInTheDocument();
    });

    it('filters students by search term', async () => {
        render(
            <TrainerDashboard
                user={mockUser}
                onBack={vi.fn()}
                onNavigateToCreateWorkout={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Aluno 1')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('Buscar aluno por nome...');
        fireEvent.change(searchInput, { target: { value: 'nao-existe' } });

        expect(screen.queryByText('Aluno 1')).not.toBeInTheDocument();
        expect(screen.getByText('Nenhum aluno encontrado')).toBeInTheDocument();
    });

    it('opens invite modal and copies code', async () => {
        render(
            <TrainerDashboard
                user={mockUser}
                onBack={vi.fn()}
                onNavigateToCreateWorkout={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Convidar Aluno' }));
        expect(screen.getByRole('heading', { name: 'Convidar Aluno' })).toBeInTheDocument();

        const copyButton = screen.getByTitle('Copiar código');
        fireEvent.click(copyButton);

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('trainer-1');
        });
    });

    it('enters student detail view and unlinks', async () => {
        render(
            <TrainerDashboard
                user={mockUser}
                onBack={vi.fn()}
                onNavigateToCreateWorkout={vi.fn()}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Aluno 1')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Aluno 1'));
        expect(screen.getByText('Treinos Atribuídos')).toBeInTheDocument();

        vi.spyOn(window, 'confirm').mockReturnValue(true);
        fireEvent.click(screen.getByRole('button', { name: 'Desvincular' }));

        await waitFor(() => {
            expect(userService.unlinkTrainer).toHaveBeenCalledWith('student-1', 'trainer-1');
        });
    });
});
