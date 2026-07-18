import { describe, it, expect } from 'vitest';
import {
    groupLabel,
    computeGroupSegments,
    getGroupInfo,
    toggleGroupWithPrevious,
    normalizeGroups
} from './exerciseGroups';

const ex = (id, groupId) => (groupId ? { id, name: id, groupId } : { id, name: id });

describe('groupLabel', () => {
    it('nomeia pelo tamanho', () => {
        expect(groupLabel(2)).toBe('Bi-set');
        expect(groupLabel(3)).toBe('Tri-set');
        expect(groupLabel(4)).toBe('Circuito');
    });
});

describe('computeGroupSegments', () => {
    it('separa exercícios avulsos e grupos consecutivos', () => {
        const list = [ex('a'), ex('b', 'g1'), ex('c', 'g1'), ex('d')];
        const segments = computeGroupSegments(list);
        expect(segments).toHaveLength(3);
        expect(segments[0].groupId).toBeNull();
        expect(segments[1]).toEqual({ groupId: 'g1', indices: [1, 2] });
        expect(segments[2].groupId).toBeNull();
    });

    it('groupId não consecutivo não forma grupo', () => {
        const list = [ex('a', 'g1'), ex('b'), ex('c', 'g1')];
        const segments = computeGroupSegments(list);
        expect(segments.every(s => s.groupId === null)).toBe(true);
    });
});

describe('getGroupInfo', () => {
    const list = [ex('a'), ex('b', 'g1'), ex('c', 'g1'), ex('d', 'g1'), ex('e')];

    it('retorna null para exercício avulso', () => {
        expect(getGroupInfo(list, 0)).toBeNull();
        expect(getGroupInfo(list, 4)).toBeNull();
    });

    it('identifica posição e próximo membro do grupo', () => {
        const info = getGroupInfo(list, 1);
        expect(info.label).toBe('Tri-set');
        expect(info.firstIndex).toBe(1);
        expect(info.isLastMember).toBe(false);
        expect(info.nextMemberIndex).toBe(2);
    });

    it('marca o último membro', () => {
        const info = getGroupInfo(list, 3);
        expect(info.isLastMember).toBe(true);
        expect(info.nextMemberIndex).toBeNull();
    });
});

describe('toggleGroupWithPrevious', () => {
    it('cria grupo novo ao ligar com o anterior', () => {
        const result = toggleGroupWithPrevious([ex('a'), ex('b')], 1);
        expect(result[0].groupId).toBeDefined();
        expect(result[0].groupId).toBe(result[1].groupId);
    });

    it('estende grupo existente', () => {
        const list = [ex('a', 'g1'), ex('b', 'g1'), ex('c')];
        const result = toggleGroupWithPrevious(list, 2);
        expect(result[2].groupId).toBe('g1');
    });

    it('desagrupa quando já estão no mesmo grupo', () => {
        const list = [ex('a', 'g1'), ex('b', 'g1')];
        const result = toggleGroupWithPrevious(list, 1);
        expect(result[0].groupId).toBeUndefined();
        expect(result[1].groupId).toBeUndefined();
    });

    it('não muta a lista original', () => {
        const list = [ex('a'), ex('b')];
        toggleGroupWithPrevious(list, 1);
        expect(list[0].groupId).toBeUndefined();
    });

    it('ignora índice inválido', () => {
        const list = [ex('a')];
        expect(toggleGroupWithPrevious(list, 0)).toBe(list);
    });
});

describe('normalizeGroups', () => {
    it('remove groupId órfão após reordenação', () => {
        const list = [ex('a', 'g1'), ex('b'), ex('c', 'g1')];
        const result = normalizeGroups(list);
        expect(result[0].groupId).toBeUndefined();
        expect(result[2].groupId).toBeUndefined();
    });

    it('mantém grupos consecutivos', () => {
        const list = [ex('a', 'g1'), ex('b', 'g1'), ex('c')];
        const result = normalizeGroups(list);
        expect(result[0].groupId).toBe('g1');
        expect(result[1].groupId).toBe('g1');
    });
});
