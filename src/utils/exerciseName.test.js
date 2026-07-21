import { describe, it, expect } from 'vitest';
import { normalizeExerciseName, aggregateExerciseMaxes } from './exerciseName';

describe('normalizeExerciseName', () => {
    it('ignora caixa, acentos e o símbolo de grau', () => {
        expect(normalizeExerciseName('Leg Press 45°')).toBe('leg press 45');
        expect(normalizeExerciseName('leg press 45')).toBe('leg press 45');
        expect(normalizeExerciseName('LEG PRESS 45º')).toBe('leg press 45');
        expect(normalizeExerciseName('Agachamento Búlgaro')).toBe('agachamento bulgaro');
    });

    it('colapsa espaços e pontuação', () => {
        expect(normalizeExerciseName('  Supino   Reto  ')).toBe('supino reto');
        expect(normalizeExerciseName('Puxada-Alta')).toBe('puxada alta');
    });

    it('lida com entrada inválida', () => {
        expect(normalizeExerciseName(null)).toBe('');
        expect(normalizeExerciseName(undefined)).toBe('');
        expect(normalizeExerciseName(42)).toBe('');
    });
});

describe('aggregateExerciseMaxes', () => {
    it('funde grafias diferentes do mesmo exercício mantendo o maior peso', () => {
        const result = aggregateExerciseMaxes({
            'Leg Press 45°': 130,
            'leg press 45': 120
        });

        expect(result).toHaveLength(1);
        expect(result[0].weight).toBe(130);
        // Mantém o rótulo mais completo (com o símbolo de grau).
        expect(result[0].name).toBe('Leg Press 45°');
    });

    it('mantém o maior peso mesmo quando vem na segunda grafia', () => {
        const result = aggregateExerciseMaxes({
            'leg press 45': 150,
            'Leg Press 45°': 130
        });

        expect(result).toHaveLength(1);
        expect(result[0].weight).toBe(150);
    });

    it('preserva exercícios distintos', () => {
        const result = aggregateExerciseMaxes({
            'Leg Press 45°': 130,
            'Agachamento Smith': 110,
            'Agachamento No Hack': 100
        });

        expect(result).toHaveLength(3);
        expect(result.map(r => r.weight).sort((a, b) => b - a)).toEqual([130, 110, 100]);
    });

    it('ignora entradas vazias ou inválidas', () => {
        expect(aggregateExerciseMaxes(null)).toEqual([]);
        expect(aggregateExerciseMaxes({})).toEqual([]);
        expect(aggregateExerciseMaxes({ '   ': 100 })).toEqual([]);
    });
});
