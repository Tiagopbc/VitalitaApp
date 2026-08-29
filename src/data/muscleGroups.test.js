import { describe, it, expect } from 'vitest';
import { MUSCLE_GROUPS, CATALOG_ALIASES, catalogValuesFor, toCanonicalMuscleGroup } from './muscleGroups';

describe('muscleGroups', () => {
    it('tem alias para todos os 10 grupos da tela', () => {
        expect(MUSCLE_GROUPS).toHaveLength(10);
        MUSCLE_GROUPS.forEach(group => {
            expect(CATALOG_ALIASES[group], `sem alias para ${group}`).toBeDefined();
            expect(CATALOG_ALIASES[group].length).toBeGreaterThan(0);
        });
    });

    it('inclui o próprio rótulo nos aliases, para o dia de uma reimportação normalizada', () => {
        MUSCLE_GROUPS.forEach(group => {
            expect(catalogValuesFor(group)).toContain(group);
        });
    });

    it('respeita o limite de 30 disjunções do operador `in` do Firestore', () => {
        MUSCLE_GROUPS.forEach(group => {
            expect(catalogValuesFor(group).length).toBeLessThanOrEqual(30);
        });
    });

    it('traduz "Costas" para a divisão anatômica usada no catálogo', () => {
        const values = catalogValuesFor('Costas');
        expect(values).toEqual(expect.arrayContaining([
            'Dorsais', 'Meio-das-costas', 'Inferior-das-costas', 'Trapezio'
        ]));
    });

    it('cobre as variações sem acento e no plural do catálogo', () => {
        expect(catalogValuesFor('Bíceps')).toContain('Biceps');
        expect(catalogValuesFor('Tríceps')).toContain('Triceps');
        expect(catalogValuesFor('Quadríceps')).toContain('Quadriceps');
        expect(catalogValuesFor('Glúteos')).toContain('Gluteos');
        expect(catalogValuesFor('Panturrilha')).toContain('Panturrilhas');
        expect(catalogValuesFor('Abdômen')).toContain('Abdominais');
        expect(catalogValuesFor('Posteriores')).toContain('Isquiotibiais');
    });

    it('usa o próprio rótulo como fallback para grupo desconhecido', () => {
        expect(catalogValuesFor('Antebraço')).toEqual(['Antebraço']);
    });

    describe('toCanonicalMuscleGroup', () => {
        it('traduz o vocabulário do catálogo para o rótulo da tela', () => {
            expect(toCanonicalMuscleGroup('Isquiotibiais')).toBe('Posteriores');
            expect(toCanonicalMuscleGroup('Meio-das-costas')).toBe('Costas');
            expect(toCanonicalMuscleGroup('Abdominais')).toBe('Abdômen');
            expect(toCanonicalMuscleGroup('Gluteos')).toBe('Glúteos');
        });

        it('ignora caixa e espaços em volta', () => {
            expect(toCanonicalMuscleGroup('peito')).toBe('Peito');
            expect(toCanonicalMuscleGroup('  BICEPS  ')).toBe('Bíceps');
        });

        it('devolve null para valor desconhecido ou vazio', () => {
            expect(toCanonicalMuscleGroup('Antebracos')).toBeNull();
            expect(toCanonicalMuscleGroup('')).toBeNull();
            expect(toCanonicalMuscleGroup(undefined)).toBeNull();
            expect(toCanonicalMuscleGroup(null)).toBeNull();
        });

        it('é idempotente para rótulos que já são canônicos', () => {
            MUSCLE_GROUPS.forEach(group => {
                expect(toCanonicalMuscleGroup(group)).toBe(group);
            });
        });
    });
});
