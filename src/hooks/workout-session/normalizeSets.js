export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Métodos em cascata cuja execução acontece em reduções encadeadas dentro da MESMA série.
// Bi-set fica de fora de propósito: é agrupamento entre exercícios (groupId), não redução.
const CASCADING_SEED_METHODS = ['Drop-set', 'Rest-Pause', 'Cluster set'];

// Queda de carga sugerida a cada redução do drop-set (20% em cascata sobre a linha do topo).
const DROP_WEIGHT_REDUCTION = 0.2;
// Passo de carga do app (mesmo dos botões +/- no card de execução).
const WEIGHT_STEP = 2.5;

function roundToWeightStep(value) {
    return Math.round(value / WEIGHT_STEP) * WEIGHT_STEP;
}

// Divide um alvo de reps encadeado ("15+12" -> ['15','12']).
// Retorna null se não houver pelo menos 2 segmentos que contenham dígito.
export function parseDropSegments(reps) {
    if (!reps || typeof reps !== 'string') return null;
    const segments = reps
        .split(/\s*\+\s*/)
        .map(s => s.trim())
        .filter(s => /\d/.test(s));
    return segments.length >= 2 ? segments : null;
}

// Monta o array `drops` inicial de um método em cascata a partir do alvo de reps.
// Só semeia para métodos em cascata com reps no formato "X+Y(+Z...)".
// A 1ª redução herda o peso resolvido (histórico/carga-alvo); as demais recebem uma
// queda sugerida (DROP_WEIGHT_REDUCTION em cascata sobre o topo), arredondada ao passo
// do app, que o usuário pode ajustar. Sem carga-base conhecida, as reduções ficam em branco.
export function seedCascadingDrops(method, reps, weight, weightMode) {
    if (!CASCADING_SEED_METHODS.includes(method)) return null;
    const segments = parseDropSegments(reps);
    if (!segments) return null;
    const baseWeight = parseFloat(weight);
    const hasBase = !Number.isNaN(baseWeight) && baseWeight > 0;
    return segments.map((segment, i) => {
        let dropWeight = '';
        if (hasBase) {
            if (i === 0) {
                dropWeight = weight;
            } else {
                const reduced = roundToWeightStep(baseWeight * Math.pow(1 - DROP_WEIGHT_REDUCTION, i));
                dropWeight = reduced > 0 ? String(reduced) : '';
            }
        }
        return {
            id: generateId(),
            weight: dropWeight,
            reps: segment,
            completed: false,
            weightMode: weightMode || 'total',
            baseWeight: null
        };
    });
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

            // Sem histórico do exercício, usa a carga-alvo prescrita na ficha (ex.targetWeight).
            const resolvedWeight = lastSet?.weight || ex.targetWeight || set.weight || '';
            const resolvedWeightMode = lastSet?.weightMode || set.weightMode || 'total';

            return {
                ...set,
                id: set.id || generateId(),
                completed: false,
                weight: resolvedWeight,
                reps: lastSet?.reps || set.reps || '',
                targetReps: set.reps || ex.reps,
                targetWeight: lastSet?.weight || ex.targetWeight || '',
                lastWeight: lastSet?.weight || null,
                lastReps: lastSet?.reps || null,
                weightMode: resolvedWeightMode,
                baseWeight: lastSet?.baseWeight || null,
                // Histórico de drops tem prioridade; sem ele, semeia drop-set/cascata a partir das reps.
                drops: lastSet?.drops
                    ? lastSet.drops.map(drop => ({
                        ...drop,
                        id: generateId(),
                        completed: false
                    }))
                    : seedCascadingDrops(ex.method, set.reps || ex.reps, resolvedWeight, resolvedWeightMode)
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
