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
 *             nextMemberIndex: number|null, label: string } | null}
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
        label: groupLabel(segment.indices.length)
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
