import { describe, it, expect } from 'vitest';
import {
    groupLabel,
    groupBehaviorLabel,
    focusGroupBehaviorLabel,
    getGroupRoundPreview,
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

    // O card do exercício já mostra o *nome* do método; o Modo Foco mostra o
    // comportamento, para não repetir a mesma palavra com dois significados.
    it('expõe um rótulo de comportamento distinto do nome do método', () => {
        const info = getGroupInfo(list, 1);
        expect(info.behaviorLabel).toBe('Alterna em trio');
        expect(info.behaviorLabel).not.toBe(info.label);
    });
});

describe('groupBehaviorLabel', () => {
    it('descreve a alternância por tamanho do grupo', () => {
        expect(groupBehaviorLabel(2)).toBe('Alterna em dupla');
        expect(groupBehaviorLabel(3)).toBe('Alterna em trio');
        expect(groupBehaviorLabel(4)).toBe('Alterna em circuito');
        expect(groupBehaviorLabel(7)).toBe('Alterna em circuito');
    });
});

describe('focusGroupBehaviorLabel', () => {
    const withMethod = (id, groupId, method) => ({ id, name: id, method, ...(groupId ? { groupId } : {}) });

    it('retorna null para exercício avulso', () => {
        const list = [withMethod('a', null, 'Convencional')];
        expect(focusGroupBehaviorLabel(list, 0)).toBeNull();
    });

    it('retorna null quando a tag de método do card já descreve o agrupamento', () => {
        const list = [withMethod('a', 'g1', 'Bi-set'), withMethod('b', 'g1', 'Bi-set')];
        expect(focusGroupBehaviorLabel(list, 0)).toBeNull();
    });

    // O caso do botão de corrente e da importação por PDF antiga: só `groupId`,
    // sem method — sem este rótulo nada indicaria a alternância.
    it('retorna o rótulo quando o exercício está agrupado mas o método é Convencional', () => {
        const list = [withMethod('a', 'g1', 'Convencional'), withMethod('b', 'g1', 'Convencional')];
        expect(focusGroupBehaviorLabel(list, 0)).toBe('Alterna em dupla');
    });

    it('retorna o rótulo quando o método descreve um agrupamento diferente do real', () => {
        const list = [
            withMethod('a', 'g1', 'Bi-set'),
            withMethod('b', 'g1', 'Bi-set'),
            withMethod('c', 'g1', 'Bi-set')
        ];
        expect(focusGroupBehaviorLabel(list, 0)).toBe('Alterna em trio');
    });

    it('ignora diferença de caixa e espaços no método', () => {
        const list = [withMethod('a', 'g1', '  bi-SET '), withMethod('b', 'g1', 'Bi-set')];
        expect(focusGroupBehaviorLabel(list, 0)).toBeNull();
    });
});

describe('getGroupRoundPreview', () => {
    // `sets` entra aqui só para o cálculo de `roundNotStarted`.
    const withSets = (id, groupId, completedFlags) => ({
        id,
        name: `Exercício ${id}`,
        ...(groupId ? { groupId } : {}),
        sets: completedFlags.map(completed => ({ completed }))
    });

    const pair = () => [
        withSets('a', 'g1', [false, false]),
        withSets('b', 'g1', [false, false])
    ];

    it('retorna null para exercício avulso', () => {
        const list = [withSets('a', null, [false]), withSets('b', 'g1', [false]), withSets('c', 'g1', [false])];
        expect(getGroupRoundPreview(list, 0)).toBeNull();
    });

    // O rótulo vem do TAMANHO do grupo, nunca do campo `method` — um bi-set
    // feito pelo botão de corrente costuma manter `method: "Convencional"`.
    it('nomeia o grupo pelo tamanho, ignorando o method', () => {
        const list = pair().map(ex => ({ ...ex, method: 'Convencional' }));
        expect(getGroupRoundPreview(list, 0).label).toBe('Bi-set');
    });

    it('lista os membros na ordem e marca o atual', () => {
        const preview = getGroupRoundPreview(pair(), 1);
        expect(preview.members).toEqual([
            { index: 0, name: 'Exercício a', isCurrent: false },
            { index: 1, name: 'Exercício b', isCurrent: true }
        ]);
    });

    it('aponta para o próximo membro do grupo', () => {
        const preview = getGroupRoundPreview(pair(), 0);
        expect(preview.isLastMember).toBe(false);
        expect(preview.nextIndex).toBe(1);
        expect(preview.nextName).toBe('Exercício b');
    });

    // No último membro a volta reinicia no primeiro — é o que
    // `useExecutionNavigation` faz quando ainda restam séries.
    it('no último membro, volta para o primeiro do grupo', () => {
        const preview = getGroupRoundPreview(pair(), 1);
        expect(preview.isLastMember).toBe(true);
        expect(preview.nextIndex).toBe(0);
        expect(preview.nextName).toBe('Exercício a');
    });

    it('roundNotStarted é verdadeiro só enquanto nenhum membro tem série concluída', () => {
        expect(getGroupRoundPreview(pair(), 0).roundNotStarted).toBe(true);

        const started = [
            withSets('a', 'g1', [true, false]),
            withSets('b', 'g1', [false, false])
        ];
        expect(getGroupRoundPreview(started, 0).roundNotStarted).toBe(false);

        // Série concluída no parceiro também conta: a volta já começou.
        const partnerStarted = [
            withSets('a', 'g1', [false, false]),
            withSets('b', 'g1', [true, false])
        ];
        expect(getGroupRoundPreview(partnerStarted, 0).roundNotStarted).toBe(false);
    });

    it('trata exercício sem sets como volta não iniciada', () => {
        const list = [ex('a', 'g1'), ex('b', 'g1')];
        expect(getGroupRoundPreview(list, 0).roundNotStarted).toBe(true);
    });

    it('funciona com grupos maiores que dois', () => {
        const trio = [
            withSets('a', 'g1', [false]),
            withSets('b', 'g1', [false]),
            withSets('c', 'g1', [false])
        ];
        const preview = getGroupRoundPreview(trio, 1);
        expect(preview.label).toBe('Tri-set');
        expect(preview.members).toHaveLength(3);
        expect(preview.nextIndex).toBe(2);
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
