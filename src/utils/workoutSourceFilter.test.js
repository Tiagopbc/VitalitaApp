import { describe, it, expect } from 'vitest';
import { countBySourceFilter, matchesSourceFilter } from './workoutSourceFilter';

const UID = 'user123';

const workouts = [
    { id: 'a', createdBy: UID },
    { id: 'b', createdBy: 'trainer-1' },
    { id: 'c' }, // ficha antiga, sem createdBy
    { id: 'd', createdBy: UID, isArchived: true }
];

describe('matchesSourceFilter', () => {
    it('esconde arquivados em todas as abas menos a própria', () => {
        expect(matchesSourceFilter(workouts[3], 'all', UID)).toBe(false);
        expect(matchesSourceFilter(workouts[3], 'meus', UID)).toBe(false);
        expect(matchesSourceFilter(workouts[3], 'arquivados', UID)).toBe(true);
    });

    // Ficha sem createdBy é de antes do campo existir: conta como do usuário.
    it('trata ficha sem dono como do próprio usuário', () => {
        expect(matchesSourceFilter(workouts[2], 'meus', UID)).toBe(true);
        expect(matchesSourceFilter(workouts[2], 'personal', UID)).toBe(false);
    });

    it('separa o que veio do personal', () => {
        expect(matchesSourceFilter(workouts[1], 'personal', UID)).toBe(true);
        expect(matchesSourceFilter(workouts[0], 'personal', UID)).toBe(false);
    });
});

describe('countBySourceFilter', () => {
    it('conta cada aba do mesmo jeito que a lista filtra', () => {
        expect(countBySourceFilter(workouts, UID)).toEqual({
            all: 3,
            meus: 2,
            personal: 1,
            arquivados: 1
        });
    });

    it('devolve zeros sem fichas', () => {
        expect(countBySourceFilter([], UID)).toEqual({
            all: 0, meus: 0, personal: 0, arquivados: 0
        });
    });
});
