export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

export function normalizeSets(exSets, exReps, exTarget) {
    let count = 3;
    if (exSets) {
        const parsed = Number(exSets);
        if (!Number.isNaN(parsed) && parsed > 0) count = parsed;
    } else if (exTarget && typeof exTarget === 'string') {
        const match = exTarget.match(/^(\d+)x/i);
        if (match && match[1]) count = parseInt(match[1], 10);
    }

    let defaultReps = exReps || '8-12';
    if (exTarget && typeof exTarget === 'string') {
        const parts = exTarget.split('x');
        if (parts.length > 1) defaultReps = parts[1].trim();
    }

    return Array.from({ length: count }, () => ({
        id: generateId(),
        reps: defaultReps,
        weight: '',
        completed: false
    }));
}

export function mapTemplateExercises(tmplData, lastSessionExercises = []) {
    if (!Array.isArray(tmplData?.exercises)) return [];

    return tmplData.exercises.map(ex => {
        const exId = ex.id || generateId();
        const lastEx = lastSessionExercises.find(le => le.id === exId) ||
            lastSessionExercises.find(le => le.name && ex.name && le.name.trim().toLowerCase() === ex.name.trim().toLowerCase());

        const sets = normalizeSets(ex.sets, ex.reps, ex.target).map((set, idx) => {
            let lastSet = null;
            if (lastEx?.sets?.length > 0) {
                lastSet = idx < lastEx.sets.length
                    ? lastEx.sets[idx]
                    : lastEx.sets[lastEx.sets.length - 1];
            }

            return {
                ...set,
                id: set.id || generateId(),
                completed: false,
                // Sem histórico do exercício, usa a carga-alvo prescrita na ficha (ex.targetWeight).
                weight: lastSet?.weight || ex.targetWeight || set.weight || '',
                reps: lastSet?.reps || set.reps || '',
                targetReps: set.reps || ex.reps,
                targetWeight: lastSet?.weight || ex.targetWeight || '',
                lastWeight: lastSet?.weight || null,
                lastReps: lastSet?.reps || null,
                weightMode: lastSet?.weightMode || set.weightMode || 'total',
                baseWeight: lastSet?.baseWeight || null,
                drops: lastSet?.drops
                    ? lastSet.drops.map(drop => ({
                        ...drop,
                        id: generateId(),
                        completed: false
                    }))
                    : null
            };
        });

        return {
            ...ex,
            id: exId,
            sets,
            notes: lastEx?.notes || ''
        };
    });
}
