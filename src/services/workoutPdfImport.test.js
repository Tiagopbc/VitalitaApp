import { describe, it, expect, vi } from 'vitest';

// Evita tocar o Firebase real ao importar o módulo (o topo importa ../firebaseAuth).
vi.mock('../firebaseAuth', () => ({ auth: { currentUser: null } }));

const { assignGroupIds } = await import('./workoutPdfImport');

describe('assignGroupIds', () => {
    it('liga um bi-set: os dois exercícios compartilham o mesmo groupId', () => {
        const out = assignGroupIds([
            { name: 'Puxada pronada', groupedWithPrevious: false },
            { name: 'Puxada supinada', groupedWithPrevious: true }
        ]);
        expect(out[0].groupId).toBeDefined();
        expect(out[0].groupId).toBe(out[1].groupId);
    });

    it('liga um tri-set: os três exercícios na mesma cadeia', () => {
        const out = assignGroupIds([
            { name: 'A', groupedWithPrevious: false },
            { name: 'B', groupedWithPrevious: true },
            { name: 'C', groupedWithPrevious: true }
        ]);
        expect(out[0].groupId).toBe(out[1].groupId);
        expect(out[1].groupId).toBe(out[2].groupId);
    });

    it('exercício avulso não recebe groupId', () => {
        const out = assignGroupIds([{ name: 'Supino', groupedWithPrevious: false }]);
        expect(out[0].groupId).toBeUndefined();
    });

    it('grupos distintos recebem ids distintos', () => {
        const out = assignGroupIds([
            { name: 'A1', groupedWithPrevious: false },
            { name: 'A2', groupedWithPrevious: true },
            { name: 'Solo', groupedWithPrevious: false },
            { name: 'B1', groupedWithPrevious: false },
            { name: 'B2', groupedWithPrevious: true }
        ]);
        expect(out[0].groupId).toBe(out[1].groupId);
        expect(out[2].groupId).toBeUndefined();
        expect(out[3].groupId).toBe(out[4].groupId);
        expect(out[0].groupId).not.toBe(out[3].groupId);
    });

    it('remove a marca groupedWithPrevious do resultado', () => {
        const out = assignGroupIds([
            { name: 'A', groupedWithPrevious: false },
            { name: 'B', groupedWithPrevious: true }
        ]);
        expect(out[0]).not.toHaveProperty('groupedWithPrevious');
        expect(out[1]).not.toHaveProperty('groupedWithPrevious');
    });
});
