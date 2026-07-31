/**
 * exerciseGroups.js
 * Agrupamento de exercícios (bi-set/tri-set/circuito).
 * Um grupo é uma sequência CONSECUTIVA de exercícios com o mesmo `groupId`.
 * Na execução, os exercícios do grupo são alternados a cada série, com
 * descanso apenas ao fim de cada volta.
 */

/**
 * Rótulo do grupo pelo tamanho: 2 = Bi-set, 3 = Tri-set, 4+ = Circuito.
 */
export function groupLabel(size) {
    if (size === 2) return 'Bi-set';
    if (size === 3) return 'Tri-set';
    return 'Circuito';
}

/**
 * Rótulo do *comportamento* do grupo, para o Modo Foco.
 *
 * Diferente de `groupLabel`, que dá o nome do método: este descreve o que o
 * app faz — alternar entre os exercícios do grupo a cada série, com descanso
 * só ao fim da volta (ver `useExecutionNavigation`). O card do exercício já
 * mostra uma tag de método (`method`, informativa e digitada pelo usuário);
 * usar o nome também aqui repetiria a mesma palavra com dois significados.
 */
export function groupBehaviorLabel(size) {
    if (size === 2) return 'Alterna em dupla';
    if (size === 3) return 'Alterna em trio';
    return 'Alterna em circuito';
}

/**
 * Divide a lista em segmentos consecutivos.
 * @returns {Array<{ groupId: string|null, indices: number[] }>}
 *          Segmentos com groupId null (ou grupo de 1) são exercícios avulsos.
 */
export function computeGroupSegments(exercises) {
    const segments = [];
    if (!Array.isArray(exercises)) return segments;

    for (let i = 0; i < exercises.length; i++) {
        const gid = exercises[i]?.groupId || null;
        const last = segments[segments.length - 1];
        if (last && gid !== null && last.groupId === gid) {
            last.indices.push(i);
        } else {
            segments.push({ groupId: gid, indices: [i] });
        }
    }

    // Grupo de um único exercício não é grupo.
    return segments.map(segment =>
        segment.indices.length > 1 ? segment : { ...segment, groupId: null }
    );
}

/**
 * Informações do grupo do exercício em `index`, ou null se estiver avulso.
 * @returns {{ indices: number[], firstIndex: number, isLastMember: boolean,
 *             nextMemberIndex: number|null, label: string,
 *             behaviorLabel: string } | null}
 */
export function getGroupInfo(exercises, index) {
    const segments = computeGroupSegments(exercises);
    const segment = segments.find(s => s.groupId !== null && s.indices.includes(index));
    if (!segment) return null;

    const pos = segment.indices.indexOf(index);
    return {
        indices: segment.indices,
        firstIndex: segment.indices[0],
        isLastMember: pos === segment.indices.length - 1,
        nextMemberIndex: pos < segment.indices.length - 1 ? segment.indices[pos + 1] : null,
        label: groupLabel(segment.indices.length),
        behaviorLabel: groupBehaviorLabel(segment.indices.length)
    };
}

/**
 * Rótulo de comportamento a exibir no Modo Foco, ou `null` quando a tag de
 * método do card já descreve o mesmo agrupamento — aí repetir só polui a tela.
 *
 * ⚠️ O `method` entra aqui **apenas para decidir a exibição**. Quem define se
 * existe agrupamento continua sendo o `groupId`, via `getGroupInfo` — nunca o
 * `method`, que é um rótulo informativo e pode estar ausente ou divergente.
 * Ver o skill `method-vs-groupid`.
 *
 * Casos:
 * - `method: "Bi-set"` numa dupla → o card já diz tudo, retorna `null`.
 * - `method: "Convencional"` numa dupla (botão de corrente) → retorna o rótulo,
 *   porque nada mais indicaria que o app vai alternar.
 * - `method: "Bi-set"` num trio → retorna o rótulo, porque o card está
 *   descrevendo um agrupamento diferente do real.
 */
export function focusGroupBehaviorLabel(exercises, index) {
    const group = getGroupInfo(exercises, index);
    if (!group) return null;

    const method = String(exercises?.[index]?.method || '').trim().toLowerCase();
    return method === group.label.toLowerCase() ? null : group.behaviorLabel;
}

/**
 * Resumo da volta do grupo do exercício em `index`, para o Modo Foco.
 *
 * No Modo Foco só um exercício aparece por vez, então nada revela que a
 * conclusão da série vai saltar para outro exercício — que às vezes exige
 * outro equipamento (halter, barra, anilha). Este resumo existe para nomear
 * os companheiros de volta *antes* da primeira série.
 *
 * ⚠️ Tudo aqui deriva do `groupId` (via `getGroupInfo`), inclusive o `label`,
 * que vem do tamanho do grupo. O `method` do exercício não é lido: ele é um
 * rótulo informativo e costuma valer "Convencional" mesmo em grupos criados
 * pelo botão de corrente. Ver o skill `method-vs-groupid`.
 *
 * @returns {{ label: string,
 *             members: Array<{ index: number, name: string, isCurrent: boolean }>,
 *             nextIndex: number, nextName: string,
 *             isLastMember: boolean, roundNotStarted: boolean } | null}
 *          `null` para exercício avulso.
 */
export function getGroupRoundPreview(exercises, index) {
    const group = getGroupInfo(exercises, index);
    if (!group) return null;

    // No último membro a volta reinicia no primeiro do grupo — o mesmo destino
    // que `useExecutionNavigation` escolhe enquanto restam séries.
    const nextIndex = group.nextMemberIndex !== null ? group.nextMemberIndex : group.firstIndex;

    return {
        label: group.label,
        members: group.indices.map(i => ({
            index: i,
            name: exercises[i]?.name || '',
            isCurrent: i === index
        })),
        nextIndex,
        nextName: exercises[nextIndex]?.name || '',
        isLastMember: group.isLastMember,
        roundNotStarted: group.indices.every(
            i => !(exercises[i]?.sets || []).some(set => set?.completed)
        )
    };
}

/**
 * Liga/desliga o exercício em `index` ao grupo do exercício anterior.
 * Retorna uma nova lista (não muta a original).
 */
export function toggleGroupWithPrevious(exercises, index) {
    if (!Array.isArray(exercises) || index <= 0 || index >= exercises.length) {
        return exercises;
    }

    const next = exercises.map(ex => ({ ...ex }));
    const current = next[index];
    const previous = next[index - 1];

    if (current.groupId && current.groupId === previous.groupId) {
        // Desagrupar: o exercício sai do grupo (e leva os seguintes junto,
        // já que grupos são runs consecutivas — normalizeGroups limpa o resto).
        delete current.groupId;
    } else {
        const gid = previous.groupId || `grp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        previous.groupId = gid;
        current.groupId = gid;
    }

    return normalizeGroups(next);
}

/**
 * Remove groupIds órfãos: só mantém o groupId de quem tem um vizinho
 * imediato (anterior ou seguinte) no mesmo grupo.
 */
export function normalizeGroups(exercises) {
    if (!Array.isArray(exercises)) return exercises;

    return exercises.map((ex, i) => {
        if (!ex?.groupId) return ex;
        const prevSame = i > 0 && exercises[i - 1]?.groupId === ex.groupId;
        const nextSame = i < exercises.length - 1 && exercises[i + 1]?.groupId === ex.groupId;
        if (prevSame || nextSame) return ex;
        const cleaned = { ...ex };
        delete cleaned.groupId;
        return cleaned;
    });
}
