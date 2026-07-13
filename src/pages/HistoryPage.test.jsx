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
    SESSION_LIMITS: {
        analyticsGlobalPage: 120
    },
    workoutService: {
        getHistory: vi.fn(),
        getTemplates: vi.fn()
    }
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

    it('contains long mobile filters without expanding the page width', async () => {
        workoutService.getTemplates.mockResolvedValue([
            {
                id: 'long-template',
                name: 'Treino A (Costas, Bíceps e Abdômen)',
                exercises: [{ name: 'Puxada pela frente pronada + puxada pegada supinada (Bi-set)' }]
            }
        ]);

        render(<HistoryPage user={mockUser} />);

        await waitFor(() => {
            expect(screen.getAllByRole('combobox')).toHaveLength(2);
        });

        expect(screen.getByTestId('history-page')).toHaveClass(
            'w-full',
            'min-w-0',
            'max-w-full',
            'overflow-x-clip'
        );
        expect(screen.getByTestId('history-analytics-section')).toHaveClass(
            'min-w-0',
            'max-w-full',
            'overflow-x-clip'
        );

        screen.getAllByRole('combobox').forEach((select) => {
            expect(select).toHaveClass('w-full', 'min-w-0', 'max-w-full', 'overflow-hidden');
        });
    });

    it('selects the first ordered active workout instead of an archived workout', async () => {
        workoutService.getTemplates.mockResolvedValue([
            { id: 'archived', name: 'Treino 1 Antigo', isArchived: true, displayOrder: 0, exercises: [] },
            { id: 'b', name: 'Treino B', displayOrder: 1, exercises: [{ name: 'Remada' }] },
            { id: 'a', name: 'Treino A', displayOrder: 0, exercises: [{ name: 'Supino' }] }
        ]);

        render(<HistoryPage user={mockUser} />);

        await waitFor(() => {
            expect(screen.getAllByRole('combobox')[0]).toHaveValue('Treino A');
        });
    });

    it('switches to journal tab and loads history', async () => {
        render(<HistoryPage user={mockUser} />);

        fireEvent.click(screen.getByText('Diário'));

        await waitFor(() => {
            expect(workoutService.getHistory).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(screen.getByText('Nenhum treino registrado')).toBeInTheDocument();
        });
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
