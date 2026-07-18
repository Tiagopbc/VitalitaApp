import { describe, it, expect } from 'vitest';
import {
    parseRepTarget,
    buildProgressionSuggestion,
    buildProgressionMap,
    suggestedIncrement
} from './progressionSuggestions';

function makeEntry(weight, reps, { completed = true, sets = 3 } = {}) {
    return {
        sets: Array.from({ length: sets }, () => ({ weight, reps, completed }))
    };
}

describe('parseRepTarget', () => {
    it('interpreta faixa "8-12"', () => {
        expect(parseRepTarget('8-12')).toEqual({ min: 8, max: 12 });
    });

    it('interpreta valor único', () => {
        expect(parseRepTarget('12')).toEqual({ min: 12, max: 12 });
        expect(parseRepTarget(10)).toEqual({ min: 10, max: 10 });
    });

    it('retorna null sem números', () => {
        expect(parseRepTarget('falha')).toBeNull();
        expect(parseRepTarget(null)).toBeNull();
    });
});

describe('suggestedIncrement', () => {
    it('2,5kg para cargas leves e 5kg para pesadas', () => {
        expect(suggestedIncrement(30)).toBe(2.5);
        expect(suggestedIncrement(80)).toBe(5);
    });
});

describe('buildProgressionSuggestion', () => {
    it('retorna null sem histórico', () => {
        expect(buildProgressionSuggestion([], '8-12')).toBeNull();
        expect(buildProgressionSuggestion(null, '8-12')).toBeNull();
    });

    it('retorna null para exercício sem carga (peso corporal)', () => {
        expect(buildProgressionSuggestion([makeEntry('', '12')], '8-12')).toBeNull();
    });

    it('sugere aumento quando a meta foi batida em todas as séries', () => {
        const result = buildProgressionSuggestion([makeEntry('40', '12')], '8-12');
        expect(result.type).toBe('increase');
        expect(result.suggestedWeight).toBe(42.5);
        expect(result.message).toContain('42,5');
    });

    it('usa incremento de 5kg em cargas altas', () => {
        const result = buildProgressionSuggestion([makeEntry('100', '12')], '8-12');
        expect(result.suggestedWeight).toBe(105);
    });

    it('sugere consolidar quando a meta ainda não foi batida', () => {
        const result = buildProgressionSuggestion([makeEntry('40', '9')], '8-12');
        expect(result.type).toBe('maintain');
        expect(result.message).toContain('40');
    });

    it('detecta estagnação após 3 sessões na mesma carga sem bater a meta', () => {
        const entries = [
            makeEntry('40', '10'),
            makeEntry('40', '10'),
            makeEntry('40', '9')
        ];
        const result = buildProgressionSuggestion(entries, '8-12');
        expect(result.type).toBe('stagnation');
        expect(result.suggestedWeight).toBe(35);
        expect(result.message).toContain('deload');
    });

    it('não marca estagnação se a carga variou nas últimas sessões', () => {
        const entries = [
            makeEntry('40', '10'),
            makeEntry('37,5', '11'),
            makeEntry('37,5', '12')
        ];
        const result = buildProgressionSuggestion(entries, '8-12');
        expect(result.type).toBe('maintain');
    });

    it('série incompleta não conta para aumento', () => {
        const entry = {
            sets: [
                { weight: '40', reps: '12', completed: true },
                { weight: '40', reps: '12', completed: true },
                { weight: '40', reps: '12', completed: false }
            ]
        };
        const result = buildProgressionSuggestion([entry], '8-12');
        expect(result.type).toBe('maintain');
    });
});

describe('buildProgressionMap', () => {
    const template = [
        { id: 'ex1', name: 'Supino Reto', reps: '8-12' },
        { id: 'ex2', name: 'Agachamento', reps: '10' }
    ];

    it('associa sessões por id do exercício', () => {
        const sessions = [
            { exercises: [{ id: 'ex1', name: 'Supino Reto', ...makeEntry('60', '12') }] }
        ];
        const map = buildProgressionMap(sessions, template);
        expect(map.ex1.type).toBe('increase');
        expect(map.ex2).toBeUndefined();
    });

    it('associa por nome quando o id mudou', () => {
        const sessions = [
            { exercises: [{ id: 'old', name: 'supino reto', ...makeEntry('60', '12') }] }
        ];
        const map = buildProgressionMap(sessions, template);
        expect(map.ex1.type).toBe('increase');
    });

    it('retorna mapa vazio sem sessões', () => {
        expect(buildProgressionMap([], template)).toEqual({});
    });
});
