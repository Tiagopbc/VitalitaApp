/**
 * exerciseList.js
 * Funções puras sobre a lista de exercícios da ficha em edição. Extraídas de
 * CreateWorkoutPage (D18).
 *
 * Agrupamento vem sempre de `groupId`, nunca de `method` (ver o skill
 * method-vs-groupid): o rótulo "Bi-set"/"Tri-set" sai do tamanho do grupo.
 */
import { computeGroupSegments, groupLabel } from '../../utils/exerciseGroups';
import { generateId } from '../../utils/ids';

/**
 * Garante id em todo exercício (fichas antigas podem não ter). Antes isso era
 * um efeito que corrigia a lista depois do primeiro render; agora o id é dado
 * na entrada da lista. Sem nada a corrigir, devolve a mesma lista.
 */
export function withExerciseIds(list) {
    const exercises = list || [];
    if (!exercises.some(ex => !ex.id)) return exercises;
    return exercises.map(ex => ({
        ...ex,
        id: ex.id || generateId()
    }));
}

/** Rótulo de grupo ("Bi-set", "Tri-set"...) por posição na lista. */
export function groupBadgesByIndex(exercises) {
    const badgeByIndex = {};
    computeGroupSegments(exercises).forEach(segment => {
        if (segment.groupId) {
            const label = groupLabel(segment.indices.length);
            segment.indices.forEach(i => { badgeByIndex[i] = label; });
        }
    });
    return badgeByIndex;
}

/**
 * Método "Bi-set" sozinho é só informativo; o que muda a execução é o
 * agrupamento. Devolve o exercício anterior para oferecer o agrupamento, ou
 * null quando não cabe sugerir (primeiro da lista, outro método, já agrupado).
 */
export function bisetPartnerToSuggest(list, exerciseId) {
    const idx = list.findIndex(ex => ex.id === exerciseId);
    if (idx <= 0) return null;
    const current = list[idx];
    if (current.method !== 'Bi-set') return null;
    const previous = list[idx - 1];
    if (current.groupId && current.groupId === previous.groupId) return null;
    return previous;
}
