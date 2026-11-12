import { describe, expect, it } from 'vitest';
import {
    buildWorkoutCopy,
    filterWorkouts,
    formatWorkoutTemplate,
    placeCopyInOrder,
    reorderActiveWorkouts
} from './workoutList';

const ts = (iso) => ({ toDate: () => new Date(iso) });

describe('formatWorkoutTemplate', () => {
    it('monta o card com contagem, data do último treino e valores padrão', () => {
        const card = formatWorkoutTemplate({
            id: 'w1', name: 'Peito', exercises: [{ name: 'Supino' }, { name: 'Crucifixo' }],
            lastPerformed: ts('2026-11-09T12:00:00'), createdBy: 'u1', displayOrder: 2
        });
        expect(card).toMatchObject({
            id: 'w1', name: 'Peito', exercisesCount: 2, duration: '45-60min', muscleGroups: [],
            lastPerformed: '09/11/2026', frequency: '1x/sem', timesPerformed: 0, isFavorite: false,
            category: 'fullbody', createdBy: 'u1', completedToday: false, isArchived: false, displayOrder: 2
        });
        expect(card.lastPerformedDate).toEqual(new Date('2026-11-09T12:00:00'));
    });

    it('sem último treino mostra "Nunca" e displayOrder inválido vira null', () => {
        const card = formatWorkoutTemplate({ id: 'w2', name: 'Costas', displayOrder: 1.5, isArchived: 1 });
        expect(card).toMatchObject({ exercisesCount: 0, exercises: [], lastPerformed: 'Nunca', lastPerformedDate: null, displayOrder: null, isArchived: true });
    });
});

describe('filterWorkouts', () => {
    const lista = [
        { id: 'a', name: 'Treino Peito', muscleGroups: ['Peito'], createdBy: 'u1', displayOrder: 1 },
        { id: 'b', name: 'Treino Costas', muscleGroups: ['Costas'], createdBy: 'coach', assignedByTrainer: true, displayOrder: 0 },
        { id: 'c', name: 'Pernas', muscleGroups: ['Quadríceps'], createdBy: 'u1', isArchived: true, displayOrder: null }
    ];

    it('busca pelo nome ou pelo grupo muscular, sem diferenciar maiúsculas', () => {
        expect(filterWorkouts(lista, 'COSTAS', 'all', 'u1').map(w => w.id)).toEqual(['b']);
        expect(filterWorkouts(lista, 'peito', 'all', 'u1').map(w => w.id)).toEqual(['a']);
    });

    it('sem busca devolve a lista do filtro na ordem das fichas', () => {
        const todos = filterWorkouts(lista, '', 'all', 'u1').map(w => w.id);
        expect(todos.slice(0, 2)).toEqual(['b', 'a']);
    });
});

describe('reorderActiveWorkouts', () => {
    const lista = [
        { id: 'a', name: 'A', displayOrder: 0 },
        { id: 'b', name: 'B', displayOrder: 1 },
        { id: 'x', name: 'X', displayOrder: 2, isArchived: true },
        { id: 'c', name: 'C', displayOrder: 3 }
    ];

    it('move para baixo e para cima e renumera só os ativos', () => {
        expect(reorderActiveWorkouts(lista, 'a', 1).map(w => [w.id, w.displayOrder])).toEqual([['b', 0], ['a', 1], ['c', 2]]);
        expect(reorderActiveWorkouts(lista, 'c', -1).map(w => [w.id, w.displayOrder])).toEqual([['a', 0], ['c', 1], ['b', 2]]);
    });

    it('nas bordas, para treino arquivado ou desconhecido devolve null', () => {
        expect(reorderActiveWorkouts(lista, 'a', -1)).toBeNull();
        expect(reorderActiveWorkouts(lista, 'c', 1)).toBeNull();
        expect(reorderActiveWorkouts(lista, 'x', 1)).toBeNull();
        expect(reorderActiveWorkouts(lista, 'zzz', 1)).toBeNull();
    });
});

describe('cópia de treino', () => {
    const original = { id: 'w1', name: 'Peito', exercises: [{ name: 'Supino' }], muscleGroups: ['Peito'], duration: '50min', category: 'push', displayOrder: 0 };

    it('a cópia nasce do usuário, ativa, sem histórico e na posição pedida', () => {
        expect(buildWorkoutCopy({ id: 'w1-copy', name: 'Peito (Cópia)', workout: original, uid: 'u1', displayOrder: 2 })).toEqual({
            id: 'w1-copy', name: 'Peito (Cópia)', exercisesCount: 1, exercises: [{ name: 'Supino' }], duration: '50min',
            muscleGroups: ['Peito'], lastPerformed: 'Nunca', lastPerformedDate: null, frequency: '1x/sem',
            timesPerformed: 0, isFavorite: false, category: 'push', createdBy: 'u1', assignedByTrainer: false,
            completedToday: false, isArchived: false, displayOrder: 2
        });
    });

    it('a cópia entra logo abaixo do original e a lista é renumerada', () => {
        const lista = [original, { id: 'w2', name: 'Costas', displayOrder: 1 }];
        const copia = { id: 'w1-copy', name: 'Peito (Cópia)', displayOrder: 2 };
        expect(placeCopyInOrder(lista, original, copia).map(w => [w.id, w.displayOrder])).toEqual([['w1', 0], ['w1-copy', 1], ['w2', 2]]);
    });
});
