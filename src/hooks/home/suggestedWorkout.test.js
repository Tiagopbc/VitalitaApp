import { describe, expect, it } from 'vitest';
import { pickSuggestedWorkout } from './suggestedWorkout';

const A = { id: 'a', name: 'Treino A' };
const B = { id: 'b', name: 'Treino B' };
const C = { id: 'c', name: 'Treino C' };
const ARQ = { id: 'x', name: 'Antigo', isArchived: true };

describe('pickSuggestedWorkout', () => {
    it('sem treino ativo devolve null', () => {
        expect(pickSuggestedWorkout([], null)).toBeNull();
        expect(pickSuggestedWorkout([ARQ], null)).toBeNull();
        expect(pickSuggestedWorkout(null, null)).toBeNull();
    });

    it('sem sessão sugere o primeiro ativo', () => {
        expect(pickSuggestedWorkout([ARQ, A, B], null)).toBe(A);
    });

    it('sugere o seguinte ao último treinado e volta ao início no fim da lista', () => {
        expect(pickSuggestedWorkout([A, B, C], { templateId: 'a' })).toBe(B);
        expect(pickSuggestedWorkout([A, B, C], { templateId: 'c' })).toBe(A);
    });

    it('reconhece o último treino pelo nome quando o id não bate', () => {
        expect(pickSuggestedWorkout([A, B], { templateId: 'outro', templateName: 'Treino A' })).toBe(B);
    });

    it('último treino desconhecido sugere o primeiro', () => {
        expect(pickSuggestedWorkout([A, B], { templateId: 'z', templateName: 'Z' })).toBe(A);
    });
});
