/**
 * acessibilidade.test.jsx
 * Trava os nomes acessíveis dos botões só-ícone e a associação rótulo → campo.
 * Leitor de tela anuncia "botão" sem nome quando o único filho é um ícone, e
 * um <label> solto ao lado do <input> não chega ao campo: é o que o axe acusa
 * como "button-name" e "label". As consultas por papel/rótulo abaixo falham
 * exatamente nesses dois casos.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../services/workoutService', () => ({
    workoutService: { addCardioSession: vi.fn() }
}));

import MethodModal from '../MethodModal';
import { AddCardioModal } from './AddCardioModal';
import { NumericKeypad } from './common/NumericKeypad';
import { Toast } from './design-system/Toast';
import { WorkoutDetailsModal } from './history/WorkoutDetailsModal';
import { HistoryAnalyticsSection } from './history/HistoryAnalyticsSection';
import { EditProfileModal } from './profile/EditProfileModal';
import { LinkTrainerModal } from './profile/LinkTrainerModal';
import { EditExerciseModal } from './workout/EditExerciseModal';
import { ExerciseCard } from './workout/ExerciseCard';
import { LinearCardCompactV2 } from './execution/LinearCardCompactV2';

describe('botões só-ícone têm nome acessível', () => {
    it('modais e avisos anunciam "Fechar"', () => {
        const { unmount: u1 } = render(<MethodModal methodName="Drop-set" onClose={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
        u1();

        const { unmount: u2 } = render(<AddCardioModal isOpen onClose={vi.fn()} user={{ uid: 'u1' }} />);
        expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
        u2();

        const { unmount: u3 } = render(<Toast message="Oi" onClose={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
        u3();

        const { unmount: u4 } = render(
            <WorkoutDetailsModal session={{ templateName: 'Treino A', exercises: [] }} onClose={vi.fn()} user={{ uid: 'u1' }} />
        );
        // O X do topo e o botão de texto do rodapé fazem a mesma coisa.
        expect(screen.getAllByRole('button', { name: 'Fechar' })).toHaveLength(2);
        u4();

        const { unmount: u5 } = render(
            <EditExerciseModal exercise={{ data: { name: 'Supino' } }} onClose={vi.fn()} onSave={vi.fn()} />
        );
        expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
        u5();
    });

    it('teclado numérico nomeia fechar e apagar', () => {
        render(<NumericKeypad isOpen onClose={vi.fn()} onConfirm={vi.fn()} title="Peso" />);
        expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Apagar' })).toBeInTheDocument();
    });

    it('perfil nomeia fechar e os ajustes da meta semanal', () => {
        render(
            <EditProfileModal
                profile={{ displayName: '', email: '', weight: '', height: '', age: '', weeklyGoal: 3 }}
                onClose={vi.fn()}
                onChange={vi.fn()}
                onSave={vi.fn()}
                onWeeklyGoalDelta={vi.fn()}
            />
        );
        expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Diminuir meta semanal' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Aumentar meta semanal' })).toBeInTheDocument();
    });

    it('card de exercício nomeia o menu de opções', () => {
        render(<ExerciseCard name="Supino" muscleGroup="Peito" onPress={vi.fn()} />);
        expect(screen.getByRole('button', { name: 'Mais opções' })).toBeInTheDocument();
    });

    it('card de execução nomeia os ajustes de peso e repetições e a observação', () => {
        render(
            <LinearCardCompactV2
                exerciseId="e1"
                setId="s1"
                exerciseName="Supino"
                method="Drop-set"
                repsGoal="10"
                currentSet={1}
                totalSets={3}
                completedSets={[false, false, false]}
                weight="20"
                actualReps="10"
                drops={[{ id: 'd1', weight: '20', reps: '10' }, { id: 'd2', weight: '15', reps: '8' }]}
                onUpdateNotes={vi.fn()}
                onCompleteSet={vi.fn()}
                onUpdateSetMultiple={vi.fn()}
                onToggleWeightMode={vi.fn()}
            />
        );
        expect(screen.getAllByRole('button', { name: 'Diminuir peso' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Aumentar peso' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Diminuir repetições' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Aumentar repetições' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Alternar peso por lado' })).toHaveLength(2);
        expect(screen.getByRole('button', { name: 'Remover redução' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Observação' })).toBeInTheDocument();
    });
});

describe('rótulos visuais estão associados ao campo', () => {
    it('cardio', () => {
        render(<AddCardioModal isOpen onClose={vi.fn()} user={{ uid: 'u1' }} />);
        expect(screen.getByLabelText(/Duração \(min\)/)).toBeInTheDocument();
        expect(screen.getByLabelText('Distância (km)')).toBeInTheDocument();
        expect(screen.getByLabelText('Calorias Queimadas')).toBeInTheDocument();
        expect(screen.getByLabelText('Anotações')).toBeInTheDocument();
    });

    it('perfil', () => {
        render(
            <EditProfileModal
                profile={{ displayName: '', email: '', weight: '', height: '', age: '', weeklyGoal: 3 }}
                onClose={vi.fn()}
                onChange={vi.fn()}
                onSave={vi.fn()}
                onWeeklyGoalDelta={vi.fn()}
            />
        );
        for (const label of ['Nome Completo', 'Email', 'Peso (kg)', 'Altura (cm)', 'Idade']) {
            expect(screen.getByLabelText(label)).toBeInTheDocument();
        }
    });

    it('vínculo com personal', () => {
        render(<LinkTrainerModal inviteCode="" onInviteCodeChange={vi.fn()} onConfirm={vi.fn()} onClose={vi.fn()} />);
        expect(screen.getByLabelText('Código de convite')).toBeInTheDocument();
    });

    it('edição de exercício', () => {
        render(<EditExerciseModal exercise={{ data: { name: 'Supino' } }} onClose={vi.fn()} onSave={vi.fn()} />);
        for (const label of ['Nome do Exercício', 'Grupo Muscular', 'Peso (kg)', 'Reps', 'Sets', /Recorde Pessoal/]) {
            expect(screen.getByLabelText(label)).toBeInTheDocument();
        }
    });

    it('filtros da análise do histórico', () => {
        const base = {
            templates: [{ id: 't1', name: 'Treino A' }],
            selectedTemplate: '',
            onTemplateChange: vi.fn(),
            selectedExercise: '',
            onExerciseChange: vi.fn(),
            exerciseOptions: [],
            chartRange: 'all',
            onChartRangeChange: vi.fn(),
            chartData: [],
            historyRows: [],
            prRows: [],
            onSearchModeChange: vi.fn(),
            globalSearchTerm: '',
            onGlobalSearchChange: vi.fn(),
            toggleGlobalExercise: vi.fn()
        };
        const { unmount } = render(<HistoryAnalyticsSection {...base} searchMode="template" />);
        expect(screen.getByLabelText('Rotina')).toBeInTheDocument();
        expect(screen.getByLabelText('Exercício')).toBeInTheDocument();
        unmount();

        render(<HistoryAnalyticsSection {...base} searchMode="global" />);
        expect(screen.getByLabelText('Palavra-chave do Exercício')).toBeInTheDocument();
    });
});
