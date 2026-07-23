import { describe, expect, it } from 'vitest';
import { nextDisplayOrder, normalizeActiveWorkoutOrder, sortWorkoutTemplates } from './workoutTemplateOrder';

describe('workoutTemplateOrder', () => {
    it('uses natural name order for legacy templates without displayOrder', () => {
        const result = sortWorkoutTemplates([
            { id: 'c', name: 'Treino C' },
            { id: 'a', name: 'Treino A' },
            { id: 'b', name: 'Treino B' }
        ]);

        expect(result.map(template => template.id)).toEqual(['a', 'b', 'c']);
    });

    it('prioritizes saved order and keeps archived templates after active templates', () => {
        const result = sortWorkoutTemplates([
            { id: 'archived', name: 'Treino 1', displayOrder: 0, isArchived: true },
            { id: 'b', name: 'Treino B', displayOrder: 1 },
            { id: 'a', name: 'Treino A', displayOrder: 0 }
        ]);

        expect(result.map(template => template.id)).toEqual(['a', 'b', 'archived']);
    });

    it('normalizes only active templates into contiguous positions', () => {
        const result = normalizeActiveWorkoutOrder([
            { id: 'b', name: 'Treino B', displayOrder: 8 },
            { id: 'archived', name: 'Treino Arquivado', isArchived: true },
            { id: 'a', name: 'Treino A', displayOrder: 3 }
        ]);

        expect(result).toMatchObject([
            { id: 'a', displayOrder: 0 },
            { id: 'b', displayOrder: 1 }
        ]);
    });
});

describe('nextDisplayOrder', () => {
    it('retorna 0 quando não há treinos ativos', () => {
        expect(nextDisplayOrder([])).toBe(0);
        expect(nextDisplayOrder([{ id: 'x', isArchived: true, displayOrder: 5 }])).toBe(0);
    });

    it('não colide quando a sequência tem buracos', () => {
        // Cenário real: o treino da posição 1 foi excluído, sobrando 0 e 2.
        // A contagem daria 2 e duplicaria a posição existente.
        const templates = [
            { id: 'a', name: 'Treino A', displayOrder: 0 },
            { id: 'c', name: 'Treino C', displayOrder: 2 }
        ];

        expect(nextDisplayOrder(templates)).toBe(3);
    });

    it('ignora arquivados ao calcular a próxima posição', () => {
        const templates = [
            { id: 'a', name: 'Treino A', displayOrder: 0 },
            { id: 'arquivado', name: 'Arquivado', displayOrder: 9, isArchived: true }
        ];

        expect(nextDisplayOrder(templates)).toBe(1);
    });

    it('ignora displayOrder ausente ou inválido', () => {
        const templates = [
            { id: 'legado', name: 'Sem ordem' },
            { id: 'a', name: 'Treino A', displayOrder: 4 }
        ];

        expect(nextDisplayOrder(templates)).toBe(5);
    });
});
