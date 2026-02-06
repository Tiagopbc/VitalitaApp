import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HistoryPage from './HistoryPage';
import { workoutService } from '../services/workoutService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('')]
}));

vi.mock('../services/workoutService', () => ({
    workoutService: {
        getHistory: vi.fn(),
        getTemplates: vi.fn()
    }
}));

vi.mock('../components/design-system/Button', () => ({
    Button: ({ children, onClick, ...props }) => (
        <button onClick={onClick} {...props}>{children}</button>
    )
}));

vi.mock('../components/design-system/PremiumCard', () => ({
    PremiumCard: ({ children, onClick, ...props }) => (
        <div onClick={onClick} {...props}>{children}</div>
    )
}));

vi.mock('../components/analytics/EvolutionChart', () => ({
    EvolutionChart: () => <div>Chart</div>
}));

vi.mock('../components/history/WorkoutDetailsModal', () => ({
    WorkoutDetailsModal: () => <div>WorkoutDetails</div>
}));

describe('HistoryPage', () => {
    const mockUser = { uid: 'user-1' };

    beforeEach(() => {
        vi.clearAllMocks();
        workoutService.getHistory.mockResolvedValue({ data: [], lastDoc: null, hasMore: false });
        workoutService.getTemplates.mockResolvedValue([
            { id: 't1', name: 'Treino A', exercises: [{ name: 'Supino' }] }
        ]);
    });

    it('renders analytics tab by default and loads templates', async () => {
        render(<HistoryPage user={mockUser} />);

        await waitFor(() => {
            expect(workoutService.getTemplates).toHaveBeenCalledWith('user-1');
        });

        expect(screen.getByText('Evolução')).toBeInTheDocument();
    });

    it('switches to journal tab and loads history', async () => {
        render(<HistoryPage user={mockUser} />);

        fireEvent.click(screen.getByText('Diário'));

        await waitFor(() => {
            expect(workoutService.getHistory).toHaveBeenCalled();
        });

        expect(screen.getByText('Nenhum treino registrado ainda.')).toBeInTheDocument();
    });

    it('opens details modal when clicking a session in journal', async () => {
        workoutService.getHistory.mockResolvedValue({
            data: [
                {
                    id: 's1',
                    templateName: 'Treino A',
                    completedAt: { toDate: () => new Date('2024-01-01') },
                    duration: '30min',
                    exercises: [{ name: 'Supino', sets: [{ weight: '40' }] }]
                }
            ],
            lastDoc: null,
            hasMore: false
        });

        render(<HistoryPage user={mockUser} />);
        fireEvent.click(screen.getByText('Diário'));

        await waitFor(() => {
            expect(screen.getByText('Treino A')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Treino A'));
        await waitFor(() => {
            expect(screen.getByText('WorkoutDetails')).toBeInTheDocument();
        });
    });
});
