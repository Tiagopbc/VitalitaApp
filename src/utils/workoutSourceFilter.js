/**
 * Filtro de origem das fichas em "Meus Treinos".
 * Fonte única de verdade: a lista e os contadores dos chips leem daqui para
 * não divergirem.
 */

export const SOURCE_FILTERS = [
    { id: 'all', label: 'Todos' },
    { id: 'meus', label: 'Meus Treinos' },
    { id: 'personal', label: 'Personal Play' },
    { id: 'arquivados', label: 'Arquivados' }
];

/**
 * Arquivados só aparecem na própria aba; nas outras ficam sempre escondidos.
 * @param {Object} workout
 * @param {string} filter Id de `SOURCE_FILTERS`.
 * @param {string} uid Usuário logado.
 */
export function matchesSourceFilter(workout, filter, uid) {
    if (filter === 'arquivados') return Boolean(workout.isArchived);
    if (workout.isArchived) return false;
    if (filter === 'meus') return workout.createdBy === uid || !workout.createdBy;
    if (filter === 'personal') return Boolean(workout.createdBy) && workout.createdBy !== uid;
    return true;
}

/**
 * Quantas fichas cada filtro tem. Ignora a busca de propósito: piscando a cada
 * tecla digitada, o contador atrapalharia mais do que informaria.
 * @returns {Record<string, number>}
 */
export function countBySourceFilter(workouts = [], uid) {
    return SOURCE_FILTERS.reduce((counts, { id }) => ({
        ...counts,
        [id]: workouts.filter(workout => matchesSourceFilter(workout, id, uid)).length
    }), {});
}
