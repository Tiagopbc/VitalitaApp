import { describe, expect, it } from 'vitest';
import { normalizeActiveWorkoutOrder, sortWorkoutTemplates } from './workoutTemplateOrder';

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
